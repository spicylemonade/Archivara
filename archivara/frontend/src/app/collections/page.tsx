"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { subjects } from "@/config/subjects"
import { api } from "@/lib/api"

// Main subject collections based on arXiv categories
const SUBJECT_COLLECTIONS = [
  {
    id: "physics",
    title: "Physics",
    description: "All physics research including astrophysics, condensed matter, high energy physics, and more",
    icon: Icons.cpu,
    categories: Object.keys(subjects.physics.categories).length,
    papers: 0
  },
  {
    id: "mathematics",
    title: "Mathematics",
    description: "Pure and applied mathematics including algebra, geometry, analysis, and topology",
    icon: Icons.brain,
    categories: Object.keys(subjects.mathematics.categories).length,
    papers: 0
  },
  {
    id: "computer-science",
    title: "Computer Science",
    description: "Computing research including AI, machine learning, systems, and theory",
    icon: Icons.code,
    categories: Object.keys(subjects.computerScience.categories).length,
    papers: 0
  },
  {
    id: "quantitative-biology",
    title: "Quantitative Biology",
    description: "Computational biology, genomics, and bioinformatics research",
    icon: Icons.experiment,
    categories: Object.keys(subjects.quantitativeBiology.categories).length,
    papers: 0
  },
  {
    id: "quantitative-finance",
    title: "Quantitative Finance",
    description: "Financial mathematics, risk management, and computational finance",
    icon: Icons.library,
    categories: Object.keys(subjects.quantitativeFinance.categories).length,
    papers: 0
  },
  {
    id: "statistics",
    title: "Statistics",
    description: "Statistical theory, methodology, and applications",
    icon: Icons.gitBranch,
    categories: Object.keys(subjects.statistics.categories).length,
    papers: 0
  },
  {
    id: "electrical-engineering",
    title: "Electrical Engineering & Systems",
    description: "Signal processing, control systems, and electrical engineering",
    icon: Icons.network,
    categories: Object.keys(subjects.electricalEngineering.categories).length,
    papers: 0
  },
  {
    id: "economics",
    title: "Economics",
    description: "Economic theory, econometrics, and applied economics",
    icon: Icons.library,
    categories: Object.keys(subjects.economics.categories).length,
    papers: 0
  }
]

// Curated collections
const CURATED_COLLECTIONS = [
  {
    id: "llm-advances",
    title: "Large Language Model Advances",
    description: "Latest breakthroughs in LLM research and applications",
    papers: 0,
    updated: "2024-01-15",
    tags: ["nlp", "transformers", "scaling"],
    icon: Icons.brain,
    curator: "AI Research Team"
  },
  {
    id: "dark-matter-ml",
    title: "ML for Dark Matter Detection",
    description: "Machine learning approaches to dark matter physics",
    papers: 0,
    updated: "2024-01-14",
    tags: ["physics", "machine-learning", "dark-matter"],
    icon: Icons.experiment,
    curator: "Physics ML Group"
  },
  {
    id: "quantum-algorithms",
    title: "Quantum Computing Algorithms",
    description: "Novel algorithms for quantum computers",
    papers: 0,
    updated: "2024-01-13",
    tags: ["quantum", "algorithms", "optimization"],
    icon: Icons.cpu,
    curator: "Quantum Team"
  },
  {
    id: "ai-safety",
    title: "AI Safety & Alignment",
    description: "Research on safe and aligned AI systems",
    papers: 0,
    updated: "2024-01-12",
    tags: ["ai-safety", "alignment", "ethics"],
    icon: Icons.bot,
    curator: "Safety Research Group"
  }
]

