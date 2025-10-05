"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { formatDistanceToNowStrict } from "date-fns"
import { papersAPI, moderationAPI } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { isVerifiedEmailDomain } from "@/lib/verification"
import { LatexText } from "@/components/latex-text"

// Mock data - in production this would come from API
const MOCK_PAPER = {
  id: "arXiv:2501.00091",
  title: "Deep learning optimal molecular scintillators for dark matter direct detection",
  authors: [
    { id: "1", name: "GPT-4", affiliation: "OpenAI", isAI: true },
    { id: "2", name: "Claude-3", affiliation: "Anthropic", isAI: true },
    { id: "3", name: "Cameron Cook", affiliation: "University of Example", isAI: false }
  ],
  abstract: "Direct searches for sub-GeV dark matter are limited by the intrinsic quantum properties of the target material. In this proof-of-concept study, we argue that this problem is particularly well suited for machine learning. We demonstrate that a simple neural architecture consisting of a variational autoencoder and a multi-layer perceptron can efficiently generate unique molecules with desired properties. In specific, the energy threshold and signal (quantum) efficiency determine the minimum mass and cross section to which a detector can be sensitive. Organic molecules present a particularly interesting class of materials with intrinsically anisotropic electronic responses and O(few) eV excitation energies. However, the space of possible organic compounds is intractably large, which makes traditional database screening challenging. We adopt excitation energies and proxy transition matrix elements as target properties learned by our network. Our model is able to generate molecules that are not in even the most expansive quantum chemistry databases and predict their relevant properties for high-throughput and efficient screening. Following a massive generation of novel molecules, we use clustering analysis to identify some of the most promising molecular structures that optimise the desired molecular properties for dark matter detection.",
  categories: [
    { id: "hep-ph", name: "High Energy Physics - Phenomenology", primary: true },
    { id: "hep-ex", name: "High Energy Physics - Experiment", primary: false },
    { id: "physics.ins-det", name: "Instrumentation and Detectors", primary: false }
  ],
  submitted_date: "2024-12-30T19:00:00Z",
  updated_date: "2025-01-08T17:16:30Z",
  arxiv_id: "2501.00091",
  doi: "10.48550/arXiv.2501.00091",
  journal_ref: null,
  comments: "8 pages, 6 figures",
  report_no: null,
  msc_class: null,
  acm_class: null,
  versions: [
    { version: "v1", date: "2024-12-30T19:00:00Z", size: "1,258 KB" },
    { version: "v2", date: "2025-01-08T17:16:30Z", size: "1,270 KB" }
  ],
  generation_method: "GPT-4 + Claude-3 Collaboration",
  ai_tools: ["GPT-4", "Claude-3", "SciBERT"],
  human_review: true,
  citations: 12,
  references: [
    { title: "INSPIRE HEP", url: "https://inspirehep.net" },
    { title: "NASA ADS", url: "https://ui.adsabs.harvard.edu" },
    { title: "Google Scholar", url: "https://scholar.google.com" },
    { title: "Semantic Scholar", url: "https://www.semanticscholar.org" }
  ]
}

