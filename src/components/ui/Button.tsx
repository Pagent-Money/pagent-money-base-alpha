import React from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 variant?: 'default' | 'secondary' | 'outline'
 size?: 'sm' | 'md' | 'lg'
}

export function Button({ 
 className, 
 variant = 'default', 
 size = 'md',
 ...props 
}: ButtonProps) {
 const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
 
 const variants = {
  default: 'bg-gradient-to-r from-[#6B53FF] to-[#FEA611] hover:from-[#5B43EF] hover:to-[#E89501] text-white',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
 }
 
 const sizes = {
  sm: 'h-9 px-3 text-sm rounded-md',
  md: 'h-10 px-4 py-2 rounded-md',
  lg: 'h-11 px-8 text-base rounded-2xl shadow',
 }

 return (
  <button
   className={cn(
    baseClasses,
    variants[variant],
    sizes[size],
    className
   )}
   {...props}
  />
 )
}