// Helper to map category strings to subject IDs
function getCategorySubject(category: string): string {
  const cat = category.toLowerCase()

  // Mathematics
  if (cat.includes('algebra') || cat.includes('geometry') || cat.includes('topology') ||
      cat.includes('analysis') || cat.includes('number theory') || cat.includes('probability') ||
      cat.includes('combinatorics') || cat.includes('logic') || cat.includes('optimization') ||
      cat.match(/\bmath\b/)) {
    return 'mathematics'
  }

  // Computer Science
  if (cat.includes('artificial intelligence') || cat.includes('machine learning') ||
      cat.includes('computer') || cat.includes('algorithm') || cat.includes('programming') ||
      cat.includes('software') || cat.includes('data structure') || cat.includes('cryptography') ||
      cat.includes('network') || cat.includes('database')) {
    return 'computer-science'
  }

  // Physics (various subcategories)
  if (cat.includes('physics') || cat.includes('quantum') || cat.includes('astrophysics') ||
      cat.includes('cosmology') || cat.includes('relativity') || cat.includes('particle') ||
      cat.includes('nuclear') || cat.includes('condensed matter') || cat.includes('optics') ||
      cat.includes('plasma')) {
    return 'physics'
  }

  // Biology
  if (cat.includes('biology') || cat.includes('genomics') || cat.includes('bioinformatics') ||
      cat.includes('molecular') || cat.includes('cell')) {
    return 'quantitative-biology'
  }

  // Finance
  if (cat.includes('finance') || cat.includes('economic') || cat.includes('trading')) {
    return 'quantitative-finance'
  }

  // Statistics
  if (cat.includes('statistics') || cat.includes('statistical')) {
    return 'statistics'
  }

  // Electrical Engineering
  if (cat.includes('electrical') || cat.includes('signal processing') || cat.includes('control systems')) {
    return 'electrical-engineering'
  }

  // Economics
  if (cat.includes('econom')) {
    return 'economics'
  }

  return 'other'
}

export default function CollectionsPage() {
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPaperCounts()
  }, [])

  const loadPaperCounts = async () => {
    try {
      const response = await api.get('/papers', { params: { size: 1000 } })
      const papers = response.data.items || []

      // Count papers by subject
      const counts: Record<string, number> = {}
      SUBJECT_COLLECTIONS.forEach(s => counts[s.id] = 0)

      papers.forEach((paper: any) => {
        const categories = paper.categories || []
        const subjects = new Set<string>()

        categories.forEach((cat: string) => {
          const subject = getCategorySubject(cat)
          if (subject !== 'other') {
            subjects.add(subject)
          }
        })

        subjects.forEach(subject => {
          counts[subject] = (counts[subject] || 0) + 1
        })
      })

      setSubjectCounts(counts)
    } catch (err) {
      console.error('Failed to load paper counts:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container pt-24 pb-8 md:pt-32 md:pb-12">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Collections</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Browse papers by subject area or explore curated collections
          </p>
        </div>

        {/* Subject Collections */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-6">Browse by Subject</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {SUBJECT_COLLECTIONS.map((subject) => {
                const Icon = subject.icon
                const paperCount = subjectCounts[subject.id] || 0
                return (
                  <Link key={subject.id} href={`/browse?subject=${subject.id}`}>
                    <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 bg-card dark:bg-card cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <Icon className="h-8 w-8 text-accent" />
                          <Badge variant="secondary" className="text-xs">
                            {loading ? '...' : paperCount.toLocaleString()} papers
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{subject.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {subject.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          {subject.categories} categories
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Curated Collections */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Curated Collections</h2>
            <p className="text-muted-foreground mb-6">
              Hand-picked collections by our research community
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CURATED_COLLECTIONS.map((collection) => {
                const Icon = collection.icon
                return (
                  <Link key={collection.id} href={`/collections/${collection.id}`}>
                    <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 bg-card dark:bg-card cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <Icon className="h-8 w-8 text-accent" />
                          <Badge variant="secondary">{collection.papers} papers</Badge>
                        </div>
                        <CardTitle className="mt-4">{collection.title}</CardTitle>
                        <CardDescription>{collection.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {collection.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>by {collection.curator}</span>
                            <span>Updated {new Date(collection.updated).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground">
            Want to create your own collection?{" "}
            <Link href="/submit" className="text-accent hover:underline">
              Submit your curation
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 