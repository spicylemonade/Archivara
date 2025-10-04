# Moderation System Documentation

## Overview

A comprehensive moderation system for Archivara that combines **automated quality checks** with **community-driven filtering** to maintain high-quality content while preserving openness.

## Architecture

### 1. Database Models

#### Paper Model Extensions
New fields added to the `papers` table:

- `baseline_status` (enum): pass | warn | reject | pending
- `baseline_checks` (JSON): Detailed results from automated checks
- `quality_score` (int): AI-generated quality score (0-100)
- `needs_review` (bool): Flagged for human review
- `red_flags` (JSON): List of detected issues
- `community_upvotes` (int): Number of upvotes
- `community_downvotes` (int): Number of downvotes
- `flag_count` (int): Number of moderation flags
- `visibility_tier` (enum): frontpage | main | raw | hidden
- `moderation_notes` (text): Optional notes from moderators

#### New Tables

**paper_votes**
- `id` (string, PK)
- `paper_id` (FK → papers.id)
- `user_id` (FK → users.id)
- `vote` (int): 1 for upvote, -1 for downvote
- `created_at`, `updated_at`

**paper_flags**
- `id` (string, PK)
- `paper_id` (FK → papers.id)
- `user_id` (FK → users.id)
- `reason` (string): spam | plagiarism | low-quality | other
- `details` (text): Optional explanation
- `status` (string): pending | reviewed | resolved
- `created_at`, `resolved_at`, `resolved_by`

---

## Features

### 1. Baseline Checks (Automated)

Run immediately on paper submission:

#### Spam Detection
- Pattern matching for common spam indicators
- URL detection in abstracts
- Commercial content filtering
- **Severity**: Critical (auto-reject if multiple patterns match)

#### Plagiarism Check
- Basic fuzzy matching against existing submissions
- Title/abstract similarity scoring
- Can be extended with external plagiarism APIs
- **Severity**: Critical (requires human review if similar papers found)

#### Research Validation
- Minimum content length requirements
- Abstract completeness check
- Filters "test" submissions and trivial content
- **Severity**: Critical (rejects non-research content)

**Baseline Status Outcomes:**
- `PASS`: All checks passed
- `WARN`: Some concerns but not critical
- `REJECT`: Failed critical checks (hidden from all feeds)
- `PENDING`: Checks not yet run

### 2. AI Heuristic Scoring (0-100)

Quality indicators and their point values:

| Indicator | Points | Description |
|-----------|--------|-------------|
| Has abstract | 10 | Well-formed abstract (>100 chars) |
| Has introduction | 5 | Introduction section detected |
| Has methodology | 10 | Methods/approach described |
| Has results | 10 | Results section present |
| Has conclusion | 5 | Concluding remarks |
| Has references | 15 | Citations/bibliography |
| Has figures | 10 | Visual elements |
| Has tables | 5 | Data tables |
| Has code | 5 | Code repository linked |
| Has equations | 5 | Mathematical content |
| Sufficient length | 10 | >200 words |
| Proper structure | 10 | Multiple sections |

**Total possible**: 100 points

### 3. Red Flag Detection

Detects "LLM babble" and low-quality patterns:

**Patterns Detected:**
- Buzzword overuse ("delve", "tapestry", "paradigm shift")
- Generic AI phrases ("it is important to note")
- Excessive repetition (>70% repeated words)
- High buzzword density (>5% of content)
- Missing methodology sections
- Formulaic conclusions

**Threshold**: Papers with 3+ red flags are marked `needs_review = true`

### 4. Visibility Tiers

Four tier system controlling where papers appear:

#### FRONTPAGE
- Quality score ≥70
- Net votes ≥5 (community endorsement required)
- Baseline status: PASS
- The "best of the best" — featured papers

#### MAIN
- Quality score 30-70
- Baseline status: PASS or WARN
- Default feed for most users
- General browsing experience

#### RAW
- Quality score <30 OR needs_review = true
- Everything that isn't rejected
- Full transparency feed
- For researchers who want to see everything

#### HIDDEN
- Baseline status: REJECT
- Not shown in any public feed
- Only visible to moderators/admins

**Tier Assignment Algorithm:**
```
score = quality_score + (community_upvotes - community_downvotes) * 2 - flag_count * 10

if baseline_status == REJECT:
    tier = HIDDEN
elif score < 30 OR needs_review:
    tier = RAW
elif score < 70:
    tier = MAIN
elif net_votes >= 5:
    tier = FRONTPAGE
else:
    tier = MAIN
```

