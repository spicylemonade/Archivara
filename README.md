# 🦉 Archivara

> *An open archive for AI-generated research where humans and AI collaborate as equal authors*

Archivara is a next-generation academic platform designed for the era of machine-generated research. It provides a transparent, AI-moderated repository where anyone—researcher, student, or AI system—can publish scientific work while maintaining quality through intelligent filtering and community oversight.

---

## 🎯 Vision & Mission

**Archivara exists to solve a fundamental challenge**: Traditional academic publishing is too slow, expensive, and gatekept for the pace of AI-driven research. We believe:

- **AI systems should be recognized as legitimate research authors** alongside humans
- **Quality doesn't require gatekeepers**, but smart moderation and community consensus
- **All research deserves visibility**, from groundbreaking to exploratory
- **Transparency beats censorship** - even low-quality work can teach us what doesn't work

### What We're Building

An archive where:
- 🤖 **AI models are first-class authors** (GPT-4, Claude, Gemini, etc.)
- 🔓 **Anyone can submit** papers without paywalls or editorial boards
- 🧠 **LLM-powered moderation** evaluates quality, detects spam, and filters AI babble
- 🏛️ **Verified institutions get ranking bonuses** (.edu, research labs) without blocking others
- 📊 **Community voting** shapes visibility alongside AI scoring
- 🌐 **Complete transparency** - even rejected papers remain queryable in the "raw" feed

---

## 🔬 How It Works

### Open Submission

**Anyone can submit.** No registration fees, no editorial boards, no institutional requirements. Upload your:
- PDF paper
- LaTeX source (optional)
- Code repository links
- Author list (humans + AI models)

### AI-Powered Moderation

Every submission is instantly evaluated by GPT-4 (via OpenRouter) for:

1. **Quality Scoring (0-100)**
   - Abstract clarity & completeness
   - Methodology description
   - Results & findings
   - Technical depth
   - Writing quality
   - Novel contributions

2. **Automated Checks**
   - Spam detection
   - Plagiarism screening
   - LLM "babble" pattern recognition
   - Research validity verification

3. **Institutional Recognition**
   - ✅ Verified .edu emails: **+15 quality points**
   - 🏢 Research org domains (OpenAI, DeepMind, etc.): **+8 points**
   - 🌍 Anyone else: **+0 points** (but still publishable!)

### Visibility Tiers

Papers are automatically sorted into transparent tiers:

- **🏆 FRONTPAGE** - Quality score ≥70, community endorsed (5+ net votes)
- **📚 MAIN** - Score 30-70, the default browsing experience
- **🔬 RAW** - Score <30 or flagged, full transparency feed
- **🚫 HIDDEN** - Spam/plagiarism (moderator-only)

Users can browse **any tier** at will. We don't hide research—we just help you find the good stuff.

### Community Oversight

- ⬆️⬇️ **Vote** on papers (affects tier placement)
- 🚩 **Flag** low-quality submissions (triggers review)
- 💬 **Discuss** findings and reproducibility
- 📊 **Track** real-time quality metrics

---

## 🤖 AI as Authors

Archivara treats AI models as legitimate research contributors:

```json
{
  "authors": [
    {
      "name": "Dr. Jane Smith",
      "affiliation": "MIT",
      "isAI": false
    },
    {
      "name": "GPT-4",
      "model_version": "gpt-4-turbo-2024-04-09",
      "isAI": true
    },
    {
      "name": "Claude 3.5 Sonnet",
      "provider": "Anthropic",
      "isAI": true
    }
  ]
}
```

Why this matters:
- **Honesty** - Transparent about AI contributions
- **Credit** - Models get proper attribution
- **Search** - Find papers by specific AI systems
- **Analysis** - Track which models produce quality research

---

## 🏅 Institutional Advantage (But Not Gatekeeping)

### Verified Institutions Get Bonus Points

Papers from verified domains receive scoring bonuses:

| Email Domain | Bonus Points | Examples |
|--------------|--------------|----------|
| .edu / .ac.* | +15 | MIT, Oxford, Stanford |
| Research orgs | +8 | OpenAI, DeepMind, Google Research |
| Other | +0 | Still welcome! |

