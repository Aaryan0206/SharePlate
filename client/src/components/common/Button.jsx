import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3.5 rounded-xl gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary: 'bg-forest-800 hover:bg-forest-900 text-white shadow-subtle hover:shadow-card focus:ring-forest-700 active:scale-[0.98]',
    secondary: 'bg-sage-100 hover:bg-sage-200 text-forest-900 border border-sage-300 focus:ring-sage-400 active:scale-[0.98]',
    accent: 'bg-terracotta-400 hover:bg-terracotta-500 text-white shadow-subtle focus:ring-terracotta-400 active:scale-[0.98]',
    outline: 'border border-forest-800 text-forest-800 hover:bg-forest-50 focus:ring-forest-600 active:scale-[0.98]',
    ghost: 'text-charcoal-700 hover:text-forest-800 hover:bg-cream-100 focus:ring-forest-500',
    white: 'bg-white hover:bg-cream-50 text-forest-900 shadow-sm border border-stone-200 focus:ring-forest-600'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
        </>
      )}
    </button>
  );
}