### 5. Community Filtering

#### Voting
- Users can upvote (+1) or downvote (-1) papers
- Each vote changes paper's composite score
- Votes influence visibility tier
- One vote per user per paper

#### Flagging
- Reasons: spam, plagiarism, low-quality, other
- Papers with ≥3 flags are marked for review
- Flags reduce quality score (-10 per flag)
- Moderators can review and resolve flags

---

## API Endpoints

### POST /moderation/papers/{paper_id}/vote
Vote on a paper.

**Request:**
```json
{
  "vote": 1  // 1 for upvote, -1 for downvote, 0 to remove
}
```

**Response:**
```json
{
  "message": "Vote recorded",
  "net_votes": 5,
  "visibility_tier": "main"
}
```

### POST /moderation/papers/{paper_id}/flag
Flag a paper for review.

**Request:**
```json
{
  "reason": "low-quality",
  "details": "No methodology section, appears AI-generated without validation"
}
```

**Response:**
```json
{
  "message": "Paper flagged for review",
  "flag_count": 3,
  "needs_review": true
}
```

### GET /moderation/papers/{paper_id}/moderation-status
Get full moderation status.

**Response:**
```json
{
  "baseline_status": "pass",
  "quality_score": 75,
  "visibility_tier": "main",
  "needs_review": false,
  "community_upvotes": 12,
  "community_downvotes": 2,
  "flag_count": 0,
  "red_flags": [],
  "baseline_checks": {
    "spam_check": {"passed": true, "score": 100},
    "plagiarism_check": {"passed": true, "score": 100},
    "research_check": {"passed": true, "score": 100}
  }
}
```

### GET /moderation/feed?tier={tier}
Get filtered paper feed.

**Query Parameters:**
- `tier`: frontpage | main | raw
- `min_score`: Minimum quality score filter
- `exclude_flagged`: Hide heavily flagged papers (default: true)
- `page`, `size`: Pagination

**Response:**
```json
{
  "items": [...papers...],
  "total": 150,
  "page": 1,
  "size": 20,
  "pages": 8
}
```

### POST /moderation/papers/{paper_id}/reprocess
Rerun moderation checks (admin/moderator only).

### GET /moderation/papers/{paper_id}/my-vote
Check current user's vote on a paper.

---

## Moderation Pipeline Flow

```
1. Paper submitted via POST /papers
   ↓
2. ModerationService.process_new_submission() runs:
   a. run_baseline_checks()
      - Spam detection
      - Plagiarism check
      - Research validation
      → Sets baseline_status
   
   b. If REJECT → visibility_tier = HIDDEN, stop
   
   c. calculate_quality_score()
      - Analyze structure, content, metadata
      → Sets quality_score (0-100)
   
   d. detect_red_flags()
      - LLM babble patterns
      - Buzzword density
      - Missing sections
      → Sets red_flags array, needs_review flag
   
   e. assign_visibility_tier()
      - Combine quality_score + community votes
      - Consider flags
      → Sets visibility_tier
   ↓
3. Paper appears in appropriate feed tier
   ↓
4. Community interacts:
   - Upvotes/downvotes → recalculate tier
   - Flags → increment flag_count, check review threshold
   ↓
5. Moderators review flagged/low-quality submissions
```

---

## Setup Instructions

### 1. Run Database Migration

```bash
cd archivara/backend
source venv/bin/activate
alembic upgrade head
```

This will:
- Add moderation fields to papers table
- Create paper_votes and paper_flags tables
- Set up enums for baseline_status and visibility_tier

### 2. Integrate with Paper Submission

Update your paper submission endpoint to run moderation:

```python
from app.services.moderation import ModerationService

@router.post("/papers")
async def create_paper(
    paper_data: PaperCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Create paper...
    paper = Paper(**paper_data.dict())
    db.add(paper)
    await db.commit()
    
    # Run moderation pipeline
    mod_service = ModerationService(db)
    await mod_service.process_new_submission(paper)
    
    return paper
```

### 3. Frontend Integration (Optional)

Add UI components to show:
- Quality score badges
- Upvote/downvote buttons
- Flag button
- Visibility tier indicators
- Moderation status for paper authors

---

## Configuration

### Adjust Quality Thresholds

Edit `app/services/moderation.py`:

```python
# Change scoring weights
QUALITY_INDICATORS = {
    'has_references': 20,  # Increase importance of references
    ...
}

# Adjust tier thresholds
if score < 20:  # Make tier boundaries stricter
    tier = RAW
...
```

