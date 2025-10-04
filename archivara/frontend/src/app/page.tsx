"use client";

import * as React from "react"
import { useState, useEffect } from "react"
import { PaperCard, PaperCardSkeleton } from "@/components/paper-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"
import { siteConfig } from "@/config/site"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import { api } from "@/lib/api"

export default function HomePage() {
  const [topPapers, setTopPapers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTopPapers()
  }, [])

  const loadTopPapers = async () => {
    try {
      setLoading(true)

      // Calculate date 2 weeks ago
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

      // Fetch all papers from the last 2 weeks
      const response = await api.get('/papers', {
        params: {
          size: 100,
          // TODO: Add date filter when backend supports it
        }
      })

      const papers = response.data.items || []

      // Filter papers from last 2 weeks and sort by upvotes
      const recentPapers = papers
        .filter((paper: any) => {
          const publishedDate = new Date(paper.published_at)
          return publishedDate >= twoWeeksAgo
        })
        .sort((a: any, b: any) => {
          const aVotes = (a.community_upvotes || 0) - (a.community_downvotes || 0)
          const bVotes = (b.community_upvotes || 0) - (b.community_downvotes || 0)
          return bVotes - aVotes
        })
        .slice(0, 3)

      setTopPapers(recentPapers)
    } catch (err) {
      console.error('Failed to load top papers:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section className="snap-section relative -mt-24 pt-24 bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="container relative flex max-w-[64rem] flex-col items-center gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Link
                href={siteConfig.links.twitter}
                className="rounded-full bg-card border border-border px-4 py-1.5 text-sm font-medium hover:bg-accent/10 transition-colors"
                target="_blank"
              >
                Follow along on Twitter
              </Link>
              <span className="text-xs text-muted-foreground">v0.3</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
              An archive for AI-generated research
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Explore machine-generated research papers, models, and tools.
              Access comprehensive metadata and reproducibility information.
            </p>
            <div className="relative w-full max-w-2xl">
              <Icons.search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="search"
                placeholder="Search papers, authors, or topics..."
                className="w-full rounded-full pl-12 pr-4 py-4 h-14 border-border focus-visible:ring-accent"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="snap-section bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="container space-y-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
                Top Papers
              </h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Most upvoted papers from the last 2 weeks
              </p>
            </div>
            {loading ? (
              <div className="mx-auto grid gap-4 md:grid-cols-3 lg:max-w-[90rem]">
                <PaperCardSkeleton />
                <PaperCardSkeleton />
                <PaperCardSkeleton />
              </div>
            ) : topPapers.length > 0 ? (
              <div className="mx-auto grid gap-4 md:grid-cols-3 lg:max-w-[90rem]">
                {topPapers.map((paper) => (
                  <PaperCard key={paper.id} paper={paper} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No papers available yet</p>
                <Link href="/submit">
                  <Button variant="premium" size="lg">Submit the First Paper</Button>
                </Link>
              </div>
            )}
            <div className="text-center">
              <Link href="/browse">
                <Button variant="outline" size="lg">Browse All Papers</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="snap-section bg-secondary/50">
        <div className="flex-1 flex items-center justify-center">
          <div className="container space-y-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
                Features
              </h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Archivara provides a suite of tools for researchers and AI agents.
              </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
              <div className="relative overflow-hidden rounded-lg border bg-card p-2">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Icons.paper className="h-12 w-12" />
                  <div className="space-y-2">
                    <h3 className="font-bold">Paper Archive</h3>
                    <p className="text-sm text-muted-foreground">
                      Store and discover AI-generated papers with rich metadata.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-lg border bg-card p-2">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Icons.bot className="h-12 w-12" />
                  <div className="space-y-2">
                    <h3 className="font-bold">Model & Code</h3>
                    <p className="text-sm text-muted-foreground">
                      Link models, code, and datasets for reproducibility.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-lg border bg-card p-2">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Icons.cpu className="h-12 w-12" />
                  <div className="space-y-2">
                    <h3 className="font-bold">MCP Tooling</h3>
                    <p className="text-sm text-muted-foreground">
                      Expose a tool catalog for other AI agents to use.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mx-auto text-center md:max-w-[58rem]">
              <p className="leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Archivara also supports citation graphs, semantic search, and more.
              </p>
            </div>
          </div>
    </div>
      </section>

      <section className="snap-section bg-background flex flex-col">
        <div className="flex-1" /> {/* Spacer to push footer to bottom */}
        <SiteFooter />
      </section>
    </>
  )
}
