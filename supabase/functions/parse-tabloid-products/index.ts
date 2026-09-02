// Interpreta uma lista de produtos colada em texto livre (associado) e devolve
// os produtos já estruturados — preço, promoção calculada, sugestão de bloco
// (categoria), destaque e página. Não grava nada no banco: quem decide o que
// vira `tabloid_products` é o associado, revisando o resultado no navegador.
//
// Provedor: Google Gemini (gemini-2.5-flash), não Anthropic — a um volume de
// ~150 listas/mês (5 listas x 30 produtos/dia) fica bem mais barato que
// Claude nesse tipo de tarefa. Sintaxe conferida direto no pacote
// `@google/genai` instalado localmente (README + .d.ts), não só por busca.
//
// Só precisa da ANON key (não do service_role) — a function apenas autentica
// quem chamou pra liberar o uso da IA; a gravação continua sendo feita pelo
// cliente, sujeita à RLS normal de `tabloid_products`.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GoogleGenAI, Type } from 'npm:@google/genai@^2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_TEXT_LENGTH = 8000

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

const SYSTEM_PROMPT = `Você extrai produtos de uma lista colada por um lojista associado de uma cooperativa de materiais de construção, para montar um tabloide de vendas impresso.

O texto costuma vir informal e sem muita pontuação — sem "R$", com "reais" por extenso, sem casas decimais (ex.: "60 reais" = R$ 60,00), às vezes com erros de digitação/transcrição por voz. Use bom senso de contexto pra interpretar mesmo quando a linha não é perfeitamente estruturada.

Regras:
- Português do Brasil. Preço pode vir como "R$ 49,90", "49,90", "60 reais", "R$60" etc. — todos viram o mesmo valor numérico em reais.
- Geralmente um produto por linha, mas um produto pode ocupar 2-3 linhas quando a primeira linha não tem preço (aí as linhas seguintes completam o mesmo produto).
- Linha de CONDIÇÃO DE PAGAMENTO (começa com "Condição:", "Condição de pagamento:", "Forma de pagamento:" ou similar — ex.: "Condição: 3x de R$ 160,00 sem juros", "Condição: R$ 55,10 à vista (5% OFF)") NUNCA é um produto novo, mesmo que tenha "R$" — é sempre um detalhe do produto da linha ANTERIOR. Extraia o texto (sem o rótulo) pro campo payment_condition desse produto anterior, e não crie um item separado pra ela.
- IMPORTANTE — payment_condition não precisa de rótulo nenhum: QUALQUER trecho da linha do produto que fale de forma/condição de pagamento, desconto ou vantagem na compra (cartão de crédito, boleto, PIX, dinheiro, cheque, parcelado, "Nx", "sem juros", "à vista", "OFF", desconto) é condição de pagamento, não faz parte do nome nem da descrição — em qualquer posição da linha, não só coladinho no preço. Ex.: "Pedra britada nº 1 — Pedreira São João — R$ 89,50 — cartão de crédito em 2x" → name: "Pedra britada nº 1 — Pedreira São João", price: 89.50, payment_condition: "cartão de crédito em 2x". "Cimento CP II — Votoran — R$ 38,90 — PIX" → payment_condition: "PIX". "Tinta 18L R$ 199,90 à vista" → payment_condition: "à vista". Nunca deixe esse tipo de trecho sobrando dentro de "name" (nem como travessão solto no fim) — sempre mova pro payment_condition.
- Padrão "de X por Y": X vira price, Y vira promo_price.
- Padrão "X% de desconto" ou "descontaço de X%" com preço dado: price = preço dado, promo_price = price * (1 - X/100), arredondado em 2 casas.
- Se houver só um preço, sem nenhum padrão de desconto: price = esse valor, promo_price = null.
- Quando a linha tiver só um número solto no fim sem "reais"/"R$" explícito mas o contexto deixar claro que é preço (é o único número da linha, produto de varejo), assuma que é o preço — mas preencha "note" avisando que vale conferir.
- page só deve ser 1 ou 2, e só quando o texto citar página explicitamente (ex. "página 2", "pág 2", "pg2") — caso contrário null.
- unit é a unidade de venda do produto (kg, m², m, un, peça, milheiro, saco, litro, caixa, dúzia, par, rolo, galão, fardo, kit etc.) — extraia de pistas como "o metro", "o litro", "a unidade", "50kg" no nome, "vendido em milheiro" etc. Null se não houver nenhuma pista.
- Nunca invente categoria, página, destaque ou unidade sem uma pista real no texto — prefira deixar null/false a chutar.
- Sempre preencha source_line com o trecho original exato que originou aquele produto.
- Se não tiver certeza de algo (preço ambíguo, nome cortado, palavra estranha no meio tipo erro de digitação), preencha "note" com um aviso curto — não trave a extração por isso, faça a melhor interpretação possível.`

const productDraftSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'Nome do produto, limpo (sem o preço/trecho de desconto junto).' },
    category: { type: Type.STRING, nullable: true, description: 'Bloco interno/categoria (ex.: "Tintas") — só se houver pista clara.' },
    price: { type: Type.NUMBER, nullable: true, description: 'Preço cheio/original em reais.' },
    promo_price: { type: Type.NUMBER, nullable: true, description: 'Preço promocional final em reais.' },
    payment_condition: { type: Type.STRING, nullable: true, description: 'Condição de pagamento em texto livre (ex.: "3x de R$ 160,00 sem juros", "à vista com 5% OFF") — null se não houver nenhuma pista no texto.' },
    description: { type: Type.STRING, nullable: true, description: 'Detalhe extra da linha (embalagem, observação) que não seja a unidade de venda.' },
    unit: { type: Type.STRING, nullable: true, description: 'Unidade de venda (kg, m², m, un, peça, milheiro, saco, litro, caixa, dúzia, par, rolo, galão, fardo, kit) — só com pista real.' },
    is_featured: { type: Type.BOOLEAN, description: 'true só com pista explícita de destaque no texto.' },
    page: { type: Type.INTEGER, nullable: true, description: 'Só 1 ou 2, e só se o texto citar página explicitamente.' },
    source_line: { type: Type.STRING, description: 'Trecho original exato que originou este produto.' },
    note: { type: Type.STRING, nullable: true, description: 'Aviso curto quando houver ambiguidade.' },
  },
  required: ['name', 'is_featured', 'source_line'],
}

const parseResultSchema = {
  type: Type.OBJECT,
  properties: {
    products: { type: Type.ARRAY, items: productDraftSchema },
  },
  required: ['products'],
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autenticado.' }, 200)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) return json({ error: 'IA não configurada (GEMINI_API_KEY ausente no projeto).' }, 200)

    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: { user }, error: userError } = await callerClient.auth.getUser()
    if (userError || !user) return json({ error: 'Sessão inválida.' }, 200)

    const { data: callerProfile } = await callerClient.from('profiles').select('role').eq('id', user.id).single()
    if (!callerProfile || !['associate', 'admin'].includes(callerProfile.role)) {
      return json({ error: 'Só associados ou administradores podem usar essa função.' }, 200)
    }

    const { text } = await req.json()
    if (!text || typeof text !== 'string' || !text.trim()) {
      return json({ error: 'Cole a lista de produtos antes de analisar.' }, 200)
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return json({ error: `Lista muito longa (máx. ${MAX_TEXT_LENGTH} caracteres) — cole em partes menores.` }, 200)
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey })

    // Fixar `gemini-flash-latest` foi o que derrubou a IA: o Google aposentou
    // os modelos pra onde esse alias apontava e ele passou a devolver 404
    // "model not found" / "no longer available to new users" — e o front
    // engolia o erro caindo num parser local fraco, então parecia que a IA
    // "não entendia" a lista. Agora tentamos uma fila de IDs FIXOS, do mais
    // barato/atual pro alias, e só passamos pro próximo quando o erro é de
    // modelo (404 / indisponível). Quando um vencedor se firmar, dá pra
    // enxugar essa lista pra ele + 1 reserva.
    const MODELS = ['gemini-2.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest']

    const config = {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: parseResultSchema,
      httpOptions: { timeout: 45_000 },
    }

    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | undefined
    let usedModel = ''
    let lastModelError = ''
    for (const model of MODELS) {
      try {
        response = await ai.models.generateContent({ model, contents: text, config })
        usedModel = model
        break
      } catch (e) {
        const status = (e as { status?: number }).status
        const msg = e instanceof Error ? e.message : String(e)
        console.error(`[parse-tabloid-products] modelo ${model} falhou (status ${status ?? '?'}): ${msg}`)
        const isModelIssue = status === 404 || /not found|no longer available|not supported|unsupported/i.test(msg)
        if (!isModelIssue) {
          // Cota, chave inválida, safety, timeout — insistir noutro modelo não ajuda.
          return json({ error: `IA falhou (${model}): ${msg}` }, 200)
        }
        lastModelError = `${model}: ${msg}`
      }
    }

    if (!response) {
      return json({ error: `IA sem modelo disponível — última falha: ${lastModelError || 'nenhum modelo respondeu'}` }, 200)
    }
    console.log(`[parse-tabloid-products] extração ok com ${usedModel}`)

    let parsed: { products?: unknown[] }
    try {
      parsed = JSON.parse(response.text ?? '{}')
    } catch {
      return json({ error: 'Não consegui interpretar essa lista. Tente colar em linhas mais separadas.' }, 200)
    }

    return json({ products: parsed.products ?? [], model: usedModel })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado.' }, 200)
  }
})
