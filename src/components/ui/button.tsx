"use client"

interface ButtonProps {
  /** Tamaño del botón */
  size?: "sm" | "lg" | "xl"
  /** Tipo de estilo */
  type?: "primary" | "secondary" | "outline"
  /** Si el botón debe ocupar todo el ancho disponible */
  width?: boolean
  /** Función de click */
  onClick: () => void
  /** Título del botón */
  children: React.ReactNode
  /** Clases adicionales */
  className?: string
}

export function Button({ size = "lg", type = "primary", width = false, onClick, children, className }: ButtonProps) {
  const sizeClasses = {
    sm: "text-sm py-1.5 px-4",
    lg: "text-base py-2 px-6",
    xl: "text-lg py-3 px-8",
  }

  const typeClasses = {
    primary: "bg-primary text-white dark:bg-primary-600 hover:bg-primary-600 dark:hover:bg-primary-700",
    secondary: "bg-secondary text-white dark:bg-secondary-600 hover:bg-secondary-600 dark:hover:bg-secondary-700",
    outline: "border-2 border-primary text-primary dark:text-primary-400 hover:bg-primary/10 dark:hover:bg-primary/20",
  }

  const widthClass = width ? "w-full" : ""

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        sizeClasses[size],
        typeClasses[type],
        widthClass,
        "transition-colors duration-150",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  )
}