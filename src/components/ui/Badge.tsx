import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-700',
        primary: 'bg-primary-100 text-primary-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        danger: 'bg-red-100 text-red-700',
        dark: 'bg-dark-900 text-white',
        outline: 'border border-gray-300 text-gray-600 bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    published: { label: 'Publicado', variant: 'success' },
    draft: { label: 'Rascunho', variant: 'warning' },
    archived: { label: 'Arquivado', variant: 'default' },
    active: { label: 'Ativo', variant: 'success' },
    inactive: { label: 'Inativo', variant: 'danger' },
  }
  const config = map[status] ?? { label: status, variant: 'default' }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
