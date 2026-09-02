import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-sm',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-graphite-900 hover:bg-primary-600 focus-visible:ring-primary-500',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus-visible:ring-gray-400',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400',
        ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
        'danger-ghost': 'text-red-600 hover:bg-red-50',
        dark: 'bg-dark-900 text-white hover:bg-dark-800 focus-visible:ring-dark-900',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4',
        lg: 'h-11 px-6',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, leftIcon, rightIcon, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    // Com asChild, o Comp vira o <Slot> do Radix, que exige exatamente UM
    // elemento filho — por isso não dá pra envolver com o ícone de
    // loading/leftIcon/rightIcon nesse caso (children sozinho já é o
    // elemento real, tipo um <Link>). Sem asChild, é um <button> normal e
    // pode ter quantos filhos quiser.
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? children : (
          <>
            {loading ? <Loader2 size={14} className="animate-spin" /> : leftIcon}
            {children}
            {!loading && rightIcon}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = 'Button'
