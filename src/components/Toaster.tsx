'use client'

import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--background)',
          border: '1px solid var(--border)',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
