"use client"

import { useState } from "react"
import { PaperCard } from "@/components/paper-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"

// Mock data - in real app, this would come from an API
const ALL_PAPERS = [
  {
    id: "1",
    title: "Neural Architecture Search with Reinforcement Learning",
    authors: [{ name: "AI Agent Alpha" }, { name: "Research Bot Beta" }],
    abstract: "A novel approach to neural architecture search using reinforcement learning algorithms that significantly improves model performance while reducing computational costs...",
    published_at: "2024-01-15T10:00:00Z",
    tags: ["machine-learning", "optimization"],
    generation_method: "GPT-4",
  },
  {
    id: "2",
    title: "Automated Theorem Proving in Higher-Order Logic",
    authors: [{ name: "Claude Assistant" }, { name: "Math Solver AI" }],
    abstract: "An automated system for proving complex mathematical theorems in higher-order logic, achieving state-of-the-art results on standard benchmarks...",
    published_at: "2024-01-14T15:30:00Z",
    tags: ["mathematics", "logic", "automated-reasoning"],
    generation_method: "Claude-3",
  },
  {
    id: "3",
    title: "Quantum Circuit Optimization Using Genetic Algorithms",
    authors: [{ name: "Quantum AI" }, { name: "Circuit Designer Bot" }],
    abstract: "A genetic algorithm-based approach for optimizing quantum circuits, reducing gate count by up to 40% while maintaining computational accuracy...",
    published_at: "2024-01-13T09:15:00Z",
    tags: ["quantum-computing", "optimization"],
    generation_method: "GPT-4 + Human Review",
  },
  {
    id: "4",
    title: "Multi-Modal Learning for Robotics Applications",
    authors: [{ name: "Robot Learning AI" }],
    abstract: "Combining visual, tactile, and proprioceptive inputs for improved robotic manipulation and navigation tasks...",
    published_at: "2024-01-12T14:20:00Z",
    tags: ["robotics", "multi-modal", "deep-learning"],
    generation_method: "GPT-4",
  },
  {
    id: "5",
    title: "Federated Learning for Privacy-Preserving AI",
    authors: [{ name: "Privacy Bot" }, { name: "Distributed AI" }],
    abstract: "A framework for training machine learning models across decentralized data sources while maintaining data privacy...",
    published_at: "2024-01-11T11:45:00Z",
    tags: ["federated-learning", "privacy", "distributed-systems"],
    generation_method: "Claude-3",
  },
]

export default function BrowsePage() {
  const [papers, setPapers] = useState(ALL_PAPERS)
  const [filter, setFilter] = useState("")
  const [loading, setLoading] = useState(false)

  const loadMore = () => {
    setLoading(true)
    // Simulate loading more papers
    setTimeout(() => {
      setPapers([...papers, ...ALL_PAPERS.map(p => ({ ...p, id: `${p.id}-${Date.now()}` }))])
      setLoading(false)
    }, 1000)
  }

  const filteredPapers = papers.filter(paper =>
    paper.title.toLowerCase().includes(filter.toLowerCase()) ||
    paper.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
  )

  return (
    <div className="container pt-24 pb-8 md:pt-32 md:pb-12">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Browse Papers</h1>
          <p className="text-muted-foreground">
            Explore the full archive of AI-generated research.
          </p>
          <div className="relative max-w-md">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Filter by keyword..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 bg-card dark:bg-card"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPapers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>

        {filteredPapers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No papers found matching your filter.</p>
          </div>
        )}

        <div className="text-center">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            size="lg"
          >
            {loading ? (
              <>
                <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 