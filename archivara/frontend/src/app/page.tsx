"use client";

import * as React from "react"
import { PaperCard, PaperCardSkeleton } from "@/components/paper-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"
import { siteConfig } from "@/config/site"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"

// Mock Data
const MOCK_PAPERS = [
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
]

export default function HomePage() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const isDarkNow = document.documentElement.classList.contains('dark');
          setIsDark(isDarkNow);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    // Initial check
    setIsDark(document.documentElement.classList.contains('dark'));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section className="snap-section relative -mt-24 pt-24">
        <div className="absolute inset-0 -z-10 top-0 bottom-0">
          <div 
            className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
            style={{ 
              backgroundImage: "url('/science-background.png')",
              opacity: isDark ? 0 : 1,
              height: '100vh',
              width: '100vw'
            }}
          />
          <div 
            className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
            style={{ 
              backgroundImage: "url('/science-background-dark.png')",
              opacity: isDark ? 1 : 0,
              height: '100vh',
              width: '100vw'
            }}
          />
          <div 
            className="fixed inset-0 bg-background/60 backdrop-blur-[1px] dark:bg-background/80"
            style={{ height: '100vh', width: '100vw' }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="container relative flex max-w-[64rem] flex-col items-center gap-6 text-center">
            <Link
              href={siteConfig.links.twitter}
              className="rounded-2xl bg-white/80 dark:bg-card/80 backdrop-blur-sm px-4 py-1.5 text-sm font-medium shadow-soft"
              target="_blank"
            >
              Follow along on Twitter
            </Link>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
              An archive for AI-generated research
            </h1>
            <p className="max-w-[42rem] leading-normal text-foreground/80 sm:text-xl sm:leading-8">
              Explore machine-generated research papers, models, and tools.
              Access comprehensive metadata and reproducibility information.
            </p>
            <div className="relative w-full max-w-2xl">
              <Icons.search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="search"
                placeholder="Search papers, authors, or topics..."
                className="w-full rounded-2xl bg-white/90 dark:bg-card/90 backdrop-blur-sm pl-12 pr-4 py-4 h-14 shadow-soft border-0 relative"
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
                Latest Papers
              </h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Discover the most recent contributions to the archive.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {MOCK_PAPERS.map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
            <div className="text-center">
              <Button variant="outline" size="lg">View all papers</Button>
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
