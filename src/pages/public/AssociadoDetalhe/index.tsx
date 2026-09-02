import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin, BadgeCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'
import { AssociadoContato } from '@/components/public/associado/AssociadoContato'
import { AssociadoGaleria } from '@/components/public/associado/AssociadoGaleria'
import { AssociadoLocalizacao } from '@/components/public/associado/AssociadoLocalizacao'
import { AssociadoFiliais } from '@/components/public/associado/AssociadoFiliais'
import type { Associate, AssociateBranch } from '@/types/models'

async function fetchAssociate(slug: string): Promise<Associate | null> {
  const { data, error } = await supabase
    .from('associates')
    .select('*, category:categories(name, slug)')
    .eq('slug', slug)
    .eq('active', true)
    .single()
  if (error) return null

  // Consulta separada: se a migration da tabela associate_branches ainda não rodou,
  // isso não pode derrubar a página inteira do associado (mesmo padrão de risco já
  // visto neste projeto — código na frente da migration).
  const { data: branches } = await supabase
    .from('associate_branches')
    .select('*')
    .eq('associate_id', data.id)
    .eq('active', true)
    .order('order_index')

  return { ...data, branches: (branches ?? []) as AssociateBranch[] } as Associate
}

async function fetchCta() {
  const { data } = await supabase.from('home_content').select('content').eq('section', 'cta').single()
  return data?.content as { title?: string; description?: string } | undefined
}

export default function AssociadoDetalhePage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: associate, isLoading } = useQuery({
    queryKey: ['associado-detalhe', slug],
    queryFn: () => fetchAssociate(slug!),
    enabled: !!slug,
  })
  const { data: cta } = useQuery({ queryKey: ['associado-cta'], queryFn: fetchCta })

  if (isLoading) return (
    <div className="pt-16 min-h-screen">
      <div className="aspect-[21/9] bg-graphite-100 animate-pulse" />
      <div className="container-site max-w-3xl py-12 animate-pulse space-y-4">
        <div className="h-10 bg-graphite-100 w-1/2" />
        <div className="h-4 bg-graphite-100 w-full" />
      </div>
    </div>
  )

  if (!associate) return (
    <div className="pt-16 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl heading-editorial text-graphite-900 mb-4">Associado não encontrado</h1>
        <Link to="/associados" className="text-primary-600 hover:underline text-sm">Voltar aos associados</Link>
      </div>
    </div>
  )

  const branches = associate.branches ?? []
  const hasBranches = branches.some((b) => b.active)

  return (
    <article className="pt-16 min-h-screen">
      <div className="relative h-72 sm:h-96 bg-graphite-100">
        {associate.store_image_url ? (
          <img src={associate.store_image_url} alt={associate.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-graphite-100 to-graphite-200 flex items-center justify-center">
            <span className="text-7xl heading-editorial text-graphite-300 select-none">{associate.name[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-graphite-900/70 via-graphite-900/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="container-site max-w-3xl pb-6 flex items-end gap-4">
            {associate.logo_url ? (
              <div className="flex-shrink-0 bg-white p-2.5 shadow-lg">
                <img src={associate.logo_url} alt={associate.name} className="h-12 w-auto max-w-[140px] object-contain" />
              </div>
            ) : (
              <div className="w-16 h-16 flex-shrink-0 bg-white flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-graphite-700">{getInitials(associate.name)}</span>
              </div>
            )}
            <div>
              <span className="inline-flex items-center gap-1.5 bg-primary-500 text-graphite-900 text-[0.65rem] font-bold uppercase tracking-widest px-2.5 py-1 mb-2">
                <BadgeCheck size={12} /> Associado GCasa
              </span>
              <h1 className="text-2xl sm:text-3xl heading-editorial text-white leading-tight text-balance">{associate.name}</h1>
              {(associate.city || associate.state) && (
                <p className="flex items-center gap-1.5 text-sm text-white/70 mt-1">
                  <MapPin size={13} />
                  {[associate.city, associate.state].filter(Boolean).join(' — ')}
                </p>
              )}
            </div>
          </div>
        </div>

        <Link
          to="/associados"
          className="absolute top-4 left-4 inline-flex items-center gap-2 bg-black/40 hover:bg-black/60 text-white px-4 py-2 text-sm transition-colors"
        >
          <ArrowLeft size={14} /> Voltar
        </Link>
      </div>

      <div className="container-site max-w-3xl py-12 space-y-12">
        {associate.category?.name && (
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-primary-500">
            {associate.category.name}
          </span>
        )}

        <AssociadoContato associate={associate} />

        {associate.description && (
          <div>
            <h2 className="section-label">Nossa História</h2>
            <div className="h-px bg-primary-400/30 mt-3 mb-5" />
            <p className="text-graphite-600 leading-relaxed md:columns-2 md:gap-8">{associate.description}</p>
          </div>
        )}

        <AssociadoGaleria gallery={associate.gallery} />

        {!hasBranches && (
          <AssociadoLocalizacao
            address={associate.address}
            city={associate.city}
            state={associate.state}
            businessHours={associate.business_hours}
          />
        )}

        {hasBranches && <AssociadoFiliais branches={branches} />}
      </div>

      <div className="texture-concrete texture-concrete--dark bg-graphite-900 py-20 text-center">
        <div className="container-site max-w-2xl">
          <span className="section-label-light">Faça parte</span>
          <h2 className="text-3xl md:text-4xl heading-editorial text-white mt-4">
            {cta?.title ?? 'Pronto para crescer junto com a gente?'}
          </h2>
          <p className="text-graphite-300 mt-4">
            {cta?.description ?? 'Associe-se ao Grupo GCasa e tenha acesso a uma rede que move o setor.'}
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Link to="/quero-me-associar" className="bg-primary-500 hover:bg-primary-600 text-graphite-900 px-6 py-3 font-bold transition-colors">
              Quero me associar
            </Link>
            <Link to="/contato" className="border-2 border-white/30 text-white px-6 py-3 font-bold hover:border-primary-400 hover:text-primary-400 transition-colors">
              Fale Conosco
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
