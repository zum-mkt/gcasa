import {
  BarChart2, Users, Handshake, GraduationCap, Lightbulb, TrendingUp,
  Star, Shield, Target, Award, Zap, Heart, Globe, Building2, Truck, Package,
  type LucideIcon,
} from 'lucide-react'

/* Mesmo conjunto de ícones disponível no editor de Benefícios da Home (HomeEditor),
   reaproveitado nas páginas Quem Somos / Quero me Associar / Sou Fornecedor pra manter
   os "cartões de benefício" consistentes em toda a área editável do site. */
export const PAGE_ICON_NAMES = [
  'BarChart2', 'Users', 'Handshake', 'GraduationCap', 'Lightbulb', 'TrendingUp',
  'Star', 'Shield', 'Target', 'Award', 'Zap', 'Heart', 'Globe', 'Building2', 'Truck', 'Package',
] as const

export const PAGE_ICON_MAP: Record<string, LucideIcon> = {
  BarChart2, Users, Handshake, GraduationCap, Lightbulb, TrendingUp,
  Star, Shield, Target, Award, Zap, Heart, Globe, Building2, Truck, Package,
}