export default function PaperPage({ params }: { params: { id: string } }) {
  const [paper, setPaper] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("abstract")
  const [myVote, setMyVote] = useState<number>(0)
  const [netVotes, setNetVotes] = useState<number>(0)
  const [flagReason, setFlagReason] = useState<string>("")
  const [flagDetails, setFlagDetails] = useState<string>("")
  const [flagDialogOpen, setFlagDialogOpen] = useState(false)

  useEffect(() => {
    loadPaper()
    loadVotingData()
  }, [params.id])

  const loadPaper = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Loading paper with ID:", params.id)  // Debug log

      // Try cache first
      const cachedPaper = sessionStorage.getItem(`paper-${params.id}`)
      if (cachedPaper) {
        try {
          const parsed = JSON.parse(cachedPaper)
          setPaper(parsed)
          setLoading(false)
          // Still fetch in background to update cache
        } catch (e) {
          console.error('Failed to parse cached paper:', e)
        }
      }

      // Try API first
      try {
        const response = await papersAPI.get(params.id)
        console.log("Paper data loaded from API:", response.data)  // Debug log

        // Transform the backend response to match frontend format
        const paperData = {
          id: response.data.id,
          title: response.data.title,
          abstract: response.data.abstract,
          pdf_url: response.data.pdf_url,
          tex_url: response.data.tex_url,
          code_url: response.data.code_url,
          data_url: response.data.data_url,
          authors: response.data.authors?.map((author: any) => ({
            id: author.id,
            name: author.name,
            email: author.email,
            affiliation: author.affiliation || "Unknown",
            isAI: author.is_ai_model || false
          })) || [],
          categories: response.data.categories?.map((cat: string) => ({
            id: cat.toLowerCase().replace(/\s+/g, '-'),
            name: cat,
            primary: false
          })) || [],
          submitted_date: response.data.published_at || response.data.created_at,
          updated_date: response.data.updated_at,
          arxiv_id: response.data.arxiv_id || response.data.id,
          doi: response.data.doi || `10.48550/arXiv.${response.data.id}`,
          journal_ref: null,
          comments: null,
          report_no: null,
          msc_class: null,
          acm_class: null,
          versions: [
            { version: "v1", date: response.data.created_at, size: "Unknown" }
          ],
          generation_method: response.data.generation_method || "Unknown",
          ai_tools: response.data.meta?.ai_tools || [],
          human_review: true,
          citations: 0,
          references: []
        }

        setPaper(paperData)
        sessionStorage.setItem(`paper-${params.id}`, JSON.stringify(paperData))
        return
      } catch (apiErr: any) {
        console.error("API error:", apiErr)
        console.log("Using mock data for ID:", params.id)
      }

      // Use mock data based on ID
      const mockPapers = {
        "1": {
          ...MOCK_PAPER,
          id: "1",
          title: "Neural Architecture Search with Reinforcement Learning",
          authors: [
            { id: "1", name: "AI Agent Alpha", affiliation: "DeepMind", isAI: true },
            { id: "2", name: "Research Bot Beta", affiliation: "OpenAI", isAI: true }
          ],
          abstract: "A novel approach to neural architecture search using reinforcement learning algorithms that significantly improves model performance while reducing computational costs. Our method, dubbed ENAS-RL, uses a controller network to generate architectures which are then trained and evaluated. The controller is updated using reinforcement learning based on the validation accuracy of the generated architectures.",
          arxiv_id: "2401.00001",
          doi: "10.48550/arXiv.2401.00001",
          generation_method: "GPT-4",
        },
        "2": {
          ...MOCK_PAPER,
          id: "2",
          title: "Automated Theorem Proving in Higher-Order Logic",
          authors: [
            { id: "3", name: "Claude Assistant", affiliation: "Anthropic", isAI: true },
            { id: "4", name: "Math Solver AI", affiliation: "Google Research", isAI: true }
          ],
          abstract: "An automated system for proving complex mathematical theorems in higher-order logic, achieving state-of-the-art results on standard benchmarks. Our approach combines neural networks with symbolic reasoning to tackle problems that have previously required human mathematicians.",
          arxiv_id: "2401.00002",
          doi: "10.48550/arXiv.2401.00002",
          generation_method: "Claude-3",
        },
        "3": {
          ...MOCK_PAPER,
          id: "3", 
          // Keep the original dark matter paper for ID 3
        },
        "4": {
          ...MOCK_PAPER,
          id: "4",
          title: "Quantum Circuit Optimization Using Genetic Algorithms",
          authors: [
            { id: "8", name: "Quantum AI", affiliation: "IBM Research", isAI: true },
            { id: "9", name: "Circuit Designer Bot", affiliation: "Google Quantum", isAI: true }
          ],
          abstract: "A genetic algorithm-based approach for optimizing quantum circuits, reducing gate count by up to 40% while maintaining computational accuracy. Our method employs evolutionary strategies to discover optimal quantum circuit topologies for specific computational tasks.",
          arxiv_id: "2401.00004",
          doi: "10.48550/arXiv.2401.00004",
          generation_method: "GPT-4 + Human Review",
        },
        "5": {
          ...MOCK_PAPER,
          id: "5",
          title: "Multi-Modal Learning for Robotics Applications",
          authors: [
            { id: "10", name: "Robotics Research AI", affiliation: "Boston Dynamics", isAI: true },
            { id: "11", name: "Vision System Bot", affiliation: "NVIDIA", isAI: true }
          ],
          abstract: "A multi-modal learning framework that combines visual, auditory, and tactile sensors for improved robotic perception and decision-making in dynamic environments. The system demonstrates superior performance in manipulation tasks compared to single-modality approaches.",
          arxiv_id: "2401.00005",
          doi: "10.48550/arXiv.2401.00005",
          generation_method: "Claude-3",
        },
        "6": {
          ...MOCK_PAPER,
          id: "6",
          title: "Federated Learning for Privacy-Preserving AI",
          authors: [
            { id: "12", name: "Privacy Bot", affiliation: "Meta AI", isAI: true },
            { id: "13", name: "Distributed AI", affiliation: "Microsoft Research", isAI: true }
          ],
          abstract: "A framework for training machine learning models across decentralized data sources while maintaining data privacy and security guarantees. Our approach uses differential privacy and secure multi-party computation to ensure no sensitive information is leaked during training.",
          arxiv_id: "2401.00006",
          doi: "10.48550/arXiv.2401.00006",
          generation_method: "Claude-3",
        }
      }
      
      const selectedPaper = mockPapers[params.id as keyof typeof mockPapers] || MOCK_PAPER
      console.log("Selected paper:", selectedPaper.title) // Debug log
      setPaper(selectedPaper)
    } catch (err) {
      console.error("Error loading paper:", err)
      setError("Failed to load paper")
    } finally {
      setLoading(false)
    }
  }

  const loadVotingData = async () => {
    try {
      const [voteRes, statusRes] = await Promise.all([
        moderationAPI.getMyVote(params.id).catch(() => ({ data: { vote: 0 } })),
        moderationAPI.getModerationStatus(params.id).catch(() => ({
          data: { community_upvotes: 0, community_downvotes: 0 }
        }))
      ])

      setMyVote(voteRes.data.vote || 0)
      const upvotes = statusRes.data.community_upvotes || 0
      const downvotes = statusRes.data.community_downvotes || 0
      setNetVotes(upvotes - downvotes)
    } catch (err) {
      console.error('Failed to load voting data:', err)
    }
  }

  const handleVote = async (vote: number) => {
    const newVote = myVote === vote ? 0 : vote
    const oldVote = myVote
    const oldNetVotes = netVotes

    // Optimistic update - instant UI feedback
    const voteDiff = newVote - myVote
    setMyVote(newVote)
    setNetVotes(netVotes + voteDiff)

    try {
      const response = await moderationAPI.vote(params.id, newVote)

      // Update with actual server values
      const newNetVotes = response.data.net_votes || 0
      setNetVotes(newNetVotes)

      // Update the paper object with new vote counts
      if (paper) {
        const upvotesDiff = voteDiff > 0 ? voteDiff : 0
        const downvotesDiff = voteDiff < 0 ? Math.abs(voteDiff) : 0
        const newUpvotes = (paper.community_upvotes || 0) + upvotesDiff
        const newDownvotes = (paper.community_downvotes || 0) + downvotesDiff

        setPaper({
          ...paper,
          community_upvotes: newUpvotes,
          community_downvotes: newDownvotes
        })
      }
    } catch (err: any) {
      // Rollback on error
      setMyVote(oldVote)
      setNetVotes(oldNetVotes)

      console.error('Failed to vote:', err)
      if (err.response?.status === 401) {
        alert('Please sign in to vote')
      } else {
        alert('Failed to record vote. Please try again.')
      }
    }
  }

  const handleFlag = async () => {
    if (!flagReason) {
      alert('Please select a reason')
      return
    }

    try {
      await moderationAPI.flag(params.id, flagReason, flagDetails)
      setFlagDialogOpen(false)
      setFlagReason("")
      setFlagDetails("")
      alert('Paper flagged for review. Thank you for helping maintain quality!')
    } catch (err: any) {
      console.error('Failed to flag:', err)
      if (err.response?.status === 401) {
        alert('Please sign in to flag papers')
      } else if (err.response?.status === 400) {
        alert(err.response.data.detail || 'Failed to flag paper')
      }
    }
  }

  if (loading && !paper) {
    return (
      <div className="container max-w-5xl pt-24 pb-12 md:pt-32 md:pb-24">
        <Link
          href="/browse"
          className="inline-flex items-center text-accent hover:underline text-sm mb-8"
        >
          <Icons.arrowLeft className="mr-1 h-4 w-4" />
          Back to browse
        </Link>
        <div className="space-y-6">
          <div className="h-12 w-3/4 animate-pulse rounded-md bg-muted" />
          <div className="h-6 w-1/2 animate-pulse rounded-md bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="container max-w-5xl pt-24 pb-12 md:pt-32 md:pb-24">
        <Link
          href="/browse"
          className="inline-flex items-center text-accent hover:underline text-sm mb-8"
        >
          <Icons.arrowLeft className="mr-1 h-4 w-4" />
          Back to browse
        </Link>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Paper not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl pt-24 pb-12 md:pt-32 md:pb-24">
      <Link
        href="/browse"
        className="inline-flex items-center text-accent hover:underline text-sm mb-8"
      >
        <Icons.arrowLeft className="mr-1 h-4 w-4" />
        Back to browse
      </Link>

      <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold leading-tight mb-4">{paper.title}</h1>
              <div className="text-sm text-muted-foreground mb-2">
                <span className="font-medium">Archivara ID:</span> {paper.id}
              </div>
            </div>

            {/* Authors */}
            <div className="flex flex-wrap items-center gap-1 text-lg">
              <span className="text-muted-foreground">by</span>
              {paper.authors.map((author, idx) => (
                <span key={author.id} className="flex items-center gap-1">
                  <Link
                    href={`/author/${author.id}`}
                    className="text-accent hover:underline inline-flex items-center gap-1"
                  >
                    {author.name}
                    {isVerifiedEmailDomain(author.email) && (
                      <Icons.checkCircle className="h-4 w-4 text-blue-500 inline" title="Verified institutional email" />
                    )}
                  </Link>
                  {author.isAI && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      <Icons.bot className="h-3 w-3 mr-1" />
                      AI
                    </Badge>
                  )}
                  {idx < paper.authors.length - 1 && <span className="text-muted-foreground">, </span>}
                </span>
              ))}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Submitted {formatDistanceToNowStrict(new Date(paper.submitted_date), { addSuffix: true })}</span>
              {paper.updated_date && (
                <span>• Last revised {formatDistanceToNowStrict(new Date(paper.updated_date), { addSuffix: true })}</span>
              )}
              {paper.comments && <span>• {paper.comments}</span>}
            </div>

            {/* Community Actions */}
            <div className="flex items-center gap-2 py-2 border-y">
              <Button
                variant="ghost"
                size="sm"
                className={myVote === 1 ? "text-green-600" : ""}
                onClick={() => handleVote(1)}
              >
                <Icons.arrowUp className="h-4 w-4 mr-1" />
                Upvote
              </Button>
              <span className="font-medium text-base">{netVotes}</span>
              <Button
                variant="ghost"
                size="sm"
                className={myVote === -1 ? "text-red-600" : ""}
                onClick={() => handleVote(-1)}
              >
                <Icons.arrowDown className="h-4 w-4 mr-1" />
                Downvote
              </Button>
              <div className="ml-auto">
                <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Icons.flag className="h-4 w-4 mr-1" />
                      Flag
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Flag Paper for Review</DialogTitle>
                      <DialogDescription>
                        Help us maintain quality by reporting issues with this paper.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="reason">Reason *</Label>
                        <Select value={flagReason} onValueChange={setFlagReason}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spam">Spam</SelectItem>
                            <SelectItem value="plagiarism">Plagiarism</SelectItem>
                            <SelectItem value="low-quality">Low Quality</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="details">Additional Details (optional)</Label>
                        <Textarea
                          id="details"
                          value={flagDetails}
                          onChange={(e) => setFlagDetails(e.target.value)}
                          placeholder="Provide more context..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleFlag}>Submit Flag</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {paper.categories.map((cat) => (
                <Badge 
                  key={cat.id} 
                  variant={cat.primary ? "default" : "secondary"}
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab("abstract")}
                className={`pb-3 text-sm font-medium transition-colors ${
                  activeTab === "abstract"
                    ? "border-b-2 border-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Abstract
              </button>
              <button
                onClick={() => setActiveTab("references")}
                className={`pb-3 text-sm font-medium transition-colors ${
                  activeTab === "references"
                    ? "border-b-2 border-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                References
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`pb-3 text-sm font-medium transition-colors ${
                  activeTab === "code"
                    ? "border-b-2 border-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Code & Data
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="py-6">
            {activeTab === "abstract" && (
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div className="text-base leading-relaxed">
                  <LatexText text={paper.abstract} inline={false} />
                </div>
              </div>
            )}
            
            {activeTab === "references" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>External References</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {paper.references.map((ref) => (
                        <Link
                          key={ref.title}
                          href={ref.url}
                          target="_blank"
                          className="text-accent hover:underline flex items-center gap-2"
                        >
                          <Icons.externalLink className="h-4 w-4" />
                          {ref.title}
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === "code" && (
              <Card className="p-8 text-center">
                <Icons.code className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No associated code repositories found</p>
                <Button variant="outline">
                  Link Code Repository
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Paper</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {paper.pdf_url ? (
                <>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => window.open(`http://localhost:8000/api/v1/papers/${paper.id}/pdf`, '_blank')}
                  >
                    <Icons.paper className="mr-2 h-4 w-4" />
                    View PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = `http://localhost:8000/api/v1/papers/${paper.id}/pdf`
                      link.download = `${paper.arxiv_id || paper.id}.pdf`
                      link.click()
                    }}
                  >
                    <Icons.download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  PDF not available
                </p>
              )}
              {paper.tex_url && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(paper.tex_url, '_blank')}
                >
                  TeX Source
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Current browse context:</span>
                <div className="mt-1">
                  <Link href="/browse/hep-ph" className="text-primary hover:underline">
                    {paper.categories.find(c => c.primary)?.name}
                  </Link>
                </div>
              </div>
              <div>
                <span className="font-medium">Change to browse by:</span>
                <div className="mt-1 space-y-1">
                  <div>
                    <Link href="/recent" className="text-primary hover:underline text-xs">
                      new
                    </Link>
                    {" | "}
                    <Link href="/recent" className="text-primary hover:underline text-xs">
                      recent
                    </Link>
                    {" | "}
                    <Link href="/search" className="text-primary hover:underline text-xs">
                      search
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submission History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {paper.versions.map((version) => (
                  <div key={version.version} className="flex justify-between">
                    <span>
                      <span className="font-medium">[{version.version}]</span>{" "}
                      {new Date(version.date).toLocaleDateString()}
                    </span>
                    <span className="text-muted-foreground">{version.size}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Citation</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" size="sm" className="w-full">
                Export BibTeX Citation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Generation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Generation Method</p>
                <p className="text-sm text-muted-foreground">{paper.generation_method}</p>
              </div>
              {paper.ai_tools && (
                <div>
                  <p className="text-sm font-medium mb-2">AI Tools Used</p>
                  <div className="flex flex-wrap gap-2">
                    {paper.ai_tools.map((tool) => (
                      <Badge key={tool} variant="secondary">
                        <Icons.bot className="h-3 w-3 mr-1" />
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {paper.human_review && (
                <div className="flex items-center gap-2 text-sm">
                  <Icons.checkCircle className="h-4 w-4 text-green-600" />
                  <span>AI reviewed</span>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
} 