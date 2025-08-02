import { Icons } from "@/components/icons"
import { siteConfig } from "../config/site"

export function SiteFooter() {
  return (
    <footer className="border-t border-surface-200">
      <div className="container py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="flex flex-col gap-4">
            <h4 className="font-medium">About</h4>
            <a href="/about" className="text-sm text-surface-600 hover:text-primary-600">Mission</a>
            <a href="/team" className="text-sm text-surface-600 hover:text-primary-600">Team</a>
            <a href="/contact" className="text-sm text-surface-600 hover:text-primary-600">Contact</a>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-medium">Resources</h4>
            <a href="/docs" className="text-sm text-surface-600 hover:text-primary-600">Docs</a>
            <a href="/tutorials" className="text-sm text-surface-600 hover:text-primary-600">Tutorials</a>
            <a href="/faq" className="text-sm text-surface-600 hover:text-primary-600">FAQ</a>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-medium">Legal</h4>
            <a href="/terms" className="text-sm text-surface-600 hover:text-primary-600">Terms</a>
            <a href="/privacy" className="text-sm text-surface-600 hover:text-primary-600">Privacy</a>
            <a href="/license" className="text-sm text-surface-600 hover:text-primary-600">License</a>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-medium">Connect</h4>
            <a href={siteConfig.links.github} className="text-sm text-surface-600 hover:text-primary-600">GitHub</a>
            <a href={siteConfig.links.twitter} className="text-sm text-surface-600 hover:text-primary-600">Twitter</a>
            <a href={siteConfig.links.discord} className="text-sm text-surface-600 hover:text-primary-600">Discord</a>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-surface-600">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href={siteConfig.links.github} target="_blank" rel="noreferrer">
              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-surface-100 hover:bg-surface-200">
                <Icons.gitBranch className="h-4 w-4" />
              </div>
            </a>
            <a href={siteConfig.links.twitter} target="_blank" rel="noreferrer">
              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-surface-100 hover:bg-surface-200">
                <Icons.bot className="h-4 w-4" />
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
} 