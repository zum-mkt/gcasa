import { create } from 'zustand'

const BANNER_H = 80

interface UiState {
  isMobileMenuOpen: boolean
  isAdminSidebarCollapsed: boolean
  bannerH: number

  setMobileMenuOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  showBanner: () => void
  hideBanner: () => void
}

export const useUiStore = create<UiState>((set) => ({
  isMobileMenuOpen: false,
  isAdminSidebarCollapsed: false,
  bannerH: 0,

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  setSidebarCollapsed: (collapsed) => set({ isAdminSidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ isAdminSidebarCollapsed: !s.isAdminSidebarCollapsed })),
  showBanner: () => set({ bannerH: BANNER_H }),
  hideBanner: () => set({ bannerH: 0 }),
}))

export { BANNER_H }
