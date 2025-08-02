"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { formatDistanceToNowStrict } from "date-fns"

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
  const [paper] = useState(MOCK_PAPER)
  const [activeTab, setActiveTab] = useState("abstract")

  return (
    <div className="container max-w-5xl pt-24 pb-12 md:pt-32 md:pb-24">
      <Link
        href="/browse"
        className="inline-flex items-center text-primary hover:underline text-sm mb-8"
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
              <div className="text-sm text-muted-foreground mb-4">
                <span className="font-medium">arXiv:</span> {paper.arxiv_id}
                {paper.doi && (
                  <>
                    {" • "}
                    <span className="font-medium">DOI:</span> {paper.doi}
                  </>
                )}
              </div>
            </div>

            {/* Authors */}
            <div className="flex flex-wrap items-center gap-1 text-lg">
              <span className="text-muted-foreground">by</span>
              {paper.authors.map((author, idx) => (
                <span key={author.id} className="flex items-center gap-1">
                  <Link
                    href={`/author/${author.id}`}
                    className="text-primary hover:underline"
                  >
                    {author.name}
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
                    ? "border-b-2 border-primary text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Abstract
              </button>
              <button
                onClick={() => setActiveTab("references")}
                className={`pb-3 text-sm font-medium transition-colors ${
                  activeTab === "references" 
                    ? "border-b-2 border-primary text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                References
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`pb-3 text-sm font-medium transition-colors ${
                  activeTab === "code" 
                    ? "border-b-2 border-primary text-foreground" 
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
                <p className="text-base leading-relaxed">{paper.abstract}</p>
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
                          className="text-primary hover:underline flex items-center gap-2"
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
              <Button className="w-full" size="lg">
                <Icons.paper className="mr-2 h-4 w-4" />
                View PDF
              </Button>
              <Button variant="outline" className="w-full">
                <Icons.download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" className="w-full">
                HTML (experimental)
              </Button>
              <Button variant="outline" className="w-full">
                TeX Source
              </Button>
              <Button variant="outline" className="w-full">
                Other Formats
              </Button>
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
                  <span>Human reviewed</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Generation Method: {paper.generation_method}</p>
            {paper.doi && <p>DOI: {paper.doi}</p>}
          </div>
        </div>
      </div>
    </div>
  )
} 