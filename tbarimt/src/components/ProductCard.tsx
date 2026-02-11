import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from './ui/Card';
import { cn, formatNumber, getCategoryName } from '@/utils';
import type { Product } from '@/types';
import WishlistHeartIcon from './WishlistHeartIcon';

export interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onClick?: () => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  viewMode = 'grid',
  onClick,
  className,
}) => {
  const router = useRouter();
  const isUnique = product.isUnique === true;
  const productId = product.uuid || product.id;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/products/${productId}`);
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-300 transform hover:-translate-y-2',
        isUnique && 'p-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 shadow-lg hover:shadow-2xl',
        className
      )}
    >
      <Card
        variant="default"
        hover
        className={cn(
          'overflow-hidden group cursor-pointer',
          viewMode === 'list' && 'flex',
          isUnique && 'bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20',
          !isUnique && 'border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 bg-white dark:bg-gray-800'
        )}
        onClick={handleClick}
        style={isUnique ? {
          boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.2), 0 10px 10px -5px rgba(34, 197, 94, 0.05)'
        } : {}}
      >
        {/* Product Image */}
        <div
          className={cn(
            'relative overflow-hidden bg-gradient-to-br from-[#004e6c]/10 dark:from-gray-700/20 to-[#006b8f]/10 dark:to-gray-600/20',
            viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'h-48',
            isUnique && 'bg-gradient-to-br from-green-50 dark:from-green-900/20 to-emerald-50 dark:to-emerald-900/20'
          )}
        >
          <img
            src={product.image || '/placeholder.png'}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          
          {/* Unique Badge */}
          {isUnique && (
            <div className="absolute top-3 left-3 z-10">
              <div className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full shadow-lg flex items-center space-x-1 animate-pulse">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs font-bold">UNIQUE</span>
              </div>
            </div>
          )}

          {/* Wishlist and Rating */}
          <div className={cn('absolute flex items-center space-x-2', isUnique ? 'top-12 right-3' : 'top-3 right-3')}>
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-1.5 rounded-full shadow-lg">
              <WishlistHeartIcon productId={productId} size="sm" />
            </div>
            {product.rating !== undefined && (
              <div className="flex items-center space-x-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg">
                <span className="text-yellow-400 text-sm">⭐</span>
                <span className="text-xs font-semibold text-[#004e6c] dark:text-gray-200">
                  {parseFloat(String(product.rating)) || 0}
                </span>
              </div>
            )}
          </div>

          {/* Category Badge */}
          <div className={cn('absolute', isUnique ? 'top-12 left-3' : 'top-3 left-3')}>
            <span className="text-xs font-bold text-white bg-primary-600 dark:bg-primary-500 px-3 py-1.5 rounded-full shadow-lg group-hover:bg-primary-700 dark:group-hover:bg-primary-600 transition-colors">
              {getCategoryName(product)}
            </span>
          </div>
        </div>

        {/* Product Info */}
        <div className={cn('p-6', viewMode === 'list' && 'flex-1')}>
          <h4
            className={cn(
              'text-lg font-semibold mb-3 line-clamp-2 transition-colors',
                isUnique
                  ? 'text-green-900 dark:text-green-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                  : 'text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400'
            )}
          >
            {product.title}
          </h4>
          
          <div className="flex items-center justify-between text-sm text-[#004e6c]/70 dark:text-gray-400 mb-4 font-medium">
            <span className="flex items-center space-x-1">
              <span>📄</span>
              <span>{product.pages ? `${product.pages} хуудас` : product.size || 'N/A'}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>⬇️</span>
              <span>{formatNumber(product.downloads || 0)}</span>
            </span>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t-2 border-[#004e6c]/10 dark:border-gray-700 gap-3">
            <span
              className={cn(
                'text-lg font-bold',
                isUnique ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
              )}
            >
              {formatNumber(parseFloat(String(product.price)) || 0)}₮
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className={cn(
                'px-3 py-1.5 rounded-xl transition-all text-xs font-semibold shadow-md hover:shadow-lg transform hover:scale-105',
                isUnique
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                  : 'bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-500 dark:to-primary-600 text-white hover:from-primary-700 hover:to-primary-600 dark:hover:from-primary-600 dark:hover:to-primary-700'
              )}
            >
              Дэлгэрэнгүй
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

