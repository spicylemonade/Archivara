"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Icons } from "@/components/icons"
import { MainNav } from "./main-nav"
import { Button } from "./ui/button"
import { ThemeToggle } from "./theme-toggle"
import { useAuth } from "@/lib/auth-context"

export function SiteHeader() {
  const router = useRouter()
  const { isAuthenticated, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pt-4 pb-2 bg-transparent">
      <div className="container">
        <header className="rounded-full border border-border bg-background/95 backdrop-blur-md shadow-sm">
          <div className="flex h-14 items-center px-6">
            <MainNav />
            <div className="flex flex-1 items-center justify-end space-x-1 sm:space-x-2">
              <nav className="flex items-center space-x-1 sm:space-x-2">
                {isAuthenticated ? (
                  <>
                    <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
                      <Link href="/account">My Account</Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="sm:hidden" asChild>
                      <Link href="/account">
                        <Icons.user className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="premium" size="sm" className="text-xs sm:text-sm px-2 sm:px-4" asChild>
                      <Link href="/submit"><span className="hidden xs:inline">Submit </span>Paper</Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
                      <Icons.logOut className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="sm:hidden" asChild>
                      <Link href="/login">
                        <Icons.user className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="premium" size="sm" className="text-xs sm:text-sm px-2 sm:px-4" asChild>
                      <Link href="/submit"><span className="hidden xs:inline">Submit </span>Paper</Link>
                    </Button>
                  </>
                )}
                <ThemeToggle />
              </nav>
            </div>
          </div>
        </header>
      </div>
    </div>
  )
} 