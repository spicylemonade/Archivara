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
        <header className="rounded-2xl border border-border bg-background/80 dark:bg-card/80 backdrop-blur-lg shadow-soft">
          <div className="flex h-16 items-center px-6">
            <MainNav />
            <div className="flex flex-1 items-center justify-end space-x-4">
              <nav className="flex items-center space-x-2">
                {isAuthenticated ? (
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/account">My Account</Link>
                    </Button>
                    <Button variant="premium" size="sm" asChild>
                      <Link href="/submit">Submit Paper</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                      <Icons.logOut className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button variant="premium" size="sm" asChild>
                      <Link href="/submit">Submit Paper</Link>
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