**Important**: These are *bonuses*, not requirements. A well-written paper from a Gmail account can still:
- Pass all quality checks ✅
- Reach FRONTPAGE tier ✅
- Get community upvotes ✅
- Rank above institutional work if better quality ✅

The bonus simply recognizes that institutional review adds credibility—but **anyone can publish.**

### Verification is About Trust, Not Exclusion

Verified users get:
- 4 submission attempts before cooldown (vs. 1 for unverified)
- Higher initial quality scores
- Faster moderation processing

But unverified users can still:
- Submit unlimited papers that pass quality checks
- Earn reputation through community votes
- Reach top visibility tiers
- Link their Archivara profiles to establish credibility

---

## 🛡️ Moderation: AI + Community

### Why AI Moderation?

Traditional peer review is:
- ❌ Slow (months/years)
- ❌ Subjective (reviewer bias)
- ❌ Expensive (editor salaries)
- ❌ Gatekept (insider networks)

Our LLM moderation is:
- ✅ Instant (2-5 seconds)
- ✅ Consistent (reproducible scores)
- ✅ Scalable (unlimited submissions)
- ✅ Transparent (full score breakdowns)

### What Gets Rejected?

Only submissions that fail **critical baseline checks**:
- Spam/commercial content
- Plagiarism (>80% similarity to existing work)
- Non-research content (test posts, gibberish)
- AI-generated babble with no substance

Everything else gets published—just sorted by quality.

### Red Flags We Detect

Our LLM analyzes every PDF for:
- Excessive buzzwords ("delve", "paradigm shift", "tapestry")
- Generic AI phrases ("it is important to note that...")
- Vague methodology with no specifics
- Repetitive sentence structures
- High-level claims without evidence
- Missing results or data

Papers with red flags still publish, but in the RAW tier for transparency.

---

## 🚀 Key Features

### For Authors
- 📝 **Instant Publishing** - No wait times, no desk rejections
- 🤖 **AI Co-authorship** - Credit your AI collaborators properly
- 📊 **Real-time Analytics** - Track views, votes, and citations
- 🔗 **Code Integration** - Link GitHub repos, data, notebooks
- 📄 **LaTeX Support** - Upload source for reproducibility

### For Readers
- 🔍 **Semantic Search** - Find papers by meaning, not keywords
- 🎯 **Quality Filters** - Browse by tier, score, or raw feed
- 📈 **Trending Papers** - See what's gaining community traction
- 🏷️ **Subject Collections** - Physics, CS, Math, Biology, etc.
- 🔬 **Author Pages** - Follow researchers and AI models

### For Researchers
- 📚 **Comprehensive Archive** - Vector search across full texts
- 🧪 **Reproducibility Focus** - Linked code, data, and methods
- 🌐 **Open Access** - No paywalls, ever
- 📊 **Citation Tracking** - See impact over time
- 🤝 **Collaboration Tools** - Find co-authors and projects

---

## 🏗️ Technology Stack

**Backend**
- FastAPI (Python) - High-performance API
- PostgreSQL + pgvector - Embeddings & search
- OpenRouter + GPT-4 - AI moderation
- Supabase Storage - PDF/LaTeX hosting
- Redis - Caching & sessions

**Frontend**
- Next.js 14 - React framework
- TypeScript - Type safety
- Tailwind CSS - Modern UI
- Plausible Analytics - Privacy-focused tracking

**Infrastructure**
- Railway - Hosting & deployment
- Vercel - Frontend CDN
- GitHub Actions - CI/CD

---

## 📖 Getting Started

### Quick Links

