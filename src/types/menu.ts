export type MenuItemType = 'external_url' | 'anchor' | 'internal_page'

export interface MenuItem {
  id: string
  label: string
  order_index: number
  is_active: boolean
  type: MenuItemType
  url: string | null
  anchor: string | null
  path: string | null
  open_new_tab: boolean
  parent_id: string | null
  created_at: string
  updated_at: string
}

export type MenuItemInput = Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>

export type MenuNode = {
  item: MenuItem
  children: MenuItem[]
}
