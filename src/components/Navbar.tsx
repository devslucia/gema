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
    <header className="bg-white dark:bg-dark shadow-sm border-b border-primary/20 dark:border-primary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <Image
                src="/logo.png"
                alt="GEMA"
                fill
                className="object-contain drop-shadow-lg group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">GEMA</span>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/admin"
                  className="flex items-center gap-1 sm:gap-2 px-3 py-2 text-sm text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex items-center gap-1 sm:gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-primary/10 hover:text-primary dark:hover:text-primary rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-300 hover:bg-primary/20 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}