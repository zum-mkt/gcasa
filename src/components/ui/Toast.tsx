import * as ToastPrimitive from '@radix-ui/react-toast'
import { create } from 'zustand'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  title: string
  description?: string
}

interface ToastStore {
  toasts: ToastItem[]
  add: (t: Omit<ToastItem, 'id'>) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: crypto.randomUUID() }] })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().add({ type: 'success', title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().add({ type: 'error', title, description }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().add({ type: 'warning', title, description }),
  info: (title: string, description?: string) =>
    useToastStore.getState().add({ type: 'info', title, description }),
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const colors = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
}

export function ToastProvider() {
  const { toasts, remove } = useToastStore()

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => {
        const Icon = icons[t.type]
        return (
          <ToastPrimitive.Root
            key={t.id}
            open
            onOpenChange={(open) => !open && remove(t.id)}
            duration={4000}
            className={cn(
              'bg-white border border-gray-200 rounded-xl shadow-dropdown p-4',
              'flex items-start gap-3 w-[360px]',
              'data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full'
            )}
          >
            <Icon size={18} className={cn('flex-shrink-0 mt-0.5', colors[t.type])} />
            <div className="flex-1">
              <ToastPrimitive.Title className="text-sm font-semibold text-gray-900">
                {t.title}
              </ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="text-xs text-gray-500 mt-0.5">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close asChild>
              <button className="p-0.5 rounded hover:bg-gray-100 text-gray-400">
                <X size={13} />
              </button>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        )
      })}
      <ToastPrimitive.Viewport className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 outline-none" />
    </ToastPrimitive.Provider>
  )
}
