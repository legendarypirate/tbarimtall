import React from 'react';
import { cn } from '@/utils';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div
        className={cn(
          'border-[#004e6c] dark:border-[#ff6b35] border-t-transparent rounded-full animate-spin',
          sizes[size]
        )}
      />
      {text && (
        <p className="mt-4 text-[#004e6c] dark:text-gray-200 text-lg font-medium">{text}</p>
      )}
    </div>
  );
};

