'use client'

import { useTheme } from './ThemeProvider'
import { Sun, Moon, LogIn, LogOut, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { logout } from '@/app/actions'

interface NavbarProps {
  isAuthenticated?: boolean
}

export default function Navbar({ isAuthenticated = false }: NavbarProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header 
      className="bg-surface-light dark:bg-surface-dark shadow-sm border-b border-primary/20 dark:border-primary/30"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link 
            href="/" 
            className="flex items-center gap-3 group"
            aria-label="GEMA - Ir al catálogo"
          >
            <div className="relative w-10 h-10">
              <Image
                src="/logo.png"
                alt="Logo de GEMA"
                fill
                className="object-contain drop-shadow-lg group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <span className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark hidden sm:inline">GEMA</span>
          </Link>
          
          <nav 
            className="flex items-center gap-2 sm:gap-4"
            role="navigation"
            aria-label="Navegación principal"
          >
            {isAuthenticated ? (
              <>
                <Link
                  href="/admin"
                  className="flex items-center gap-1 sm:gap-2 px-3 py-2 text-sm text-secondary hover:bg-secondary/10 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label="Ir al panel de administración"
                >
                  <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex items-center gap-1 sm:gap-2 px-3 py-2 text-sm text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/10 hover:text-primary rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Cerrar sesión</span>
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Ir a página de ingreso"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-surface-light dark:bg-dark-50 text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/20 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Moon className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}