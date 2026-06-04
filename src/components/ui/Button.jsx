import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:   'bg-olive-700 text-white shadow-sm hover:bg-olive-800 disabled:opacity-70',
  secondary: 'border border-olive-700 text-olive-700 hover:bg-olive-50 disabled:opacity-60',
  ghost:     'text-slate-600 hover:bg-slate-100 disabled:opacity-60',
  danger:    'bg-red-600 text-white hover:bg-red-700 disabled:opacity-70',
}

const SIZES = {
  lg: 'text-base px-5 py-4',
  md: 'text-sm px-5 py-3.5',
  sm: 'text-xs px-3.5 py-2',
}

const ROUNDED = {
  '2xl': 'rounded-2xl',
  full:  'rounded-full',
}

/**
 * Button — standardized action button with variants, sizes and a built-in
 * loading state (spinner + disabled). `icon` is a Lucide component.
 *
 * Ref-forwarding so callers (e.g. ConfirmDialog) can focus the primary action.
 */
const Button = forwardRef(function Button({
  variant = 'primary',
  size = 'md',
  rounded = '2xl',
  loading = false,
  fullWidth = false,
  icon: Icon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 font-bold
        active:scale-[0.98] disabled:cursor-not-allowed transition-all duration-150
        ${VARIANTS[variant]} ${SIZES[size]} ${ROUNDED[rounded]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading
        ? <Loader2 size={18} className="animate-spin flex-shrink-0" />
        : Icon && <Icon size={18} strokeWidth={2} className="flex-shrink-0" />}
      {children && <span>{children}</span>}
    </button>
  )
})

export default Button
