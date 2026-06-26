import { create } from 'zustand'

interface UiState {
  isMobileMenuOpen: boolean
  isAdminSidebarCollapsed: boolean

  setMobileMenuOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

export const useUiStore = create<UiState>((set) => ({
  isMobileMenuOpen: false,
  isAdminSidebarCollapsed: false,

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  setSidebarCollapsed: (collapsed) => set({ isAdminSidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ isAdminSidebarCollapsed: !s.isAdminSidebarCollapsed })),
}))
