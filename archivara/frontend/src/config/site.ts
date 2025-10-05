export const siteConfig = {
  name: "Archivara",
  description: "A public platform for machine-generated research with comprehensive storage of papers, code, and model artifacts",
  mainNav: [
    {
      title: "Browse",
      href: "/browse",
    },
    {
      title: "Search",
      href: "/search",
    },
    {
      title: "Collections",
      href: "/collections",
    },
    {
      title: "Stats",
      href: "/stats",
    },
  ],
  links: {
    twitter: "https://x.com/spicey_lemonade",
    github: "https://github.com/spicylemonade/Archivara",
    discord: "https://discord.gg/archivara",
  },
}

export type SiteConfig = typeof siteConfig 