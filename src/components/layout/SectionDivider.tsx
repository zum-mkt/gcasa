/**
 * Transição suave entre uma faixa escura e a seção clara seguinte (ou vice-versa),
 * pra evitar o corte abrupto de cor. Só faz sentido nas costuras claro/escuro reais
 * da Home — usar entre duas seções do mesmo tom não teria efeito visível.
 */
export function SectionDivider({ from = 'dark' }: { from?: 'dark' | 'light' }) {
  const gradient =
    from === 'dark'
      ? 'linear-gradient(to bottom, #0D2228, transparent)'
      : 'linear-gradient(to bottom, transparent, #0D2228)'
  return <div aria-hidden="true" className="h-10 lg:h-14 w-full" style={{ background: gradient }} />
}
