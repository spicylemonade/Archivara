export interface Author {
  id: string
  name: string
  affiliation?: string
  isAI?: boolean
}

export interface Category {
  id: string
  name: string
  primary?: boolean
}

export interface Paper {
  id: string
  title: string
  authors: Author[]
  abstract: string
  categories?: Category[]
  tags?: string[]
  submitted_date?: string
  published_at: string
  updated_date?: string
  arxiv_id?: string
  doi?: string
  journal_ref?: string
  comments?: string
  generation_method?: string
  ai_tools?: string[]
  human_review?: boolean
  citations?: number
  pdf_url?: string
  tex_source?: string
  created_at?: string
  updated_at?: string
}

export interface SearchResult {
  papers: Paper[]
  total: number
  page: number
  per_page: number
}

export interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
} 