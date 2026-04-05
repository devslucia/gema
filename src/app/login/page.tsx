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
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-dark">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-2">
            <div className="relative w-12 h-12">
              <Image
                src="/logo.png"
                alt="GEMA"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <p className="text-gray-600 dark:text-gray-400">Ingreso de Administrador</p>
        </div>
        
        <div className="bg-white dark:bg-dark-100 rounded-xl shadow-lg p-8 border border-primary/20 dark:border-dark-200">
          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Correo electrónico
              </label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 border border-gray-200 dark:border-dark-200 rounded-lg bg-white dark:bg-dark text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                required
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-200 dark:border-dark-200 rounded-lg bg-white dark:bg-dark text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !supabase}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="text-primary hover:underline">
            Volver al catálogo
          </Link>
        </p>
      </div>
    </main>
  )
}
