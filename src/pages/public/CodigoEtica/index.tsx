import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function CodigoEticaPage() {
  return (
    <div className="pt-16 min-h-screen bg-offwhite">
      <div className="container-site max-w-2xl py-20 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-graphite-500 hover:text-primary-600 transition-colors text-sm mb-8">
          <ArrowLeft size={14} /> Voltar ao início
        </Link>
        <span className="w-14 h-14 mx-auto flex items-center justify-center bg-primary-50 text-primary-500 mb-6">
          <ShieldCheck size={24} />
        </span>
        <span className="section-label mb-3 block">Institucional</span>
        <h1 className="text-3xl md:text-4xl heading-editorial text-graphite-900 text-balance">Código de Ética</h1>
        <p className="mt-5 text-lg text-graphite-700 leading-relaxed">
          Estamos organizando a publicação do código de ética do Grupo GCasa nesta página. Se precisar do documento agora, fale com a nossa equipe.
        </p>
        <Link
          to="/contato"
          className="inline-flex items-center gap-2 mt-8 bg-primary-500 hover:bg-primary-600 text-white font-bold px-8 py-4 transition-colors text-base"
        >
          Falar com a equipe
        </Link>
      </div>
    </div>
  )
}
