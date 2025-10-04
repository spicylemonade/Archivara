"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { PaperCard } from "@/components/paper-card"
import { authorsAPI } from "@/lib/api"

export default function AuthorPage({ params }: { params: { id: string } }) {
  const [author, setAuthor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"papers" | "stats" | "network">("papers")

  useEffect(() => {
    loadAuthorData()
  }, [params.id])

  const loadAuthorData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await authorsAPI.get(params.id)
      setAuthor(response.data)
    } catch (err: any) {
      console.error('Failed to load author:', err)
      setError(err.response?.data?.detail || 'Failed to load author profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container pt-24 pb-12 md:pt-32 md:pb-24">
        <div className="flex justify-center items-center min-h-[400px]">
          <Icons.loader className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !author) {
    return (
      <div className="container pt-24 pb-12 md:pt-32 md:pb-24">
        <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
          <p className="text-sm">{error || 'Author not found'}</p>
        </div>
      </div>
    )
  }

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
                  <a href={`mailto:${author.email}`} className="text-accent hover:underline">
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
                    className="text-accent hover:underline"
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
                    ? "border-b-2 border-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Papers ({author.total_papers})
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === "stats"
                    ? "border-b-2 border-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Statistics
              </button>
              <button
                onClick={() => setActiveTab("network")}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === "network"
                    ? "border-b-2 border-accent text-foreground"
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
                            className="text-accent hover:underline"
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