import React from 'react';

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon: Icon
}) {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 rounded-full gap-1.5 font-semibold',
  };

  const variantStyles = {
    default: 'bg-stone-100 text-stone-800 border border-stone-200',
    forest: 'bg-forest-50 text-forest-800 border border-forest-200',
    sage: 'bg-sage-100 text-forest-800 border border-sage-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    terracotta: 'bg-terracotta-50 text-terracotta-600 border border-terracotta-200',
    info: 'bg-sky-50 text-sky-800 border border-sky-200',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  };

  return (
    <span className={`inline-flex items-center tracking-tight ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      {children}
    </span>
  );
}
