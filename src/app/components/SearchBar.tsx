'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

export default function SearchBar({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(defaultValue)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (query) {
      params.set('q', query)
    } else {
      params.delete('q')
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex-1" role="search" aria-label="Buscar productos">
      <div className={`relative transition-all duration-200 ease-smooth ${isFocused ? 'scale-[1.01]' : ''}`}>
        <Search 
          className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
            isFocused ? 'text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark'
          }`}
          aria-hidden="true" 
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Buscar productos..."
          className="input-field pl-12 pr-4 py-3.5 text-body shadow-elevation-1 focus:shadow-elevation-2"
          aria-label="Buscar productos por nombre"
        />
      </div>
    </form>
  )
}