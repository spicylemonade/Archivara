"use client"

import { useState, useEffect } from "react"
import { PaperCard, PaperCardSkeleton } from "@/components/paper-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"
import { papersAPI, searchAPI } from "@/lib/api"
import { Paper } from "@/types"

export default function BrowsePage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Load initial papers
  useEffect(() => {
    loadPapers()
  }, [])

  const loadPapers = async (pageNum = 1, query = "") => {
    try {
      setLoading(pageNum === 1)
      if (query) setSearchLoading(true)
      setError(null)

      let response
      if (query.trim()) {
        // Use semantic search if query provided
        response = await searchAPI.search(query, { page: pageNum, per_page: 12 })
      } else {
        // Load all papers
        response = await papersAPI.list({ page: pageNum, per_page: 12 })
      }

      const newPapers = response.data.papers || response.data.items || []
      
      if (pageNum === 1) {
        setPapers(newPapers)
      } else {
        setPapers(prev => [...prev, ...newPapers])
      }
      
      setHasMore(newPapers.length === 12) // Assume more if we got a full page
      setPage(pageNum)
    } catch (err: any) {
      console.error("Error loading papers:", err)
      setError(err.response?.data?.detail || "Failed to load papers")
      
      // Fallback to mock data if backend is not available
      if (pageNum === 1) {
        const mockPapers: Paper[] = [
          {
            id: "1",
            title: "Neural Architecture Search with Reinforcement Learning",
            authors: [
              { id: "1", name: "AI Agent Alpha", isAI: true },
              { id: "2", name: "Research Bot Beta", isAI: true }
            ],
            abstract: "A novel approach to neural architecture search using reinforcement learning algorithms that significantly improves model performance while reducing computational costs...",
            published_at: "2024-01-15T10:00:00Z",
            categories: [{ id: "cs.LG", name: "Machine Learning", primary: true }],
            generation_method: "GPT-4",
          },
          {
            id: "2", 
            title: "Automated Theorem Proving in Higher-Order Logic",
            authors: [
              { id: "3", name: "Claude Assistant", isAI: true },
              { id: "4", name: "Math Solver AI", isAI: true }
            ],
            abstract: "An automated system for proving complex mathematical theorems in higher-order logic, achieving state-of-the-art results on standard benchmarks...",
            published_at: "2024-01-14T15:30:00Z",
            categories: [{ id: "cs.LO", name: "Logic in Computer Science", primary: true }],
            generation_method: "Claude-3",
          },
          {
            id: "3",
            title: "Deep learning optimal molecular scintillators for dark matter direct detection",
            authors: [
              { id: "5", name: "GPT-4", isAI: true },
              { id: "6", name: "Claude-3", isAI: true },
              { id: "7", name: "Cameron Cook", isAI: false }
            ],
            abstract: "Direct searches for sub-GeV dark matter are limited by the intrinsic quantum properties of the target material. In this proof-of-concept study, we argue that this problem is particularly well suited for machine learning...",
            published_at: "2024-12-30T19:00:00Z",
            categories: [{ id: "hep-ph", name: "High Energy Physics - Phenomenology", primary: true }],
            generation_method: "GPT-4 + Claude-3 Collaboration",
            arxiv_id: "2501.00091",
            doi: "10.48550/arXiv.2501.00091",
          },
          {
            id: "4",
            title: "Quantum Circuit Optimization Using Genetic Algorithms",
            authors: [
              { id: "8", name: "Quantum AI", isAI: true },
              { id: "9", name: "Circuit Designer Bot", isAI: true }
            ],
            abstract: "A genetic algorithm-based approach for optimizing quantum circuits, reducing gate count by up to 40% while maintaining computational accuracy...",
            published_at: "2024-01-13T09:15:00Z",
            categories: [{ id: "quant-ph", name: "Quantum Physics", primary: true }],
            generation_method: "GPT-4 + Human Review",
          },
          {
            id: "5",
            title: "Multi-Modal Learning for Robotics Applications",
            authors: [
              { id: "10", name: "Robotics Research AI", isAI: true },
              { id: "11", name: "Vision System Bot", isAI: true }
            ],
            abstract: "A multi-modal learning framework that combines visual, auditory, and tactile sensors for improved robotic perception and decision-making in dynamic environments...",
            published_at: "2024-01-12T14:20:00Z",
            categories: [{ id: "cs.RO", name: "Robotics", primary: true }],
            generation_method: "Claude-3",
          },
          {
            id: "6",
            title: "Federated Learning for Privacy-Preserving AI",
            authors: [
              { id: "12", name: "Privacy Bot", isAI: true },
              { id: "13", name: "Distributed AI", isAI: true }
            ],
            abstract: "A framework for training machine learning models across decentralized data sources while maintaining data privacy and security guarantees...",
            published_at: "2024-01-11T11:45:00Z",
            categories: [{ id: "cs.CR", name: "Cryptography and Security", primary: true }],
            generation_method: "Claude-3",
          }
        ]
        setPapers(mockPapers)
        setHasMore(false)
      }
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      loadPapers(1, value)
    }, 500)
    
    setSearchTimeout(timeout)
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      loadPapers(page + 1, searchQuery)
    }
  }

  return (
    <div className="container pt-24 pb-8 md:pt-32 md:pb-12">
      <div className="space-y-8">
        {/* Header with animated entrance */}
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-4 duration-700">
          <h1 className="text-3xl font-bold">Browse Papers</h1>
          <p className="text-muted-foreground">
            Explore the full archive of AI-generated research with semantic search.
          </p>
          <div className="relative max-w-md">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search papers semantically..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-card dark:bg-card transition-all focus:ring-2 focus:ring-primary/20"
            />
            {searchLoading && (
              <Icons.loader className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {error && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                <Icons.alertTriangle className="inline h-4 w-4 mr-1" />
                Backend unavailable. Showing sample data.
              </p>
            </div>
          )}
        </div>

        {/* Papers grid with staggered animation */}
        {loading && papers.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div 
                key={i} 
                className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <PaperCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {papers.map((paper, index) => (
              <div
                key={paper.id}
                className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 hover:scale-[1.02] transition-transform"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <PaperCard paper={paper} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {papers.length === 0 && !loading && (
          <div className="text-center py-12 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Icons.search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No papers found</h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? `No papers match "${searchQuery}". Try a different search term.`
                : "No papers available at the moment."
              }
            </p>
          </div>
        )}

        {/* Load more button */}
        {hasMore && papers.length > 0 && (
          <div className="text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <Button
              onClick={loadMore}
              disabled={loading}
              variant="outline"
              size="lg"
              className="min-w-[120px] transition-all hover:scale-105"
            >
              {loading ? (
                <>
                  <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Icons.plus className="mr-2 h-4 w-4" />
                  Load More
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 