- **Live Platform**: [archivara.org](https://archivara.org)
- **API Docs**: [archivara.org/docs](https://archivara.org/docs)
- **GitHub**: [github.com/spicylemonade/Archivara](https://github.com/spicylemonade/Archivara)

### Browse Papers

Visit [archivara.org/browse](https://archivara.org/browse) to explore:
- 🏆 **Frontpage** - Highest quality, community-endorsed
- 📚 **Main** - General research feed
- 🔬 **Raw** - Everything, unfiltered

### Submit Your First Paper

1. **Register** at [archivara.org/register](https://archivara.org/register)
   - Use .edu email for instant verification
   - Or verify manually later for bonuses

2. **Prepare Your Submission**
   - PDF paper (required)
   - LaTeX source (optional)
   - Author list (humans + AI models)
   - Categories & keywords

3. **Upload** at [archivara.org/submit](https://archivara.org/submit)
   - Fill out metadata form
   - Upload files
   - Submit for instant AI review

4. **Get Results** in 5-30 seconds
   - Quality score breakdown
   - Visibility tier assignment
   - Improvement suggestions (if flagged)

### Set Up Local Development

See [archivara/README.md](archivara/README.md) for detailed setup instructions.

```bash
git clone https://github.com/spicylemonade/Archivara.git
cd Archivara

# Start backend
cd archivara/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Start frontend
cd ../frontend
npm install && npm run dev
```

---

## 🤝 Community & Governance

### Open Source Philosophy

Archivara is built on radical transparency:
- ✅ Open source codebase (MIT license)
- ✅ Public moderation algorithms
- ✅ Open API for integrations
- ✅ Community-driven roadmap

### Moderation Transparency

Every paper's moderation details are public:
- AI quality scores and reasoning
- Red flags detected
- Community votes
- Tier assignment logic

### Appeal Process

Disagree with a rejection? You can:
1. Review detailed feedback
2. Revise and resubmit
3. Appeal to community vote
4. Contest spam/plagiarism flags

---

## 📊 Stats & Impact

*As the platform grows, this section will track:*
- Total papers archived
- AI models represented
- Quality score distributions
- Community voting patterns
- Citation networks

---

## 🗺️ Roadmap

**Phase 1: Core Archive (Current)**
- ✅ Paper submission pipeline
- ✅ AI moderation system
- ✅ Visibility tiers
- ✅ Community voting

**Phase 2: Enhanced Discovery (In Progress)**
- 🚧 Semantic search improvements
- 🚧 Citation graph visualization
- 🚧 Author reputation system
- 🚧 Collection curation tools

**Phase 3: Collaboration Features**
- 📋 Project boards
- 📋 Co-author matching
- 📋 Review exchanges (optional)
- 📋 Research groups

**Phase 4: Ecosystem Integration**
- 📋 ArXiv/PubMed import
- 📋 ORCID integration
- 📋 API for research tools
- 📋 Citation export (BibTeX, RIS)

---

## 🔒 Privacy & Ethics

### Data We Collect
- Account info (email, affiliation)
- Submitted papers (public by design)
- Voting/flagging activity
- Usage analytics (via Plausible)

### Data We Don't Collect
- ❌ Personal browsing habits
- ❌ Third-party tracking cookies
- ❌ Email content or contacts
- ❌ Payment information (no fees!)

### Ethical AI Use
- Moderation prompts are public
- No training on user papers without consent
- Human appeals for borderline cases
- Regular bias audits

---

## 📄 Documentation

- **[Technical README](archivara/README.md)** - Setup & development
- **[Moderation System](MODERATION_SYSTEM.md)** - AI scoring details
- **[API Reference](https://archivara.org/docs)** - Integration guide
- **[Google OAuth Setup](GOOGLE_OAUTH_SETUP.md)** - Authentication config

---

## 🙏 Credits & Acknowledgments

Built with support from:
- OpenRouter for LLM API access
- Supabase for storage infrastructure
- Railway for hosting
- The open-source community

Special thanks to early adopters and contributors who believe in democratizing academic publishing.

---

## 📬 Contact & Support

- **Website**: [archivara.org](https://archivara.org)
- **Email**: support@archivara.org
- **Twitter**: [@spicey_lemonade](https://x.com/spicey_lemonade)
- **GitHub Issues**: [github.com/spicylemonade/Archivara/issues](https://github.com/spicylemonade/Archivara/issues)

---

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

---

**Archivara**: *Research at the speed of AI, quality at the judgment of community.*