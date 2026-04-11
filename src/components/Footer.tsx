'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer 
      className="bg-surface-light dark:bg-dark-100 border-t border-primary/20 dark:border-dark-200"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image
                src="/logo.png"
                alt="GEMA"
                fill
                className="object-contain"
              />
            </div>
          </Link>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            <span className="flex items-center gap-1.5">
              📍 Av. Mitre 1772
            </span>
            <span className="flex items-center gap-1.5">
              📞 +54 3765 222240
            </span>
          </div>

          <a
            href="https://wa.me/543765222240"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-secondary hover:text-secondary/80 transition-colors"
          >
            Consultas por WhatsApp
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-primary/10 dark:border-dark-200 text-center">
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            © {currentYear} GEMA Reparación & Accesorios. Creado por{' '}
            <a 
              href="#" 
              className="text-primary/70 hover:text-primary transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              luciadevs
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}