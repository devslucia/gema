'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import SearchDropdown from './SearchDropdown'

interface SearchResultGroup {
  products: {
    id: string
    name: string
    price: number
    category_id: string | null
    created_at: string
  }[]
  category: { id: string; name: string } | null
}

export default function SearchBar({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(defaultValue)
  const [isFocused, setIsFocused] = useState(false)
  const [results, setResults] = useState<SearchResultGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!value.trim()) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
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
    setResults([])
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    inputRef.current?.focus()
  }

  const showDropdown = isFocused && query.trim().length > 0

  return (
    <form onSubmit={handleSearch} className="flex-1 relative" role="search" aria-label="Buscar productos">
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
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 200)
          }}
          placeholder="Buscar productos..."
          className="input-field pl-12 pr-12 py-3.5 text-body shadow-elevation-1 focus:shadow-elevation-2"
          aria-label="Buscar productos por nombre"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <SearchDropdown
          results={results}
          query={query}
          isLoading={isLoading}
        />
      )}
    </form>
  )
}