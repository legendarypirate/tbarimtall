import React from 'react';
import { cn } from '@/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-gray-800 border-2 border-[#004e6c]/10 dark:border-gray-700',
      elevated: 'bg-white dark:bg-gray-800 shadow-lg',
      outlined: 'bg-transparent border-2 border-[#004e6c]/20 dark:border-gray-700',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-300',
          variants[variant],
          hover && 'hover:shadow-2xl hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

