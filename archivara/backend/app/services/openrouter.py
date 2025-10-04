"""
OpenRouter API client for LLM-powered moderation.
Supports GPT-4, Claude, and other models via OpenRouter.
"""

import httpx
import json
from typing import Dict, List, Optional, Any
from app.core.config import settings


class OpenRouterClient:
    """Client for OpenRouter API"""

    BASE_URL = "https://openrouter.ai/api/v1"

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENROUTER_API_KEY
        self.model = model or settings.OPENROUTER_MODEL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://archivara.com",  # Update with your domain
            "X-Title": "Archivara Moderation System",
            "Content-Type": "application/json"
        }

    async def chat_completion(
        self,
        messages: List[Dict],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        plugins: Optional[List[Dict]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Send a chat completion request to OpenRouter.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate
            plugins: Optional list of plugin configurations (e.g., for PDF processing)
            **kwargs: Additional model parameters

        Returns:
            Response dict with 'choices', 'usage', etc.
        """
        if not self.api_key:
            raise ValueError("OpenRouter API key not configured")

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            **kwargs
        }

        if plugins:
            payload["plugins"] = plugins

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.BASE_URL}/chat/completions",
                headers=self.headers,
                json=payload
            )

            if response.status_code != 200:
                raise Exception(f"OpenRouter API error: {response.status_code} - {response.text}")

            return response.json()

    async def analyze_paper_quality(
        self,
        title: str,
        abstract: str,
        pdf_base64: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Analyze paper quality using LLM with native PDF support.

        Returns dict with:
        - quality_score: 0-100
        - analysis: Detailed breakdown
        - suggestions: Improvement recommendations
        """
        metadata_str = ""
        if metadata:
            metadata_str = f"\n\nMetadata: {json.dumps(metadata, indent=2)}"

        prompt = f"""You are an expert academic paper reviewer. Analyze this research paper submission and provide a quality assessment.

Title: {title}

Abstract:
{abstract}
{metadata_str}

Please also analyze the full PDF document provided to get a complete understanding of the paper's quality.

Rate the paper on a scale of 0-100 based on these criteria:
1. Abstract quality (clarity, completeness) - 15 points
2. Research methodology mentioned - 15 points
3. Clear research question/objectives - 10 points
4. Evidence of results/findings - 15 points
5. Proper structure and organization - 10 points
6. Novelty/contribution to field - 15 points
7. Technical depth and rigor - 10 points
8. Writing quality and clarity - 10 points

Respond ONLY with valid JSON in this exact format:
{{
  "quality_score": <number 0-100>,
  "category_scores": {{
    "abstract_quality": <0-15>,
    "methodology": <0-15>,
    "research_question": <0-10>,
    "results": <0-15>,
    "structure": <0-10>,
    "novelty": <0-15>,
    "technical_depth": <0-10>,
    "writing_quality": <0-10>
  }},
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", ...]
}}"""

        # Build message content with PDF if available
        message_content = [{"type": "text", "text": prompt}]

        if pdf_base64:
            # Add PDF as a file attachment using OpenRouter's native PDF support
            data_url = f"data:application/pdf;base64,{pdf_base64}"
            message_content.append({
                "type": "file",
                "file": {
                    "filename": "paper.pdf",
                    "file_data": data_url
                }
            })

        messages = [
            {"role": "system", "content": "You are an academic paper quality assessment expert. Always respond with valid JSON only."},
            {"role": "user", "content": message_content}
        ]

        # Configure PDF processing engine (using pdf-text for free processing)
        plugins = [
            {
                "id": "file-parser",
                "pdf": {
                    "engine": "pdf-text"  # Free text-based PDF parsing
                }
            }
        ]

        try:
            response = await self.chat_completion(
                messages=messages,
                temperature=0.3,  # Lower temp for more consistent scoring
                max_tokens=1500,
                plugins=plugins if pdf_base64 else None
            )

            content = response["choices"][0]["message"]["content"].strip()

            # Try to extract JSON if wrapped in markdown code blocks
            if content.startswith("```"):
                content = content.split("```json")[-1].split("```")[0].strip()
            elif content.startswith("```"):
                content = content.split("```")[1].strip()

            result = json.loads(content)

            # Validate structure
            if "quality_score" not in result:
                raise ValueError("Missing quality_score in response")

            return result

        except json.JSONDecodeError as e:
            print(f"Failed to parse LLM response as JSON: {e}")
            print(f"Raw response: {content}")
            # Fallback to basic scoring
            return {
                "quality_score": 50,
                "category_scores": {},
                "strengths": [],
                "weaknesses": ["Failed to analyze with LLM"],
                "suggestions": ["Reprocess this paper"]
            }
        except Exception as e:
            print(f"Error in LLM quality analysis: {e}")
            return {
                "quality_score": 50,
                "category_scores": {},
                "strengths": [],
                "weaknesses": ["Analysis error"],
                "suggestions": []
            }

    async def detect_llm_generated_content(
        self,
        title: str,
        abstract: str,
        pdf_base64: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Detect LLM-generated/babble content using another LLM with native PDF support.

        Returns dict with:
        - is_llm_babble: bool
        - confidence: 0-1
        - red_flags: list of issues
        - reasoning: explanation
        """
        prompt = f"""You are an expert at detecting AI-generated academic content that lacks substance (often called "LLM babble").

Analyze this paper for signs of low-quality AI generation:

Title: {title}

Abstract:
{abstract}

Please also analyze the full PDF document provided to detect any patterns of low-quality AI generation throughout the paper.

Look for these red flags:
1. Excessive buzzwords without substance ("delve", "tapestry", "paradigm shift", "nuanced")
2. Generic/vague statements that don't convey specific information
3. Repetitive phrasing or circular reasoning
4. Lack of concrete methodology or results
5. Formulaic structure typical of AI (e.g., "In conclusion, it is clear that...")
6. High-level claims without supporting details
7. Buzzword density too high relative to actual content

Respond ONLY with valid JSON in this exact format:
{{
  "is_llm_babble": <true/false>,
  "confidence": <0.0-1.0>,
  "red_flags": ["<flag 1>", "<flag 2>", ...],
  "reasoning": "<brief explanation>",
  "detected_patterns": ["<pattern 1>", "<pattern 2>", ...]
}}"""

        # Build message content with PDF if available
        message_content = [{"type": "text", "text": prompt}]

        if pdf_base64:
            data_url = f"data:application/pdf;base64,{pdf_base64}"
            message_content.append({
                "type": "file",
                "file": {
                    "filename": "paper.pdf",
                    "file_data": data_url
                }
            })

        messages = [
            {"role": "system", "content": "You are an AI content detection expert. Always respond with valid JSON only."},
            {"role": "user", "content": message_content}
        ]

        # Configure PDF processing
        plugins = [
            {
                "id": "file-parser",
                "pdf": {
                    "engine": "pdf-text"
                }
            }
        ]

        try:
            response = await self.chat_completion(
                messages=messages,
                temperature=0.2,  # Low temp for consistent detection
                max_tokens=1000,
                plugins=plugins if pdf_base64 else None
            )

            content = response["choices"][0]["message"]["content"].strip()

            # Extract JSON if wrapped
            if content.startswith("```"):
                content = content.split("```json")[-1].split("```")[0].strip()
            elif content.startswith("```"):
                content = content.split("```")[1].strip()

            result = json.loads(content)

            # Validate structure
            if "is_llm_babble" not in result:
                raise ValueError("Missing is_llm_babble in response")

            return result

        except json.JSONDecodeError as e:
            print(f"Failed to parse LLM babble detection response: {e}")
            print(f"Raw response: {content}")
            return {
                "is_llm_babble": False,
                "confidence": 0.0,
                "red_flags": [],
                "reasoning": "Detection failed",
                "detected_patterns": []
            }
        except Exception as e:
            print(f"Error in LLM babble detection: {e}")
            return {
                "is_llm_babble": False,
                "confidence": 0.0,
                "red_flags": [],
                "reasoning": "Detection error",
                "detected_patterns": []
            }

    async def check_spam_content(
        self,
        title: str,
        abstract: str
    ) -> Dict[str, Any]:
        """
        Check if content appears to be spam using LLM.

        Returns dict with:
        - is_spam: bool
        - confidence: 0-1
        - reasons: list of reasons
        """
        prompt = f"""You are a spam detection expert for academic paper submissions.

Analyze if this is spam/non-academic content:

Title: {title}

Abstract:
{abstract}

Check for:
1. Commercial content (ads, products, services)
2. Excessive URLs or links
3. Promotional language
4. Non-research content
5. Gibberish or random text
6. Off-topic content

Respond ONLY with valid JSON:
{{
  "is_spam": <true/false>,
  "confidence": <0.0-1.0>,
  "reasons": ["<reason 1>", "<reason 2>", ...]
}}"""

        messages = [
            {"role": "system", "content": "You are a spam detection expert. Always respond with valid JSON only."},
            {"role": "user", "content": prompt}
        ]

        try:
            response = await self.chat_completion(
                messages=messages,
                temperature=0.1,
                max_tokens=500
            )

            content = response["choices"][0]["message"]["content"].strip()

            if content.startswith("```"):
                content = content.split("```json")[-1].split("```")[0].strip()

            result = json.loads(content)
            return result

        except Exception as e:
            print(f"Error in spam detection: {e}")
            return {"is_spam": False, "confidence": 0.0, "reasons": []}
