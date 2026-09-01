'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { useDebounce } from '@/lib/hooks/useDebounce'
import SearchDropdown from './SearchDropdown'

export default function SearchBar({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(defaultValue)
  const [isFocused, setIsFocused] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 200)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (query.trim()) {
      params.set('q', query.trim())
    } else {
      params.delete('q')
    }
    router.push(`/?${params.toString()}`)
    setShowDropdown(false)
  }, [query, router, searchParams])

  const handleClear = useCallback(() => {
    setQuery('')
    inputRef.current?.focus()
    router.push('/')
    setShowDropdown(false)
  }, [router])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setShowDropdown(true)
  }, [])

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsFocused(false)
      setShowDropdown(false)
    }, 200)
  }, [])

  return (
    <div className="w-full relative" role="search" aria-label="Buscar productos">
      <form onSubmit={handleSearch} className="w-full relative">
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
            onChange={handleInputChange}
            onFocus={() => {
              setIsFocused(true)
              setShowDropdown(true)
            }}
            onBlur={handleBlur}
            placeholder="Buscar productos..."
            className="input-field pl-12 pr-12 py-3.5 text-body shadow-elevation-1 focus:shadow-elevation-2 min-h-[44px]"
            aria-label="Buscar productos por nombre"
            aria-autocomplete="list"
            aria-controls="search-dropdown"
            aria-expanded={showDropdown && debouncedQuery.trim().length > 0}
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
      </form>

      {showDropdown && debouncedQuery.trim().length > 0 && (
        <SearchDropdown 
          ref={dropdownRef}
          query={debouncedQuery}
        />
      )}
    </div>
  )
}