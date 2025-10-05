"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { siteConfig } from "../config/site"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function MainNav() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  return (
    <>
      {/* Mobile Logo + Menu */}
      <div className="flex md:hidden items-center">
        <Link href="/" className="mr-4 flex items-center space-x-2">
          <Icons.logo className="h-8 w-8 text-accent" />
          <span className="font-bold">
            {siteConfig.name}
          </span>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Icons.menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <Link
              href="/"
              className="flex items-center space-x-2 mb-6"
              onClick={() => setOpen(false)}
            >
              <Icons.logo className="h-8 w-8 text-accent" />
              <span className="font-bold text-lg">
                {siteConfig.name}
              </span>
            </Link>
            <nav className="flex flex-col space-y-4">
              <Link
                href="/browse"
                className={cn(
                  "text-lg transition-colors hover:text-accent",
                  pathname === "/browse" ? "text-foreground font-semibold" : "text-muted-foreground"
                )}
                onClick={() => setOpen(false)}
              >
                Browse
              </Link>
              <Link
                href="/search"
                className={cn(
                  "text-lg transition-colors hover:text-accent",
                  pathname?.startsWith("/search")
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                )}
                onClick={() => setOpen(false)}
              >
                Search
              </Link>
              <Link
                href="/collections"
                className={cn(
                  "text-lg transition-colors hover:text-accent",
                  pathname?.startsWith("/collections")
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                )}
                onClick={() => setOpen(false)}
              >
                Collections
              </Link>
              <Link
                href={siteConfig.links.github}
                className="text-lg text-muted-foreground transition-colors hover:text-accent"
                onClick={() => setOpen(false)}
              >
                GitHub
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Nav */}
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
    </>
  )
} 