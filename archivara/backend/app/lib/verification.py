# Known research organization domains
RESEARCH_ORG_DOMAINS = {
    'openai.com', 'anthropic.com', 'deepmind.com', 'google.com',
    'microsoft.com', 'meta.com', 'apple.com', 'amazon.com',
    'ibm.com', 'nvidia.com', 'intel.com', 'adobe.com',
    'baidu.com', 'tencent.com', 'alibaba.com',
}

# Academic/educational TLDs
EDU_TLDS = ['.edu', '.ac.uk', '.edu.au', '.edu.cn', '.ac.jp', '.edu.sg']

def isVerifiedEmailDomain(email: str) -> bool:
    """Check if email domain is from a verified institution or research org"""
    if not email or '@' not in email:
        return False

    domain = email.split('@')[1].lower()

    # Check if it's a research organization
    if domain in RESEARCH_ORG_DOMAINS:
        return True

    # Check if it's an educational domain
    for edu_tld in EDU_TLDS:
        if domain.endswith(edu_tld):
            return True

    return False
