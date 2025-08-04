import React from 'react';

// Define button variants and sizes
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'white';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type ButtonWidth = 'auto' | 'full';

// Button props interface
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  width?: ButtonWidth;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

// Generic Button component
const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  width = 'auto',
  rounded = '2xl',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  // Base styles
  const baseStyles = 'font-medium cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

  // Variant styles
  const variantStyles = {
    primary: 'bg-primary text-white focus:ring-blue-500',
    secondary: 'bg-secondary hover:bg-gray-700 text-white focus:ring-gray-500',
    outline: 'border-1 border-primary text-primary hover:bg-primary hover:text-white focus:ring-blue-500',
    ghost: 'text-primary hover:bg-blue-50 focus:ring-blue-500',
    danger: 'bg-[#D52525] hover:bg-red-700 text-white focus:ring-red-500',
    white: 'bg-[#F5F5F5] text-secondary/50 hover:bg-gray-100 focus:ring-gray-500'
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  // Width styles
  const widthStyles = {
    auto: 'w-auto',
    full: 'w-full'
  };

  // Rounded styles
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  };

  // Combine all styles
  const buttonStyles = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${widthStyles[width]}
    ${roundedStyles[rounded]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      className={buttonStyles}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;