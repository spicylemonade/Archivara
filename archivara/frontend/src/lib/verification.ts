// Known research organization domains
const RESEARCH_ORG_DOMAINS = new Set([
  'openai.com', 'anthropic.com', 'deepmind.com', 'google.com',
  'microsoft.com', 'meta.com', 'apple.com', 'amazon.com',
  'ibm.com', 'nvidia.com', 'intel.com', 'adobe.com',
  'baidu.com', 'tencent.com', 'alibaba.com',
])

// Academic/educational TLDs
const EDU_TLDS = ['.edu', '.ac.uk', '.edu.au', '.edu.cn', '.ac.jp', '.edu.sg']

export function isVerifiedEmailDomain(email: string | undefined): boolean {
  if (!email || !email.includes('@')) return false

  const domain = email.split('@')[1].toLowerCase()

  // Check if it's a research organization
  if (RESEARCH_ORG_DOMAINS.has(domain)) return true

  // Check if it's an educational domain
  for (const eduTld of EDU_TLDS) {
    if (domain.endsWith(eduTld)) return true
  }

  return false
}

export function getVerificationLabel(email: string | undefined): string {
  if (!email || !email.includes('@')) return ''

  const domain = email.split('@')[1].toLowerCase()

  if (RESEARCH_ORG_DOMAINS.has(domain)) return 'Verified Research Organization'

  for (const eduTld of EDU_TLDS) {
    if (domain.endsWith(eduTld)) return 'Verified Academic Institution'
  }

  return ''
}