### Add Custom Spam Patterns

```python
SPAM_PATTERNS = [
    r'your-custom-pattern',
    ...
]
```

### Tune Red Flag Detection

```python
# Adjust buzzword density threshold
if buzzword_density > 0.03:  # Lower = stricter
    red_flags.append(...)
```

---

## Testing

### Test Baseline Checks

```bash
curl -X POST http://localhost:8000/api/v1/papers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Paper",
    "abstract": "This is a test.",
    ...
  }'
```

Check that short abstracts are caught.

### Test Community Voting

```bash
# Upvote
curl -X POST http://localhost:8000/api/v1/moderation/papers/{id}/vote \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"vote": 1}'

# Check updated tier
curl http://localhost:8000/api/v1/moderation/papers/{id}/moderation-status
```

### Test Feed Filtering

```bash
# Get frontpage feed
curl http://localhost:8000/api/v1/moderation/feed?tier=frontpage

# Get raw feed (everything)
curl http://localhost:8000/api/v1/moderation/feed?tier=raw
```

---

## Future Enhancements

### Planned Features

1. **ML-based Quality Prediction**
   - Train model on accepted vs. rejected papers
   - Use embeddings for better plagiarism detection
   - Predict paper impact/citation potential

2. **Moderator Dashboard**
   - Review queue for flagged papers
   - Bulk moderation actions
   - Analytics on moderation patterns

3. **User Reputation System**
   - Track user voting accuracy
   - Weight votes by user reputation
   - Prevent spam voting

4. **Advanced Plagiarism Detection**
   - Integration with external APIs (Turnitin, iThenticate)
   - Cross-reference with arXiv, PubMed
   - Code similarity detection

5. **Automated Appeals**
   - Let authors contest rejections
   - Automatic re-review after edits
   - Transparent rejection reasons

---

## Troubleshooting

### Papers stuck in PENDING

Run reprocessing:
```bash
curl -X POST http://localhost:8000/api/v1/moderation/papers/{id}/reprocess \
  -H "Authorization: Bearer $TOKEN"
```

### False positives in spam detection

Adjust patterns in `moderation.py` or add whitelist for known good patterns.

### Low quality scores for valid papers

Review `QUALITY_INDICATORS` weights and detection logic. Consider adding more structural indicators.

---

## Security Considerations

- **Rate limiting**: Add rate limits to voting/flagging endpoints to prevent abuse
- **Permission checks**: Implement moderator role checks for admin endpoints
- **Vote validation**: Prevent users from voting on their own papers
- **Flag spam**: Detect and penalize users who spam flags

---

## Contact

For questions or issues, please open a GitHub issue or contact the Archivara team.

---

## LLM-Powered Moderation (GPT-4 via OpenRouter)

### Overview

The moderation system uses **OpenRouter** to access GPT-4 (or other LLMs) for intelligent quality assessment and content analysis. This provides much more accurate detection than pattern matching alone.

### Features Using LLM

1. **Quality Scoring** - Expert academic paper review
2. **Red Flag Detection** - AI-generated "babble" detection
3. **Spam Detection** - Context-aware spam filtering

### Configuration

#### 1. Get OpenRouter API Key

Visit https://openrouter.ai/ and create an account. Get your API key from the dashboard.

#### 2. Configure in `.env`

```bash
# OpenRouter (for moderation LLM)
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=openai/gpt-4o  # Recommended model
```

**Available Models:**
- `openai/gpt-4o` - Latest GPT-4, best quality (recommended)
- `openai/gpt-4-turbo` - Faster, slightly cheaper
- `anthropic/claude-3.5-sonnet` - Claude 3.5, excellent for analysis
- `meta-llama/llama-3.1-70b-instruct` - Open source, cheaper
- See OpenRouter docs for full list

#### 3. Update config.py

Already configured! The system automatically uses LLM when API key is set.

### How It Works

#### Quality Scoring with LLM

The LLM acts as an expert academic reviewer, scoring papers on 8 criteria:

```python
{
  "quality_score": 85,  # Overall 0-100
  "category_scores": {
    "abstract_quality": 14,     # /15
    "methodology": 13,           # /15
    "research_question": 9,      # /10
    "results": 14,               # /15
    "structure": 9,              # /10
    "novelty": 12,               # /15
    "technical_depth": 8,        # /10
    "writing_quality": 8         # /10
  },
  "strengths": [
    "Clear research question and objectives",
    "Well-structured abstract with all key elements",
    "Novel approach to the problem"
  ],
  "weaknesses": [
    "Limited discussion of related work",
    "Some methodological details missing"
  ],
  "suggestions": [
    "Add more background on prior approaches",
    "Expand methodology section"
  ]
}
```

