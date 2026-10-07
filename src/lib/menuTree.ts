import type { MenuItem, MenuNode } from '@/types/menu'

export function buildMenuTree(items: MenuItem[]): MenuNode[] {
  const sorted = [...items].sort((a, b) => a.order_index - b.order_index || a.label.localeCompare(b.label, 'pt-BR'))
  const childrenByParent = new Map<string, MenuItem[]>()
  const roots: MenuItem[] = []

  for (const item of sorted) {
    if (item.parent_id) {
      const list = childrenByParent.get(item.parent_id) ?? []
      list.push(item)
      childrenByParent.set(item.parent_id, list)
    } else {
      roots.push(item)
    }
  }

  return roots.map((item) => ({
    item,
    children: childrenByParent.get(item.id) ?? [],
  }))
}

export function itemPathname(item: MenuItem): string | null {
  if (item.type === 'internal_page' && item.path) return item.path.split('#')[0] || '/'
  if (item.type === 'anchor') return '/'
  return null
}

export function nodeIsActive(node: MenuNode, pathname: string, tree: MenuNode[] = []): boolean {
  const own = itemPathname(node.item)
  if (own && own === pathname) return true
  return node.children.some((child) => {
    const childPath = itemPathname(child)
    if (!childPath || childPath !== pathname) return false
    const ownedByAnotherParent = tree.some(
      (other) => other.item.id !== node.item.id && itemPathname(other.item) === childPath,
    )
    return !ownedByAnotherParent
  })
}

export function parseInternalPath(path: string): { pathname: string; hash: string } {
  const [pathname, hash] = path.split('#')
  return { pathname: pathname || '/', hash: hash ? `#${hash}` : '' }
}

export function itemIsCurrent(item: MenuItem, pathname: string, hash: string): boolean {
  if (item.type !== 'internal_page' || !item.path) return false
  const parsed = parseInternalPath(item.path)
  if (parsed.hash) return pathname === parsed.pathname && hash === parsed.hash
  return pathname === parsed.pathname && !hash
}
