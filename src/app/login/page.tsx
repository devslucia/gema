'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      setSupabase(createClient())
    } catch {
      setError('Supabase no está configurado. Por favor agregá tus credenciales en .env.local')
    }
    emailRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    
    if (!email.trim() || !password.trim()) {
      setError('Por favor completá todos los campos')
      return
    }
    
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Correo electrónico o contraseña incorrectos')
      toast.error('Error al iniciar sesión')
      setLoading(false)
    } else {
      toast.success('¡Bienvenido!')
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <main 
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-background-light dark:bg-background-dark"
      role="main"
      aria-label="Página de ingreso"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-3 mb-2"
            aria-label="GEMA - Volver al catálogo"
          >
            <div className="relative w-12 h-12">
              <Image
                src="/logo.png"
                alt="Logo de GEMA"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">Ingreso de Administrador</p>
        </div>
        
        <div className="bg-surface-light dark:bg-dark-100 rounded-xl shadow-lg p-8 border border-primary/20 dark:border-dark-200">
          {error && (
            <div 
              id="login-error"
              className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-6">
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2"
              >
                Correo electrónico
              </label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 border border-surface-light dark:border-dark-200 rounded-lg bg-surface-light dark:bg-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                required
                aria-describedby={error ? 'login-error' : undefined}
                aria-invalid={!!error}
              />
            </div>

            <div className="mb-8">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-surface-light dark:border-dark-200 rounded-lg bg-surface-light dark:bg-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                required
                aria-describedby={error ? 'login-error' : undefined}
                aria-invalid={!!error}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !supabase}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          <Link 
            href="/" 
            className="text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          >
            Volver al catálogo
          </Link>
        </p>
      </div>
    </main>
  )
}
