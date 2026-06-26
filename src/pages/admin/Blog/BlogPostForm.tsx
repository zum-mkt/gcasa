import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { slugify, readTime } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { toast } from '@/components/ui/Toast'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'
import type { BlogPost, Category } from '@/types/models'

const schema = z.object({
  title: z.string().min(3, 'Título obrigatório'),
  slug: z.string().min(2, 'Slug obrigatório'),
  excerpt: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  category_id: z.string().optional(),
  tags: z.string().optional(),
  cover_url: z.string().nullable().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface BlogPostFormProps {
  open: boolean
  onClose: () => void
  post: BlogPost | null
}

export function BlogPostForm({ open, onClose, post }: BlogPostFormProps) {
  const qc = useQueryClient()
  const isEdit = !!post
  const [content, setContent] = useState<{ json: Record<string, unknown>; html: string }>({ json: {}, html: '' })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-blog'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').eq('type', 'blog')
      return (data ?? []) as Category[]
    },
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'draft' },
  })

  const titleValue = watch('title')

  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? '',
        status: post.status as FormData['status'],
        category_id: post.category_id ?? '',
        tags: (post.tags ?? []).join(', '),
        cover_url: post.cover_url,
        meta_title: (post.seo as Record<string, string>)?.meta_title ?? '',
        meta_description: (post.seo as Record<string, string>)?.meta_description ?? '',
      })
      setContent({ json: post.content, html: '' })
    } else {
      reset({ status: 'draft' })
      setContent({ json: {}, html: '' })
    }
  }, [post, reset])

  useEffect(() => {
    if (!isEdit && titleValue) setValue('slug', slugify(titleValue))
  }, [titleValue, isEdit, setValue])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const tags = data.tags?.split(',').map(t => t.trim()).filter(Boolean) ?? []
      const seo = { meta_title: data.meta_title, meta_description: data.meta_description }
      const rt = readTime(content.html)
      const payload = {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: content.json,
        cover_url: data.cover_url || null,
        status: data.status,
        category_id: data.category_id || null,
        tags,
        seo,
        read_time: rt,
        published_at: data.status === 'published' ? new Date().toISOString() : null,
      }
      if (isEdit) {
        const { error } = await supabase.from('blog_posts').update(payload).eq('id', post.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('blog_posts').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog'] })
      qc.invalidateQueries({ queryKey: ['blog-home'] })
      toast.success(isEdit ? 'Artigo atualizado!' : 'Artigo criado!')
      onClose()
    },
    onError: (e: Error) => toast.error('Erro ao salvar', e.message),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar artigo' : 'Novo artigo'}
      size="2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="secondary" loading={mutation.isPending}
            onClick={handleSubmit((d) => { setValue('status', 'draft'); mutation.mutate({ ...d, status: 'draft' }) })}>
            Salvar rascunho
          </Button>
          <Button loading={mutation.isPending}
            onClick={handleSubmit((d) => mutation.mutate({ ...d, status: 'published' }))}>
            Publicar
          </Button>
        </>
      }
    >
      <TabsPrimitive.Root defaultValue="content">
        <TabsPrimitive.List className="flex border-b border-gray-200 mb-5 -mx-6 px-6 gap-1">
          {[
            { value: 'content', label: 'Conteúdo' },
            { value: 'meta', label: 'Configurações' },
            { value: 'seo', label: 'SEO' },
          ].map(tab => (
            <TabsPrimitive.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                'data-[state=active]:border-primary-600 data-[state=active]:text-primary-600',
                'data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>

        <TabsPrimitive.Content value="content" className="space-y-5">
          <Input label="Título *" error={errors.title?.message} {...register('title')} placeholder="Título do artigo" />
          <Input label="Slug *" error={errors.slug?.message} {...register('slug')} placeholder="titulo-do-artigo" />
          <Textarea label="Resumo" rows={2} {...register('excerpt')} placeholder="Breve descrição do artigo..." />
          <ImageUpload label="Imagem de capa" value={watch('cover_url')} onChange={(url) => setValue('cover_url', url)} folder="blog/covers" />
          <RichTextEditor
            label="Conteúdo"
            value={isEdit ? post?.content : undefined}
            onChange={(json, html) => setContent({ json, html })}
            placeholder="Escreva o conteúdo do artigo aqui..."
          />
        </TabsPrimitive.Content>

        <TabsPrimitive.Content value="meta" className="space-y-5">
          <Select
            label="Categoria"
            placeholder="Selecionar..."
            options={categories.map(c => ({ value: c.id, label: c.name }))}
            {...register('category_id')}
          />
          <Input label="Tags (separadas por vírgula)" {...register('tags')} placeholder="mercado, construção, gestão" />
          <Select
            label="Status"
            options={[
              { value: 'draft', label: 'Rascunho' },
              { value: 'published', label: 'Publicado' },
              { value: 'archived', label: 'Arquivado' },
            ]}
            {...register('status')}
          />
        </TabsPrimitive.Content>

        <TabsPrimitive.Content value="seo" className="space-y-5">
          <Input label="Meta Title" {...register('meta_title')} placeholder="Título para SEO (máx. 60 caracteres)" />
          <Textarea label="Meta Description" rows={3} {...register('meta_description')} placeholder="Descrição para SEO (máx. 160 caracteres)" />
          <p className="text-xs text-gray-400">Se não preenchido, serão usados o título e resumo do artigo.</p>
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>
    </Modal>
  )
}
