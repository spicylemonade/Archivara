"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { PaperCard } from "@/components/paper-card"

// Mock data
const MOCK_AUTHOR = {
  id: "1",
  name: "Cameron Cook",
  affiliation: "University of Example",
  email: "ccook@example.edu",
  orcid: "0000-0001-2345-6789",
  h_index: 15,
  total_citations: 342,
  total_papers: 28,
  research_areas: [
    "Dark Matter Detection",
    "Machine Learning",
    "Quantum Chemistry",
    "Molecular Physics"
  ],
  recent_papers: [
    {
      id: "1",
      title: "Deep learning optimal molecular scintillators for dark matter direct detection",
      authors: [
        { name: "Cameron Cook" },
        { name: "Carlos Blanco" },
        { name: "Juri Smirnov" }
      ],
      abstract: "Direct searches for sub-GeV dark matter are limited by the intrinsic quantum properties of the target material...",
      published_at: "2024-12-30T19:00:00Z",
      tags: ["dark-matter", "machine-learning", "molecular-physics"],
      generation_method: "GPT-4 + Human Review",
    },
    {
      id: "2",
      title: "Novel approaches to quantum sensing with organic molecules",
      authors: [
        { name: "Cameron Cook" },
        { name: "Alice Smith" }
      ],
      abstract: "We present a comprehensive framework for utilizing organic molecules as quantum sensors...",
      published_at: "2024-11-15T10:00:00Z",
      tags: ["quantum-sensing", "organic-chemistry"],
      generation_method: "Claude-3",
    },
    {
      id: "3",
      title: "Machine learning accelerated discovery of scintillator materials",
      authors: [
        { name: "Cameron Cook" },
        { name: "Bob Johnson" },
        { name: "Eve Wilson" }
      ],
      abstract: "Traditional materials discovery for scintillators is a time-consuming process...",
      published_at: "2024-10-20T14:30:00Z",
      tags: ["materials-science", "machine-learning"],
      generation_method: "GPT-4",
    }
  ],
  collaborators: [
    { id: "2", name: "Carlos Blanco", papers: 12 },
    { id: "3", name: "Juri Smirnov", papers: 8 },
    { id: "4", name: "Alice Smith", papers: 5 },
    { id: "5", name: "Bob Johnson", papers: 3 }
  ],
  stats_by_year: [
    { year: 2024, papers: 8, citations: 45 },
    { year: 2023, papers: 6, citations: 89 },
    { year: 2022, papers: 7, citations: 102 },
    { year: 2021, papers: 4, citations: 67 },
    { year: 2020, papers: 3, citations: 39 }
  ]
}

export default function AuthorPage({ params }: { params: { id: string } }) {
  const [author] = useState(MOCK_AUTHOR)
  const [activeTab, setActiveTab] = useState<"papers" | "stats" | "network">("papers")

  return (
    <div className="container pt-24 pb-12 md:pt-32 md:pb-24">
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{author.name}</h1>
            <div className="text-muted-foreground">
              <p>{author.affiliation}</p>
              {author.email && (
                <p>
                  <a href={`mailto:${author.email}`} className="text-primary hover:underline">
                    {author.email}
                  </a>
                </p>
              )}
              {author.orcid && (
                <p>
                  ORCID:{" "}
                  <a 
                    href={`https://orcid.org/${author.orcid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {author.orcid}
                  </a>
                </p>
              )}
            </div>
            
            {/* Research Areas */}
            <div className="flex flex-wrap gap-2">
              {author.research_areas.map((area) => (
                <Badge key={area} variant="secondary">
                  {area}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab("papers")}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === "papers" 
                    ? "border-b-2 border-primary text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Papers ({author.total_papers})
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === "stats" 
                    ? "border-b-2 border-primary text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Statistics
              </button>
              <button
                onClick={() => setActiveTab("network")}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === "network" 
                    ? "border-b-2 border-primary text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Collaboration Network
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === "papers" && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Recent Papers</h2>
                <div className="space-y-4">
                  {author.recent_papers.map((paper) => (
                    <PaperCard key={paper.id} paper={paper} />
                  ))}
                </div>
                <div className="text-center pt-4">
                  <Button variant="outline">
                    View All {author.total_papers} Papers
                  </Button>
                </div>
              </div>
            )}
            
            {activeTab === "stats" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Publication Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Papers</p>
                          <p className="text-2xl font-bold">{author.total_papers}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Citations</p>
                          <p className="text-2xl font-bold">{author.total_citations}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">h-index</p>
                        <p className="text-2xl font-bold">{author.h_index}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Publications by Year</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {author.stats_by_year.map((stat) => (
                        <div key={stat.year} className="flex justify-between text-sm">
                          <span>{stat.year}</span>
                          <span>{stat.papers} papers ({stat.citations} citations)</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === "network" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Frequent Collaborators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {author.collaborators.map((collaborator) => (
                        <div key={collaborator.id} className="flex justify-between items-center">
                          <Link 
                            href={`/author/${collaborator.id}`}
                            className="text-primary hover:underline"
                          >
                            {collaborator.name}
                          </Link>
                          <span className="text-sm text-muted-foreground">
                            {collaborator.papers} joint papers
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="p-8 text-center">
                  <Icons.network className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Interactive collaboration network visualization would appear here
                  </p>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Papers</span>
                <span className="font-medium">{author.total_papers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Citations</span>
                <span className="font-medium">{author.total_citations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">h-index</span>
                <span className="font-medium">{author.h_index}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Collaborators</span>
                <span className="font-medium">{author.collaborators.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>External Profiles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                <Icons.externalLink className="mr-2 h-4 w-4" />
                Google Scholar
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                <Icons.externalLink className="mr-2 h-4 w-4" />
                ORCID
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                <Icons.externalLink className="mr-2 h-4 w-4" />
                ResearchGate
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                <Icons.download className="mr-2 h-4 w-4" />
                Download Publication List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 