# Frontend Refactoring Documentation

## Overview
This document outlines the comprehensive refactoring of the Tbarimt frontend application to improve code quality, maintainability, and developer experience.

## Key Improvements

### 1. TypeScript Type System
- **Location**: `src/types/index.ts`
- **Improvements**:
  - Comprehensive type definitions for all entities (Product, Category, User, etc.)
  - Proper API response types
  - Request/Response type safety
  - Eliminated `any` types where possible

### 2. API Layer Refactoring
- **Location**: `src/lib/api/`
- **Improvements**:
  - Centralized API client (`client.ts`) with proper error handling
  - Modular API structure (products, categories, etc.)
  - Better error messages and status code handling
  - Automatic token management
  - Backward compatibility maintained

### 3. Reusable UI Components
- **Location**: `src/components/ui/`
- **Components Created**:
  - `Button` - Consistent button styling with variants
  - `Card` - Reusable card component
  - `Input` - Form input with label and error handling
  - `Modal` - Reusable modal component
  - `LoadingSpinner` - Loading states
  - `ErrorMessage` - Error display component
  - `ProductCard` - Product display card

### 4. Custom Hooks
- **Location**: `src/hooks/`
- **Hooks Created**:
  - `useApi` - Generic API hook for data fetching
  - `useAuth` - Authentication state management
  - Existing hooks maintained for compatibility

### 5. Utilities and Constants
- **Location**: `src/utils/` and `src/constants/`
- **Improvements**:
  - Centralized utility functions
  - Constants for configuration
  - Helper functions for formatting, validation, etc.
  - Reusable business logic

### 6. Error Handling
- **Location**: `src/components/ErrorBoundary.tsx`
- **Improvements**:
  - React Error Boundary implementation
  - Graceful error recovery
  - User-friendly error messages

## File Structure

```
src/
├── app/                    # Next.js app directory
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── index.ts
│   ├── ProductCard.tsx     # Product display component
│   └── ErrorBoundary.tsx    # Error boundary component
├── hooks/
│   ├── useApi.ts           # Generic API hook
│   ├── useAuth.ts          # Authentication hook
│   └── useDarkMode.ts      # Existing hook
├── lib/
│   └── api/
│       ├── client.ts       # API client
│       ├── products.ts     # Products API
│       └── index.ts        # Main API exports
├── types/
│   └── index.ts            # TypeScript types
├── utils/
│   └── index.ts            # Utility functions
└── constants/
    └── index.ts             # Constants and configuration
```

## Migration Guide

### Using New Components

**Before:**
```tsx
<button className="px-4 py-2 bg-blue-500 text-white rounded">
  Click me
</button>
```

**After:**
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md">
  Click me
</Button>
```

### Using New API Client

**Before:**
```tsx
const response = await fetchAPI('/products');
```

**After:**
```tsx
import { productsApi } from '@/lib/api';

const response = await productsApi.getProducts();
```

### Using Custom Hooks

**Before:**
```tsx
const [user, setUser] = useState(null);
useEffect(() => {
  // fetch user
}, []);
```

**After:**
```tsx
import { useAuth } from '@/hooks/useAuth';

const { user, isAuthenticated, isLoading } = useAuth();
```

## Best Practices

1. **Always use TypeScript types** - Import from `@/types`
2. **Use UI components** - Prefer components from `@/components/ui`
3. **Use custom hooks** - For data fetching and state management
4. **Centralize constants** - Use `@/constants` for configuration
5. **Use utility functions** - Import from `@/utils` for common operations
6. **Error handling** - Wrap components in ErrorBoundary
7. **Loading states** - Use LoadingSpinner component
8. **Type safety** - Avoid `any` types, use proper interfaces

## Next Steps

1. **Refactor large page components** - Break down into smaller components
2. **Implement React Query** - For better data fetching and caching
3. **Add unit tests** - For components and utilities
4. **Performance optimization** - Code splitting, lazy loading
5. **Accessibility** - Improve a11y compliance
6. **Documentation** - Add JSDoc comments to all functions

## Breaking Changes

None - All changes maintain backward compatibility. The old API functions are still available through the new structure.

## Dependencies

- Next.js 13.5.11
- React 18.2.0
- TypeScript 5.3.3
- Tailwind CSS 3.4.1

## Notes

- All existing functionality is preserved
- The refactoring is incremental and non-breaking
- Old code can be gradually migrated to new patterns
- New features should use the new structure

