"""
Moderation service for paper quality control and community filtering.

Implements:
1. Baseline checks (spam, plagiarism, non-research detection)
2. AI heuristic scoring (quality assessment) - LLM-powered
3. Red flag detection (LLM babble patterns) - LLM-powered
4. Visibility tier assignment
"""

import re
from typing import Dict, List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.paper import Paper, BaselineStatus, VisibilityTier
from app.services.openrouter import OpenRouterClient
from app.core.config import settings


class ModerationService:
    """Service for paper moderation and quality control"""

    # Spam detection patterns
    SPAM_PATTERNS = [
        r'(?i)(buy|sell|discount|offer|click here|limited time)',
        r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+',  # URLs
        r'(?i)(viagra|casino|lottery|prize|winner)',
    ]

    # Non-research indicators
    NON_RESEARCH_PATTERNS = [
        r'^(hello|hi|test|testing)[\s\w]*$',
        r'^.{0,50}$',  # Too short
    ]

    # LLM babble patterns
    LLM_BABBLE_PATTERNS = [
        r'(?i)(delve|tapestry|realm|leverage|nuance|paradigm shift)',
        r'(?i)(it is important to note|as we can see|in conclusion, it is clear)',
        r'(\w+\s+){5,}\1',  # Repetitive phrases
    ]

    # Quality indicators
    QUALITY_INDICATORS = {
        'has_abstract': 10,
        'has_introduction': 5,
        'has_methodology': 10,
        'has_results': 10,
        'has_conclusion': 5,
        'has_references': 15,
        'has_figures': 10,
        'has_tables': 5,
        'has_code': 5,
        'has_equations': 5,
        'sufficient_length': 10,  # >2000 words
        'proper_structure': 10,  # Multiple sections
        'verified_email': 15,  # Verified institutional/academic email
        'edu_email': 10,  # .edu email domain
        'research_org_email': 8,  # Known research organization email
    }

    # Known research organization domains
    RESEARCH_ORG_DOMAINS = {
        'openai.com', 'anthropic.com', 'deepmind.com', 'google.com',
        'microsoft.com', 'meta.com', 'apple.com', 'amazon.com',
        'ibm.com', 'nvidia.com', 'intel.com', 'adobe.com',
        'baidu.com', 'tencent.com', 'alibaba.com',
    }

    # Academic/educational TLDs
    EDU_TLDS = {'.edu', '.ac.uk', '.edu.au', '.edu.cn', '.ac.jp', '.edu.sg'}

    def __init__(self, db: AsyncSession, use_llm: bool = True):
        self.db = db
        self.use_llm = use_llm and settings.OPENROUTER_API_KEY is not None
        if self.use_llm:
            self.llm_client = OpenRouterClient()
        else:
            self.llm_client = None

    async def run_baseline_checks(self, paper: Paper) -> Dict:
        """
        Run baseline checks on a paper submission.

        Returns dict with:
        - status: 'pass', 'warn', 'reject'
        - checks: detailed check results
        - issues: list of identified problems
        """
        checks = {
            'spam_check': await self._check_spam(paper),
            'plagiarism_check': await self._check_plagiarism(paper),
            'research_check': await self._check_is_research(paper),
        }

        issues = []
        for check_name, result in checks.items():
            if not result['passed']:
                issues.extend(result.get('issues', []))

        # Determine overall status
        if any(c['severity'] == 'critical' for c in checks.values() if not c['passed']):
            status = BaselineStatus.REJECT.value
        elif any(not c['passed'] for c in checks.values()):
            status = BaselineStatus.WARN.value
        else:
            status = BaselineStatus.PASS.value

        return {
            'status': status,
            'checks': checks,
            'issues': issues
        }

    async def _check_spam(self, paper: Paper) -> Dict:
        """Check for spam indicators using LLM (if available) + pattern matching"""
        content = f"{paper.title} {paper.abstract}"

        # Pattern-based check (fallback)
        spam_indicators = []
        for pattern in self.SPAM_PATTERNS:
            matches = re.findall(pattern, content)
            if matches:
                spam_indicators.append(f"Pattern matched: {pattern[:30]}...")

        # LLM-based spam detection (more accurate)
        if self.use_llm and self.llm_client:
            try:
                llm_result = await self.llm_client.check_spam_content(
                    paper.title,
                    paper.abstract
                )

                if llm_result.get("is_spam") and llm_result.get("confidence", 0) > 0.7:
                    spam_indicators.extend(llm_result.get("reasons", []))
                    passed = False
                else:
                    # If LLM says not spam, trust it even if patterns matched
                    passed = len(spam_indicators) <= 1  # Allow 1 minor match
            except Exception as e:
                print(f"LLM spam check failed, using pattern-only: {e}")
                passed = len(spam_indicators) == 0
        else:
            passed = len(spam_indicators) == 0

        return {
            'passed': passed,
            'severity': 'critical' if len(spam_indicators) > 2 else 'warning',
            'issues': spam_indicators,
            'score': 0 if not passed else 100
        }

    async def _check_plagiarism(self, paper: Paper) -> Dict:
        """
        Basic plagiarism check using fuzzy matching against existing papers.
        For production, integrate with external plagiarism detection API.
        """
        # Get similar papers by title/abstract
        result = await self.db.execute(
            select(Paper)
            .where(Paper.id != paper.id)
            .where(Paper.baseline_status != BaselineStatus.REJECT)
        )
        existing_papers = result.scalars().all()

        # Simple similarity check (in production, use proper text similarity)
        similar_papers = []
        for existing in existing_papers[:100]:  # Limit for performance
            # Simple heuristic: check if titles are very similar
            if self._text_similarity(paper.title, existing.title) > 0.8:
                similar_papers.append(existing.id)

        passed = len(similar_papers) == 0
        return {
            'passed': passed,
            'severity': 'critical' if similar_papers else 'info',
            'issues': [f"Similar to {len(similar_papers)} existing papers"] if similar_papers else [],
            'similar_papers': similar_papers[:5],
            'score': 0 if not passed else 100
        }

    async def _check_is_research(self, paper: Paper) -> Dict:
        """Check if submission appears to be actual research content"""
        content = f"{paper.title} {paper.abstract}"

        non_research_indicators = []
        for pattern in self.NON_RESEARCH_PATTERNS:
            if re.match(pattern, content, re.IGNORECASE):
                non_research_indicators.append(f"Matched non-research pattern")

        # Check for minimum content
        if len(paper.abstract) < 100:
            non_research_indicators.append("Abstract too short (<100 chars)")

        passed = len(non_research_indicators) == 0
        return {
            'passed': passed,
            'severity': 'critical' if non_research_indicators else 'info',
            'issues': non_research_indicators,
            'score': 0 if not passed else 100
        }

    def _check_email_verification(self, email: str, is_verified: bool) -> Dict:
        """
        Check email verification status and domain credibility.

        Returns dict with:
        - verified: bool
        - domain_type: 'edu' | 'research_org' | 'other'
        - bonus_points: int
        """
        domain = email.split('@')[-1].lower() if '@' in email else ''

        result = {
            'verified': is_verified,
            'email_domain': domain,
            'domain_type': 'other',
            'bonus_points': 0
        }

        if not domain:
            return result

        # Check if verified email
        if is_verified:
            result['bonus_points'] += self.QUALITY_INDICATORS['verified_email']
            result['verified'] = True

        # Check if educational domain
        for edu_tld in self.EDU_TLDS:
            if domain.endswith(edu_tld):
                result['domain_type'] = 'edu'
                result['bonus_points'] += self.QUALITY_INDICATORS['edu_email']
                break

        # Check if known research org
        if result['domain_type'] == 'other' and domain in self.RESEARCH_ORG_DOMAINS:
            result['domain_type'] = 'research_org'
            result['bonus_points'] += self.QUALITY_INDICATORS['research_org_email']

        return result

    async def calculate_quality_score(self, paper: Paper, pdf_base64: Optional[str] = None) -> Tuple[int, Dict]:
        """
        Calculate AI-assisted quality score (0-100) using LLM.

        Returns (score, analysis_details)
        """
        # Try LLM-based scoring first (most accurate)
        if self.use_llm and self.llm_client:
            try:
                # Include PDF in LLM analysis
                llm_analysis = await self.llm_client.analyze_paper_quality(
                    title=paper.title,
                    abstract=paper.abstract,
                    pdf_base64=pdf_base64,
                    metadata=paper.meta
                )

                score = llm_analysis.get('quality_score', 50)

                # Add email verification bonus to LLM score
                if paper.submitter:
                    email_check = self._check_email_verification(
                        paper.submitter.email,
                        paper.submitter.is_verified
                    )
                    score += email_check['bonus_points']

                    analysis = {
                        'method': 'llm',
                        'llm_analysis': llm_analysis,
                        'category_scores': llm_analysis.get('category_scores', {}),
                        'strengths': llm_analysis.get('strengths', []),
                        'weaknesses': llm_analysis.get('weaknesses', []),
                        'suggestions': llm_analysis.get('suggestions', []),
                        'email_verification': email_check
                    }
                else:
                    analysis = {
                        'method': 'llm',
                        'llm_analysis': llm_analysis,
                        'category_scores': llm_analysis.get('category_scores', {}),
                        'strengths': llm_analysis.get('strengths', []),
                        'weaknesses': llm_analysis.get('weaknesses', []),
                        'suggestions': llm_analysis.get('suggestions', [])
                    }

                return min(max(score, 0), 100), analysis

            except Exception as e:
                print(f"LLM quality scoring failed, falling back to heuristics: {e}")

        # Fallback to heuristic scoring
        score = 0
        analysis = {'method': 'heuristic'}

        # Check email verification and add bonus
        if paper.submitter:
            email_check = self._check_email_verification(
                paper.submitter.email,
                paper.submitter.is_verified
            )
            score += email_check['bonus_points']
            analysis['email_verification'] = email_check

        content = f"{paper.title}\n{paper.abstract}"

        # Check for structural elements
        if paper.abstract and len(paper.abstract) > 100:
            score += self.QUALITY_INDICATORS['has_abstract']
            analysis['has_abstract'] = True

        # Check for section indicators in abstract or metadata
        sections = ['introduction', 'method', 'result', 'conclusion', 'reference']
        for section in sections:
            if re.search(rf'\b{section}', content, re.IGNORECASE):
                key = f'has_{section}'
                if key in self.QUALITY_INDICATORS:
                    score += self.QUALITY_INDICATORS[key]
                    analysis[key] = True

        # Check metadata for additional quality signals
        if paper.meta:
            if paper.meta.get('figures'):
                score += self.QUALITY_INDICATORS['has_figures']
                analysis['has_figures'] = True

            if paper.meta.get('tables'):
                score += self.QUALITY_INDICATORS['has_tables']
                analysis['has_tables'] = True

        # Check if code/data URLs are provided
        if paper.code_url:
            score += self.QUALITY_INDICATORS['has_code']
            analysis['has_code'] = True

        # Length check
        word_count = len(content.split())
        if word_count > 200:  # Adjust threshold
            score += self.QUALITY_INDICATORS['sufficient_length']
            analysis['sufficient_length'] = True
            analysis['word_count'] = word_count

        return min(score, 100), analysis

    async def detect_red_flags(self, paper: Paper, pdf_base64: Optional[str] = None) -> List[str]:
        """
        Detect LLM babble and other red flag patterns using LLM.

        Returns list of detected issues.
        """
        content = f"{paper.title} {paper.abstract}"
        red_flags = []

        # Try LLM-based detection first (most accurate)
        if self.use_llm and self.llm_client:
            try:
                llm_result = await self.llm_client.detect_llm_generated_content(
                    paper.title,
                    paper.abstract,
                    pdf_base64=pdf_base64
                )

                if llm_result.get('is_llm_babble') and llm_result.get('confidence', 0) > 0.6:
                    red_flags.extend(llm_result.get('red_flags', []))
                    if llm_result.get('detected_patterns'):
                        for pattern in llm_result['detected_patterns'][:3]:  # Top 3
                            red_flags.append(f"LLM pattern: {pattern}")

                # If LLM found issues, return those
                if red_flags:
                    return red_flags

            except Exception as e:
                print(f"LLM red flag detection failed, using patterns: {e}")

        # Fallback to pattern-based detection
        # Check for LLM babble patterns
        babble_count = 0
        for pattern in self.LLM_BABBLE_PATTERNS:
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                babble_count += len(matches)
                red_flags.append(f"LLM babble pattern detected: {pattern[:40]}...")

        # Check for excessive buzzwords
        buzzwords = ['ai', 'machine learning', 'deep learning', 'neural network',
                     'algorithm', 'optimization', 'innovative', 'novel']
        buzzword_count = sum(content.lower().count(word) for word in buzzwords)
        buzzword_density = buzzword_count / max(len(content.split()), 1)

        if buzzword_density > 0.05:  # More than 5% buzzwords
            red_flags.append(f"High buzzword density: {buzzword_density:.2%}")

        # Check for repetition
        words = content.lower().split()
        if len(words) > 0:
            unique_ratio = len(set(words)) / len(words)
            if unique_ratio < 0.3:  # Less than 30% unique words
                red_flags.append(f"High repetition: {(1-unique_ratio)*100:.0f}% repeated words")

        # Check for lack of methodology
        if len(paper.abstract) > 200:  # Only check if abstract is substantial
            if not re.search(r'\b(method|methodology|approach|technique|procedure)\b',
                           content, re.IGNORECASE):
                red_flags.append("No clear methodology mentioned")

        return red_flags

    async def assign_visibility_tier(self, paper: Paper) -> VisibilityTier:
        """
        Assign visibility tier based on quality score and community feedback.

        Tier assignment:
        - HIDDEN: <30 score or rejected
        - RAW: 30-70 score
        - MAIN: 70+ score
        - FRONTPAGE: 70+ score + community endorsement
        """
        # Check baseline status first
        if paper.baseline_status == BaselineStatus.REJECT.value:
            return VisibilityTier.HIDDEN

        # Calculate community score
        net_votes = (paper.community_upvotes or 0) - (paper.community_downvotes or 0)

        # Penalize flagged papers
        score = paper.quality_score or 0
        if (paper.flag_count or 0) > 0:
            score -= ((paper.flag_count or 0) * 10)

        # Consider community feedback
        score += (net_votes * 2)  # Each net vote adds 2 points

        # Assign tier
        if score < 30 or paper.needs_review:
            return VisibilityTier.RAW
        elif score < 70:
            return VisibilityTier.MAIN
        elif net_votes >= 5:  # Needs community endorsement for frontpage
            return VisibilityTier.FRONTPAGE
        else:
            return VisibilityTier.MAIN

    async def process_new_submission(self, paper: Paper) -> None:
        """
        Complete moderation pipeline for a new submission:
        1. Baseline checks
        2. Quality scoring
        3. Red flag detection
        4. Visibility assignment
        """
        # Run baseline checks
        baseline_result = await self.run_baseline_checks(paper)
        paper.baseline_status = baseline_result['status']
        paper.baseline_checks = baseline_result['checks']

        # If rejected, stop here
        if baseline_result['status'] == 'reject':
            paper.visibility_tier = VisibilityTier.HIDDEN.value
            await self.db.commit()
            return

        # Calculate quality score
        quality_score, analysis = await self.calculate_quality_score(paper)
        paper.quality_score = quality_score

        # Detect red flags
        red_flags = await self.detect_red_flags(paper)
        paper.red_flags = red_flags
        paper.needs_review = len(red_flags) > 2  # Flag for review if multiple issues

        # Assign visibility tier
        paper.visibility_tier = await self.assign_visibility_tier(paper)

        await self.db.commit()

    @staticmethod
    def _text_similarity(text1: str, text2: str) -> float:
        """
        Simple text similarity using Jaccard index.
        For production, use more sophisticated methods (e.g., embeddings).
        """
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())

        if not words1 or not words2:
            return 0.0

        intersection = words1.intersection(words2)
        union = words1.union(words2)

        return len(intersection) / len(union) if union else 0.0
