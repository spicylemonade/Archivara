import { Icons } from "@/components/icons"
import { siteConfig } from "../config/site"

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="container py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="flex flex-col gap-4">
            <h4 className="font-medium">About</h4>
            <a href="/about" className="text-sm text-muted-foreground hover:text-accent">Mission</a>
            <a href="/team" className="text-sm text-muted-foreground hover:text-accent">Team</a>
            <a href="/contact" className="text-sm text-muted-foreground hover:text-accent">Contact</a>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-medium">Resources</h4>
            <a href="/docs" className="text-sm text-muted-foreground hover:text-accent">Docs</a>
            <a href="/tutorials" className="text-sm text-muted-foreground hover:text-accent">Tutorials</a>
            <a href="/faq" className="text-sm text-muted-foreground hover:text-accent">FAQ</a>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-medium">Legal</h4>
            <a href="/terms" className="text-sm text-muted-foreground hover:text-accent">Terms</a>
            <a href="/privacy" className="text-sm text-muted-foreground hover:text-accent">Privacy</a>
            <a href="/license" className="text-sm text-muted-foreground hover:text-accent">License</a>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-medium">Connect</h4>
            <a href={siteConfig.links.github} className="text-sm text-muted-foreground hover:text-accent">GitHub</a>
            <a href={siteConfig.links.twitter} className="text-sm text-muted-foreground hover:text-accent">Twitter</a>
            <a href={siteConfig.links.discord} className="text-sm text-muted-foreground hover:text-accent">Discord</a>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href={siteConfig.links.github} target="_blank" rel="noreferrer">
              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-secondary hover:bg-accent/10 transition-colors">
                <Icons.gitBranch className="h-4 w-4" />
              </div>
            </a>
            <a href={siteConfig.links.twitter} target="_blank" rel="noreferrer">
              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-secondary hover:bg-accent/10 transition-colors">
                <Icons.bot className="h-4 w-4" />
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
} 