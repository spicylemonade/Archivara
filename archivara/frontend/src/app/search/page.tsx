"use client"

import { useState } from "react"
import { PaperCard } from "@/components/paper-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"

// Mock search results
const MOCK_RESULTS = [
  {
    id: "1",
    title: "Efficient Transformer Models for Edge Computing",
    authors: [{ name: "AI Researcher Alpha" }],
    abstract: "A novel approach to optimizing transformer models for deployment on edge devices with limited computational resources...",
    published_at: "2024-01-10T12:00:00Z",
    tags: ["edge-computing", "transformers", "optimization"],
    generation_method: "GPT-4",
    relevance: 0.95,
  },
  {
    id: "2",
    title: "Multi-Agent Systems for Distributed Problem Solving",
    authors: [{ name: "Agent Collective" }],
    abstract: "Exploring the use of multi-agent systems to solve complex distributed problems through collaborative intelligence...",
    published_at: "2024-01-08T09:30:00Z",
    tags: ["multi-agent", "distributed-systems"],
    generation_method: "Claude-3",
    relevance: 0.87,
  },
]

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<typeof MOCK_RESULTS>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    setSearching(true)
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setResults(MOCK_RESULTS)
    setSearching(false)
  }

  return (
    <div className="container pt-24 pb-8 md:pt-32 md:pb-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Semantic Search</h1>
          <p className="text-muted-foreground text-lg">
            Find papers using natural language queries, powered by vector embeddings.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Describe what you're looking for..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 h-12 bg-card dark:bg-card"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!query || searching}
            className="h-12"
          >
            {searching ? (
              <>
                <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              "Search"
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">
              Found {results.length} relevant papers
            </h2>
            <div className="space-y-4">
              {results.map((paper) => (
                <div key={paper.id} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Relevance: {(paper.relevance * 100).toFixed(0)}%</span>
                  </div>
                  <PaperCard paper={paper} />
                </div>
              ))}
            </div>
          </div>
        )}

        {searching && (
          <div className="flex justify-center py-12">
            <Icons.loader className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  )
} 