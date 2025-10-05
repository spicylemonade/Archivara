import Script from "next/script"

const ANALYTICS_DOMAIN = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN || "archivara.org"
const ANALYTICS_SRC = process.env.NEXT_PUBLIC_ANALYTICS_SRC || "https://plausible.io/js/script.js"

export function Analytics() {
  if (!ANALYTICS_DOMAIN || !ANALYTICS_SRC) {
    return null
  }

  return (
    <Script
      src={ANALYTICS_SRC}
      data-domain={ANALYTICS_DOMAIN}
      strategy="lazyOnload"
    />
  )
}

