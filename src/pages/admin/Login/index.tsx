import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

const forgotSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

type ForgotForm = z.infer<typeof forgotSchema>

export default function AdminLogin() {
  const { signIn, resetPassword, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/admin/dashboard'

  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<'login' | 'forgot' | 'forgot-sent'>('login')
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    navigate(from, { replace: true })
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors, isSubmitting: isForgotSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) })

  const onLogin = async (data: LoginForm) => {
    setError(null)
    try {
      await signIn(data.email, data.password)
      navigate(from, { replace: true })
    } catch {
      setError('E-mail ou senha incorretos. Verifique seus dados e tente novamente.')
    }
  }

  const onForgot = async (data: ForgotForm) => {
    setError(null)
    try {
      await resetPassword(data.email)
      setMode('forgot-sent')
    } catch {
      setError('Não foi possível enviar o e-mail. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-dark-950 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">G</span>
            </div>
            <span className="text-white font-bold text-lg">Grupo GCasa</span>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-4xl font-bold text-white leading-tight text-balance">
            Plataforma de<br />
            <span className="text-primary-500">gestão completa</span><br />
            do seu grupo.
          </p>
          <p className="mt-4 text-white/50 text-sm leading-relaxed max-w-sm">
            Controle total sobre associados, fornecedores, conteúdo e comunicação — tudo em um só lugar.
          </p>
        </div>

        <div className="relative z-10 flex gap-6">
          {[
            { value: '10+', label: 'Empresas' },
            { value: '18', label: 'Lojas' },
            { value: '700+', label: 'Colaboradores' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-white font-bold">GCasa Admin</span>
          </div>

          {mode === 'login' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Bem-vindo de volta</h1>
                <p className="mt-1 text-white/50 text-sm">Entre com suas credenciais para acessar o painel.</p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">E-mail</label>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    className={cn(
                      'w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none transition-colors',
                      'focus:border-primary-500 focus:bg-white/8',
                      errors.email ? 'border-red-500/50' : 'border-white/10'
                    )}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Senha</label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className={cn(
                        'w-full bg-white/5 border rounded-xl px-4 py-3 pr-11 text-white placeholder-white/20 text-sm outline-none transition-colors',
                        'focus:border-primary-500 focus:bg-white/8',
                        errors.password ? 'border-red-500/50' : 'border-white/10'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null) }}
                    className="text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Recuperar senha</h1>
                <p className="mt-1 text-white/50 text-sm">Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleForgotSubmit(onForgot)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">E-mail</label>
                  <input
                    {...registerForgot('email')}
                    type="email"
                    placeholder="seu@email.com"
                    className={cn(
                      'w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none transition-colors focus:border-primary-500',
                      forgotErrors.email ? 'border-red-500/50' : 'border-white/10'
                    )}
                  />
                  {forgotErrors.email && <p className="mt-1 text-xs text-red-400">{forgotErrors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isForgotSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  {isForgotSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Enviar link de recuperação
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null) }}
                  className="w-full text-center text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  Voltar ao login
                </button>
              </form>
            </>
          )}

          {mode === 'forgot-sent' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✉️</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">E-mail enviado!</h2>
              <p className="text-white/50 text-sm mb-6">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              <button
                onClick={() => { setMode('login'); setError(null) }}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Voltar ao login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
