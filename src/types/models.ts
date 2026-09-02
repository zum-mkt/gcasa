export type UserRole = 'admin' | 'editor' | 'associate'

export type ContentStatus = 'draft' | 'published' | 'archived'

export type FormType = 'contact' | 'associate' | 'supplier' | 'work'

export interface Profile {
  id: string
  role: UserRole
  /** Só preenchido quando role === 'associate' — qual loja este login representa. */
  associate_id: string | null
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
  /** Padrão 'image' — mantém compatibilidade com heróis já cadastrados sem esse campo */
  media_type?: 'image' | 'video'
  video_url?: string | null
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
  email: string | null
  phone: string | null
  address: string | null
  business_hours: string | null
  store_image_url: string | null
  gallery: string[]
  category_id: string | null
  category?: Category
  branches?: AssociateBranch[]
  active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface AssociateBranch {
  id: string
  associate_id: string
  name: string
  is_hq: boolean
  phone: string | null
  whatsapp: string | null
  address: string | null
  city: string | null
  state: string
  cep: string | null
  latitude: number | null
  longitude: number | null
  business_hours: string | null
  cover_image_url: string | null
  gallery: string[]
  active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export type TabloidEditionStatus = 'draft' | 'open' | 'closed' | 'published'
export type TabloidProductStatus = 'pending' | 'approved' | 'rejected'

export interface TabloidEdition {
  id: string
  name: string
  status: TabloidEditionStatus
  submission_deadline: string | null
  valid_from: string | null
  valid_until: string | null
  /** Banner do topo da página 1 — 21x8cm. */
  header_image_url: string | null
  generated_pdf_url: string | null
  /** Legado — letras miúdas soltas. O rodapé de verdade é `footer` (blocos, só no verso). */
  footer_text: string | null
  /** Rodapé estruturado da página 2 (logo, contato, selo, WhatsApp, letras miúdas). */
  footer?: {
    logo_url: string | null
    phone_label: string | null
    phone: string | null
    addresses: string[]
    website: string | null
    instagram: string | null
    facebook: string | null
    seal_url: string | null
    cta_phrase: string | null
    cta_whatsapp: string | null
    fine_print: string | null
  }
  /** Observações internas — só admin, não entra no material impresso. */
  notes: string | null
  /** Qual associado criou essa edição (null = criada pelo admin, ou anterior à coluna existir). */
  created_by_associate_id: string | null
  created_by_associate?: Associate
  /** Teto por página do layout impresso (padrão 20 → 40 no tabloide). Mínimo de envio é 24 no total. */
  max_products_per_page: number
  /** Cor de fundo da frente e do verso (hex). Boxes dos produtos ficam brancos por cima. */
  background_color: string
  /** Estilo dos preços no preview (cor, tamanho, posição, de/por, selo). */
  price_style: {
    color: string
    size: 'md' | 'lg' | 'xl'
    place: 'below' | 'on-photo'
    align: 'left' | 'center' | 'right'
    fromTo: boolean
    badge: boolean
  }
  created_at: string
  updated_at: string
}

export interface TabloidSubmission {
  id: string
  edition_id: string
  associate_id: string
  associate?: Associate
  submitted_at: string
  /** Admin arquivou depois de revisar — some da lista "precisa de ação" na curadoria, pode reabrir. */
  archived_at: string | null
  /** Associado pediu pra alterar depois do envio — só o admin libera. */
  unlock_requested_at: string | null
}

/** Notificação in-app (sino no TopBar do admin) — hoje só emitida pela trigger
 *  `notify_admins_tabloid_submission` quando um associado envia o tabloide
 *  pra produção, mas o formato é genérico pra dar pra reusar em outros avisos. */
export interface Notification {
  id: string
  recipient_id: string
  type: string
  title: string
  message: string | null
  /** Rota interna do admin pra abrir ao clicar (ex: '/admin/tabloides'). */
  link: string | null
  read_at: string | null
  created_at: string
}

export interface TabloidProduct {
  id: string
  edition_id: string
  associate_id: string
  associate?: Associate
  name: string
  description: string | null
  category: string | null
  sku: string | null
  /** Unidade de medida (kg, m², un, milheiro etc). */
  unit: string | null
  price: number | null
  promo_price: number | null
  /** Condição de pagamento em texto livre (ex.: "3x de R$ 160,00 sem juros", "à vista com 5% OFF"). */
  payment_condition: string | null
  image_url: string | null
  valid_from: string | null
  valid_until: string | null
  /** Legado — não tem mais aprovação por produto (removida em 020_tabloid_remove_approval_gate.sql).
   *  Coluna continua no banco (sempre 'pending' na prática) mas a UI não lê/escreve mais isso;
   *  "pronto pra exportar" agora é "a loja já enviou o tabloide" (tabloid_submissions). */
  status: TabloidProductStatus
  rejection_reason: string | null
  order_index: number
  /** Em qual página do tabloide entra — null = ainda não definido (cai na página 1 na hora de montar). */
  page: 1 | 2 | null
  /** Produto em destaque — ganha um box maior na grade do corpo do tabloide. */
  is_featured: boolean
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
  contact_email: string | null
  contact_phone: string | null
  category_id: string | null
  category?: Category
  image_url: string | null
  gallery: string[]
  featured: boolean
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
  name: string
  slug: string | null
  logo_url: string | null
  cover_url: string | null
  site_url: string | null
  description: string | null
  phone: string | null
  whatsapp: string | null
  instagram: string | null
  facebook: string | null
  city: string | null
  state: string | null
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
