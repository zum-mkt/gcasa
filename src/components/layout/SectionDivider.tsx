/**
 * Transição suave entre uma faixa escura e a seção clara seguinte (ou vice-versa),
 * pra evitar o corte abrupto de cor. Só faz sentido nas costuras claro/escuro reais
 * da Home — usar entre duas seções do mesmo tom não teria efeito visível.
 */
export function SectionDivider({ from = 'dark' }: { from?: 'dark' | 'light' }) {
  const gradient =
    from === 'dark'
      ? 'linear-gradient(to bottom, #3D3B3B, transparent)'
      : 'linear-gradient(to bottom, transparent, #3D3B3B)'
  return <div aria-hidden="true" className="h-10 lg:h-14 w-full" style={{ background: gradient }} />
}
