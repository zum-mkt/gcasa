export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'editor'
          name: string | null
          avatar_url: string | null
          last_sign_in_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'admin' | 'editor'
          name?: string | null
          avatar_url?: string | null
          last_sign_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          role?: 'admin' | 'editor'
          name?: string | null
          avatar_url?: string | null
          last_sign_in_at?: string | null
          updated_at?: string
        }
      }
      settings: {
        Row: {
          key: string
          value: Json
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          value?: Json
          updated_by?: string | null
          updated_at?: string
        }
      }
      home_content: {
        Row: {
          id: string
          section: string
          content: Json
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          section: string
          content: Json
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json
          updated_by?: string | null
          updated_at?: string
        }
      }
      pages: {
        Row: {
          id: string
          slug: string
          title: string
          content: Json | null
          seo: Json | null
          published: boolean
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          content?: Json | null
          seo?: Json | null
          published?: boolean
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          title?: string
          content?: Json | null
          seo?: Json | null
          published?: boolean
          updated_by?: string | null
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          type: 'blog' | 'event' | 'associate' | 'supplier'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type: 'blog' | 'event' | 'associate' | 'supplier'
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          type?: 'blog' | 'event' | 'associate' | 'supplier'
        }
      }
      associates: {
        Row: {
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
          gallery: Json
          category_id: string | null
          active: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          city?: string | null
          state?: string
          description?: string | null
          site_url?: string | null
          instagram?: string | null
          facebook?: string | null
          whatsapp?: string | null
          store_image_url?: string | null
          gallery?: Json
          category_id?: string | null
          active?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          logo_url?: string | null
          city?: string | null
          state?: string
          description?: string | null
          site_url?: string | null
          instagram?: string | null
          facebook?: string | null
          whatsapp?: string | null
          store_image_url?: string | null
          gallery?: Json
          category_id?: string | null
          active?: boolean
          order_index?: number
          updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          description: string | null
          site_url: string | null
          category_id: string | null
          image_url: string | null
          gallery: Json
          active: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          description?: string | null
          site_url?: string | null
          category_id?: string | null
          image_url?: string | null
          gallery?: Json
          active?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          logo_url?: string | null
          description?: string | null
          site_url?: string | null
          category_id?: string | null
          image_url?: string | null
          gallery?: Json
          active?: boolean
          order_index?: number
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          slug: string
          date: string
          location: string | null
          description: string | null
          content: Json
          image_url: string | null
          gallery: Json
          videos: Json
          files: Json
          status: 'draft' | 'published' | 'archived'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          date: string
          location?: string | null
          description?: string | null
          content?: Json
          image_url?: string | null
          gallery?: Json
          videos?: Json
          files?: Json
          status?: 'draft' | 'published' | 'archived'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          slug?: string
          date?: string
          location?: string | null
          description?: string | null
          content?: Json
          image_url?: string | null
          gallery?: Json
          videos?: Json
          files?: Json
          status?: 'draft' | 'published' | 'archived'
          updated_at?: string
        }
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: Json
          cover_url: string | null
          seo: Json
          category_id: string | null
          tags: string[]
          author_id: string | null
          published_at: string | null
          status: 'draft' | 'published' | 'archived'
          read_time: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content?: Json
          cover_url?: string | null
          seo?: Json
          category_id?: string | null
          tags?: string[]
          author_id?: string | null
          published_at?: string | null
          status?: 'draft' | 'published' | 'archived'
          read_time?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          slug?: string
          excerpt?: string | null
          content?: Json
          cover_url?: string | null
          seo?: Json
          category_id?: string | null
          tags?: string[]
          author_id?: string | null
          published_at?: string | null
          status?: 'draft' | 'published' | 'archived'
          read_time?: number | null
          updated_at?: string
        }
      }
      testimonials: {
        Row: {
          id: string
          photo_url: string | null
          name: string
          company: string | null
          role: string | null
          text: string
          order_index: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          photo_url?: string | null
          name: string
          company?: string | null
          role?: string | null
          text: string
          order_index?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          photo_url?: string | null
          name?: string
          company?: string | null
          role?: string | null
          text?: string
          order_index?: number
          active?: boolean
        }
      }
      partners: {
        Row: {
          id: string
          logo_url: string
          site_url: string | null
          name: string | null
          category: string | null
          order_index: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          logo_url: string
          site_url?: string | null
          name?: string | null
          category?: string | null
          order_index?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          logo_url?: string
          site_url?: string | null
          name?: string | null
          category?: string | null
          order_index?: number
          active?: boolean
        }
      }
      galleries: {
        Row: {
          id: string
          name: string
          slug: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
        }
      }
      gallery_items: {
        Row: {
          id: string
          gallery_id: string
          file_url: string
          file_type: string
          alt: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          gallery_id: string
          file_url: string
          file_type?: string
          alt?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          file_url?: string
          file_type?: string
          alt?: string | null
          order_index?: number
        }
      }
      media_files: {
        Row: {
          id: string
          url: string
          name: string
          size: number | null
          type: string | null
          bucket: string
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          url: string
          name: string
          size?: number | null
          type?: string | null
          bucket?: string
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          url?: string
          name?: string
        }
      }
      form_submissions: {
        Row: {
          id: string
          form_type: 'contact' | 'associate' | 'supplier' | 'work'
          data: Json
          email_sent: boolean
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          form_type: 'contact' | 'associate' | 'supplier' | 'work'
          data: Json
          email_sent?: boolean
          read?: boolean
          created_at?: string
        }
        Update: {
          email_sent?: boolean
          read?: boolean
        }
      }
      seo_settings: {
        Row: {
          page: string
          meta_title: string | null
          meta_description: string | null
          og_image: string | null
          canonical: string | null
          noindex: boolean
          schema: Json
          updated_at: string
        }
        Insert: {
          page: string
          meta_title?: string | null
          meta_description?: string | null
          og_image?: string | null
          canonical?: string | null
          noindex?: boolean
          schema?: Json
          updated_at?: string
        }
        Update: {
          meta_title?: string | null
          meta_description?: string | null
          og_image?: string | null
          canonical?: string | null
          noindex?: boolean
          schema?: Json
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity: string | null
          entity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity?: string | null
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: Record<string, never>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