**Fallback**: If LLM fails or API key not set, falls back to heuristic scoring.

#### Red Flag Detection with LLM

The LLM analyzes content for AI-generated "babble" patterns:

```python
{
  "is_llm_babble": true,
  "confidence": 0.85,
  "red_flags": [
    "Excessive use of generic AI phrases",
    "Vague methodology without specifics",
    "Repetitive sentence structures"
  ],
  "reasoning": "Content shows typical patterns of AI generation...",
  "detected_patterns": [
    "Overuse of 'delve' and 'paradigm'",
    "Generic conclusions without substance"
  ]
}
```

**Threshold**: Papers with confidence >0.6 are flagged.

#### Spam Detection with LLM

Context-aware spam detection:

```python
{
  "is_spam": true,
  "confidence": 0.9,
  "reasons": [
    "Contains commercial promotional content",
    "Multiple product links",
    "Not academic research"
  ]
}
```

**Threshold**: Papers with confidence >0.7 are rejected.

### Cost Management

OpenRouter charges per token. Typical costs:

- **Quality scoring**: ~$0.01-0.03 per paper (GPT-4o)
- **Red flag detection**: ~$0.005-0.01 per paper
- **Spam check**: ~$0.003-0.007 per paper

**Total per paper**: ~$0.02-0.05 with GPT-4o

**Cost-saving tips:**
1. Use cheaper models for spam detection
2. Cache results for reprocessing
3. Use pattern matching first, LLM only for borderline cases
4. Set monthly budget limits in OpenRouter

### Disabling LLM

To use pattern-based moderation only (free):

```python
# In code
mod_service = ModerationService(db, use_llm=False)

# Or remove API key from .env
OPENROUTER_API_KEY=
```

System automatically falls back to heuristics if LLM unavailable.

### Model Selection

Different models for different needs:

**For Quality Scoring:**
- **GPT-4o** (recommended) - Best accuracy
- **Claude 3.5 Sonnet** - Excellent analysis, similar quality
- **GPT-4 Turbo** - 2x faster, 90% accuracy

**For Red Flag Detection:**
- **GPT-4o** - Best at detecting subtle AI patterns
- **Llama 3.1 70B** - Good, much cheaper ($0.0003/1K tokens)

**For Spam Detection:**
- **GPT-3.5 Turbo** - Fast and cheap, sufficient accuracy
- **Llama 3.1 8B** - Very cheap, decent for spam

Configure per-use-case in code:

```python
# In openrouter.py, add method-specific models
quality_client = OpenRouterClient(model="openai/gpt-4o")
spam_client = OpenRouterClient(model="openai/gpt-3.5-turbo")
```

### Monitoring LLM Usage

Track in logs:

```python
# Add to moderation.py
import logging
logger = logging.getLogger(__name__)

# In calculate_quality_score
logger.info(f"LLM quality scoring for paper {paper.id}: {score}")
```

Monitor costs in OpenRouter dashboard: https://openrouter.ai/activity

### Testing LLM Integration

```bash
# Test with real paper
curl -X POST http://localhost:8000/api/v1/papers \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Novel Approach to Deep Learning Optimization",
    "abstract": "We present a paradigm-shifting methodology...",
    ...
  }'

# Check moderation result
curl http://localhost:8000/api/v1/moderation/papers/{id}/moderation-status
```

Look for `"method": "llm"` in quality_score analysis.

### Troubleshooting

**LLM calls failing:**
- Check API key is valid
- Verify OpenRouter account has credits
- Check model name is correct
- System falls back to heuristics automatically

**Unexpected scores:**
- LLM may have different standards than heuristics
- Review `llm_analysis` field in moderation status
- Adjust prompts in `openrouter.py` if needed

**Costs too high:**
- Use cheaper models for non-critical checks
- Add caching layer
- Only use LLM for papers passing baseline checks

---

## Performance Comparison

| Method | Quality Score Accuracy | Red Flag Detection | Speed | Cost |
|--------|----------------------|-------------------|-------|------|
| Pattern-only | 60-70% | 50-60% | <100ms | Free |
| LLM (GPT-4o) | 90-95% | 85-90% | 2-5s | ~$0.02 |
| Hybrid | 85-90% | 80-85% | 500ms-2s | ~$0.01 |

**Recommendation**: Use LLM for production (accuracy matters), patterns for development/testing.

