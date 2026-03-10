import React from 'react'

const ResponsiveText = ({ 
  children, 
  variant = 'body', 
  className = '',
  ...props 
}) => {
  const variants = {
    h1: 'text-xl md:text-2xl lg:text-4xl font-bold',
    h2: 'text-lg md:text-xl lg:text-3xl font-semibold',
    h3: 'text-base md:text-lg lg:text-2xl font-medium',
    h4: 'text-sm md:text-base lg:text-xl font-medium',
    body: 'text-xs md:text-sm lg:text-base',
    small: 'text-[10px] md:text-xs lg:text-sm',
    large: 'text-sm md:text-base lg:text-lg',
  }

  const baseClass = variants[variant] || variants.body

  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {children}
    </div>
  )
}

export default ResponsiveText