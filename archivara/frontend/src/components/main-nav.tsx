"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { siteConfig } from "../config/site"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <Icons.logo className="h-8 w-8 text-accent" />
        <span className="hidden font-bold sm:inline-block">
          {siteConfig.name}
        </span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link
          href="/browse"
          className={cn(
            "transition-colors hover:text-accent",
            pathname === "/browse" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Browse
        </Link>
        <Link
          href="/search"
          className={cn(
            "transition-colors hover:text-accent",
            pathname?.startsWith("/search")
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          Search
        </Link>
        <Link
          href="/collections"
          className={cn(
            "transition-colors hover:text-accent",
            pathname?.startsWith("/collections")
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          Collections
        </Link>
        <Link
          href={siteConfig.links.github}
          className={cn(
            "hidden text-muted-foreground transition-colors hover:text-accent lg:block"
          )}
        >
          GitHub
        </Link>
      </nav>
    </div>
  )
} 