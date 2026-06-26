export type UserRole = 'admin' | 'editor'

export type ContentStatus = 'draft' | 'published' | 'archived'

export type FormType = 'contact' | 'associate' | 'supplier' | 'work'

export interface Profile {
  id: string
  role: UserRole
  name: string | null
  avatar_url: string | null
  last_sign_in_at: string | null
  created_at: string
  updated_at: string
}

export interface Setting {
  key: string
  value: Record<string, unknown>
  updated_by: string | null
  updated_at: string
}

export interface SiteSettings {
  logo_url?: string
  logo_white_url?: string
  favicon_url?: string
  company_name?: string
  tagline?: string
  phone?: string
  phone_secondary?: string
  email?: string
  email_secondary?: string
  address?: string
  address_city?: string
  address_state?: string
  address_cep?: string
  instagram?: string
  facebook?: string
  linkedin?: string
  youtube?: string
  whatsapp?: string
  footer_text?: string
  google_analytics_id?: string
  meta_pixel_id?: string
  gtm_id?: string
}

export interface HomeSection {
  id: string
  section: 'hero' | 'stats' | 'about' | 'benefits' | 'cta'
  content: Record<string, unknown>
  updated_by: string | null
  updated_at: string
}

export interface HeroContent {
  tag?: string
  title?: string
  title_highlight?: string
  subtitle?: string
  description?: string
  cta_primary_label?: string
  cta_primary_href?: string
  cta_secondary_label?: string
  cta_secondary_href?: string
  image_url?: string
}

export interface StatItem {
  value: string
  label: string
  suffix?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  type: 'blog' | 'event' | 'associate' | 'supplier'
  created_at: string
}

export interface Associate {
  id: string
  name: string
  slug: string
  logo_url: string | null
  city: string | null
  state: string
  description: string | null
  site_url: string | null
  instagram: string | null
  facebook: string | null
  whatsapp: string | null
  store_image_url: string | null
  gallery: string[]
  category_id: string | null
  category?: Category
  active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string | null
  site_url: string | null
  category_id: string | null
  category?: Category
  image_url: string | null
  gallery: string[]
  active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface GcasaEvent {
  id: string
  title: string
  slug: string
  date: string
  location: string | null
  description: string | null
  content: Record<string, unknown>
  image_url: string | null
  gallery: string[]
  videos: string[]
  files: Array<{ name: string; url: string }>
  status: ContentStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: Record<string, unknown>
  cover_url: string | null
  seo: SeoMeta
  category_id: string | null
  category?: Category
  tags: string[]
  author_id: string | null
  author?: Profile
  published_at: string | null
  status: ContentStatus
  read_time: number | null
  created_at: string
  updated_at: string
}

export interface Testimonial {
  id: string
  avatar_url: string | null
  author_name: string
  author_role: string | null
  company: string | null
  text: string
  order_index: number
  active: boolean
  created_at?: string
}

export interface Partner {
  id: string
  logo_url: string
  site_url: string | null
  name: string | null
  category: string | null
  order_index: number
  active: boolean
  created_at: string
}

export interface Gallery {
  id: string
  name: string
  slug: string
  created_by: string | null
  created_at: string
  items?: GalleryItem[]
}

export interface GalleryItem {
  id: string
  gallery_id: string
  file_url: string
  file_type: string
  alt: string | null
  order_index: number
  created_at: string
}

export interface MediaFile {
  id: string
  url: string
  name: string
  size: number | null
  type: string | null
  bucket: string
  uploaded_by: string | null
  created_at: string
}

export interface FormSubmission {
  id: string
  form_type: FormType
  data: Record<string, unknown>
  email_sent: boolean
  read: boolean
  created_at: string
}

export interface SeoMeta {
  meta_title?: string
  meta_description?: string
  og_image?: string
  canonical?: string
  noindex?: boolean
  schema?: Record<string, unknown>
}

export interface ActivityLog {
  id: string
  user_id: string | null
  user?: Profile
  action: string
  entity: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface DashboardStats {
  associates: number
  suppliers: number
  blog_posts: number
  events: number
  form_submissions: number
  unread_submissions: number
}
