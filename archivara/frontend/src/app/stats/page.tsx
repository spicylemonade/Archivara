"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Mock data
const STATS = {
  totalPapers: 12847,
  totalAuthors: 8956,
  totalCitations: 156789,
  avgCitationsPerPaper: 12.2,
  papersByCategory: [
    { category: "Machine Learning", count: 3456, percentage: 26.9 },
    { category: "High Energy Physics", count: 2890, percentage: 22.5 },
    { category: "Quantum Physics", count: 1876, percentage: 14.6 },
    { category: "Mathematics", count: 1543, percentage: 12.0 },
    { category: "Astrophysics", count: 1234, percentage: 9.6 },
    { category: "Condensed Matter", count: 998, percentage: 7.8 },
    { category: "Other", count: 850, percentage: 6.6 }
  ],
  papersByGenerationMethod: [
    { method: "GPT-4", count: 4567, percentage: 35.5 },
    { method: "Claude-3", count: 3890, percentage: 30.3 },
    { method: "GPT-4 + Human Review", count: 2345, percentage: 18.2 },
    { method: "Claude-3 + Human Review", count: 1234, percentage: 9.6 },
    { method: "Other", count: 811, percentage: 6.3 }
  ],
  monthlySubmissions: [
    { month: "Jan 2024", papers: 876 },
    { month: "Feb 2024", papers: 923 },
    { month: "Mar 2024", papers: 1045 },
    { month: "Apr 2024", papers: 1123 },
    { month: "May 2024", papers: 1234 },
    { month: "Jun 2024", papers: 1189 },
    { month: "Jul 2024", papers: 1302 },
    { month: "Aug 2024", papers: 1267 },
    { month: "Sep 2024", papers: 1345 },
    { month: "Oct 2024", papers: 1456 },
    { month: "Nov 2024", papers: 1523 },
    { month: "Dec 2024", papers: 1564 }
  ],
  topAuthors: [
    { name: "Alice Chen", papers: 89, citations: 1234 },
    { name: "Bob Smith", papers: 76, citations: 1098 },
    { name: "Carol Johnson", papers: 72, citations: 987 },
    { name: "David Brown", papers: 68, citations: 876 },
    { name: "Eve Wilson", papers: 65, citations: 823 }
  ],
  topCitedPapers: [
    { title: "Advances in Neural Architecture Search", citations: 234 },
    { title: "Quantum Machine Learning: A Survey", citations: 198 },
    { title: "Dark Matter Detection with ML", citations: 187 },
    { title: "Transformer Models for Physics", citations: 176 },
    { title: "Graph Neural Networks in Chemistry", citations: 165 }
  ],
  growthStats: {
    papersGrowth: "+23.5%",
    authorsGrowth: "+18.2%",
    citationsGrowth: "+45.7%",
    avgPapersPerDay: 42.3
  }
}

export default function StatsPage() {
  return (
    <div className="container pt-24 pb-12 md:pt-32 md:pb-24">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Archive Statistics</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real-time statistics and insights about the AI-generated research archive
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Papers</CardTitle>
              <Badge variant="secondary">{STATS.growthStats.papersGrowth}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{STATS.totalPapers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {STATS.growthStats.avgPapersPerDay} papers/day average
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Authors</CardTitle>
              <Badge variant="secondary">{STATS.growthStats.authorsGrowth}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{STATS.totalAuthors.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Unique contributing authors
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Citations</CardTitle>
              <Badge variant="secondary">{STATS.growthStats.citationsGrowth}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{STATS.totalCitations.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all papers
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Citations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{STATS.avgCitationsPerPaper}</div>
              <p className="text-xs text-muted-foreground">
                Per paper
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Papers by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Papers by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {STATS.papersByCategory.map((cat) => (
                <div key={cat.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{cat.category}</span>
                    <span className="text-sm text-muted-foreground">
                      {cat.count.toLocaleString()} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Generation Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Papers by Generation Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {STATS.papersByGenerationMethod.map((method) => (
                  <div key={method.method} className="flex items-center justify-between">
                    <span className="text-sm">{method.method}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {method.count.toLocaleString()}
                      </span>
                      <Badge variant="outline">{method.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Authors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Contributing Authors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {STATS.topAuthors.map((author, idx) => (
                  <div key={author.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">#{idx + 1}</span>
                      <span className="text-sm">{author.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {author.papers} papers
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Submissions (2024)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {STATS.monthlySubmissions.map((month) => {
                const maxPapers = Math.max(...STATS.monthlySubmissions.map(m => m.papers))
                const height = (month.papers / maxPapers) * 100
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-muted-foreground -rotate-45 origin-center">
                      {month.month.split(' ')[0]}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Cited Papers */}
        <Card>
          <CardHeader>
            <CardTitle>Most Cited Papers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {STATS.topCitedPapers.map((paper, idx) => (
                <div key={paper.title} className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <Badge variant="outline">#{idx + 1}</Badge>
                    <span className="text-sm">{paper.title}</span>
                  </div>
                  <span className="text-sm font-medium">{paper.citations} citations</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 