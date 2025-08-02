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
        <Icons.logo className="h-8 w-8 text-primary-600" />
        <span className="hidden font-bold sm:inline-block">
          {siteConfig.name}
        </span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link
          href="/browse"
          className={cn(
            "transition-colors hover:text-primary-600",
            pathname === "/browse" ? "text-surface-900" : "text-surface-600"
          )}
        >
          Browse
        </Link>
        <Link
          href="/search"
          className={cn(
            "transition-colors hover:text-primary-600",
            pathname?.startsWith("/search")
              ? "text-surface-900"
              : "text-surface-600"
          )}
        >
          Search
        </Link>
        <Link
          href="/collections"
          className={cn(
            "transition-colors hover:text-primary-600",
            pathname?.startsWith("/collections")
              ? "text-surface-900"
              : "text-surface-600"
          )}
        >
          Collections
        </Link>
        <Link
          href={siteConfig.links.github}
          className={cn(
            "hidden text-surface-600 transition-colors hover:text-primary-600 lg:block"
          )}
        >
          GitHub
        </Link>
      </nav>
    </div>
  )
} 