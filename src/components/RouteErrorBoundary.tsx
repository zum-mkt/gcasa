// Cai aqui sempre que uma rota (ou o lazy-import dela) explode e nenhum
// `errorElement` mais específico pega antes — sem isso, o React Router mostra
// a tela padrão dele ("Unexpected Application Error! Hey developer 👋"), que é
// só pra dev, não pra usuário final.
//
// Caso mais comum na prática: acabamos de fazer um deploy novo (nomes de
// arquivo mudam a cada build, por causa do hash) e alguém já tinha o site
// aberto numa aba antiga. Ao clicar num link, o React tenta importar um
// chunk (ex.: `Tabloides-<hash-antigo>.js`) que não existe mais no CDN — o
// `_redirects` (fallback de SPA) devolve `index.html` no lugar, e o browser
// reclama que isso não é JavaScript válido. Um único F5 já resolve (busca o
// `index.html` novo, com os nomes de arquivo atualizados), então detectamos
// esse caso e recarregamos sozinhos, sem o usuário precisar entender nada.
import { useEffect } from 'react'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'

const RELOAD_FLAG = 'gcasa:chunk-reload-attempted'

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|is not a valid JavaScript MIME type|module script failed|loading chunk|chunkloaderror|failed to fetch/i.test(message)
}

export default function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()
  const chunkError = isChunkLoadError(error)

  useEffect(() => {
    if (!chunkError) return
    // Guarda em sessionStorage pra não entrar em loop se o reload não resolver
    // (erro de outra natureza mascarado com a mesma mensagem, por exemplo).
    if (sessionStorage.getItem(RELOAD_FLAG)) return
    sessionStorage.setItem(RELOAD_FLAG, '1')
    window.location.reload()
  }, [chunkError])

  if (chunkError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-4 text-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Atualizando o sistema...</p>
      </div>
    )
  }

  const status = isRouteErrorResponse(error) ? error.status : null

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
      <p className="text-5xl">😕</p>
      <div>
        <h1 className="text-lg font-bold text-gray-900">
          {status === 404 ? 'Página não encontrada' : 'Algo deu errado'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {status === 404 ? 'Esse endereço não existe ou foi movido.' : 'Tente recarregar a página. Se continuar, avise o suporte.'}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
        >
          Recarregar
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
        >
          Início
        </button>
      </div>
    </div>
  )
}
