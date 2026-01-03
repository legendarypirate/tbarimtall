'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getProducts } from '@/lib/api'

export const dynamic = 'force-dynamic'

// Default products data (fallback)
const defaultProducts = [
  {
    id: 1,
    title: 'Монгол улсын эдийн засгийн хөгжил',
    category: 'Реферат',
    price: 15000,
    pages: 25,
    downloads: 234,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop',
    createdAt: '2024-01-15'
  },
  {
    id: 2,
    title: 'Компьютерийн сүлжээний аюулгүй байдал',
    category: 'Дипломын ажил',
    price: 45000,
    pages: 80,
    downloads: 156,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
    createdAt: '2024-02-10'
  },
  {
    id: 3,
    title: 'Action Adventure Game Pack',
    category: 'Тоглоом (EXE)',
    price: 25000,
    size: '2.5 GB',
    downloads: 892,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=250&fit=crop',
    createdAt: '2024-01-20'
  },
  {
    id: 4,
    title: 'Мэдээллийн системийн дизайн',
    category: 'Курсын ажил',
    price: 20000,
    pages: 35,
    downloads: 178,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
    createdAt: '2024-03-05'
  },
  {
    id: 5,
    title: 'Office Suite Pro 2024',
    category: 'Программ хангамж',
    price: 35000,
    size: '500 MB',
    downloads: 445,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
    createdAt: '2024-02-28'
  },
  {
    id: 6,
    title: 'Монгол хэлний утга зохиол',
    category: 'Реферат',
    price: 12000,
    pages: 20,
    downloads: 312,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop',
    createdAt: '2024-01-10'
  },
  {
    id: 7,
    title: 'Photoshop Template Collection',
    category: 'График дизайн',
    price: 18000,
    size: '150 MB',
    downloads: 567,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=250&fit=crop',
    createdAt: '2024-02-15'
  },
  {
    id: 8,
    title: 'Монголын түүх судлал',
    category: 'Реферат',
    price: 14000,
    pages: 28,
    downloads: 289,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop',
    createdAt: '2024-01-25'
  },
  {
    id: 9,
    title: 'AutoCAD 3D Modeling Tutorial',
    category: 'График дизайн',
    price: 28000,
    pages: 45,
    downloads: 234,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop',
    createdAt: '2024-03-12'
  },
  {
    id: 10,
    title: 'Монголын уламжлалт аялгуу',
    category: 'Дуу Хөгжим',
    price: 16000,
    size: '200 MB',
    downloads: 445,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop',
    createdAt: '2024-02-20'
  },
  {
    id: 11,
    title: 'Бизнес төлөвлөлтийн загвар',
    category: 'Баримт бичиг',
    price: 22000,
    pages: 30,
    downloads: 189,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop',
    createdAt: '2024-03-01'
  },
  {
    id: 12,
    title: 'Puzzle Game Collection',
    category: 'Тоглоом (EXE)',
    price: 19000,
    size: '800 MB',
    downloads: 678,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=250&fit=crop',
    createdAt: '2024-01-30'
  }
]

const categories = [
  'Бүгд',
  'Реферат',
  'Дипломын ажил',
  'Курсын ажил',
  'Тоглоом (EXE)',
  'Программ хангамж',
  'График дизайн',
  'Дуу Хөгжим',
  'Баримт бичиг'
]

const sortOptions = [
  { value: 'newest', label: 'Шинэ эхэнд' },
  { value: 'oldest', label: 'Хуучин эхэнд' },
  { value: 'price-low', label: 'Үнэ: Багаас их рүү' },
  { value: 'price-high', label: 'Үнэ: Ихээс бага руу' },
  { value: 'rating', label: 'Үнэлгээ: Өндөр' },
  { value: 'downloads', label: 'Эрэлт: Өндөр' }
]

export default function ProductsPage() {
  const router = useRouter()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Бүгд')
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(100000)
  const [minRating, setMinRating] = useState(0)
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [allProducts, setAllProducts] = useState(defaultProducts)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await getProducts({
          page: 1,
          limit: 100,
          sortBy
        })
        if (response.products) {
          setAllProducts(response.products)
          const maxPrice = Math.max(...response.products.map((p: any) => parseFloat(p.price) || 0))
          if (maxPrice > 0) {
            setMaxPrice(maxPrice)
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [sortBy])

  // Get max price from products
  const maxProductPrice = Math.max(...allProducts.map((p: any) => parseFloat(p.price) || 0), 100000)

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((p: any) => 
        p.title?.toLowerCase().includes(query) ||
        p.category?.name?.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (selectedCategory !== 'Бүгд') {
      filtered = filtered.filter((p: any) => p.category?.name === selectedCategory)
    }

    // Price filter
    filtered = filtered.filter((p: any) => {
      const price = parseFloat(p.price) || 0
      return price >= minPrice && price <= maxPrice
    })

    // Rating filter
    filtered = filtered.filter((p: any) => parseFloat(p.rating) >= minRating)

    // Sort
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        case 'price-low':
          return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
        case 'price-high':
          return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
        case 'rating':
          return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0)
        case 'downloads':
          return (b.downloads || 0) - (a.downloads || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [searchQuery, selectedCategory, minPrice, maxPrice, minRating, sortBy, allProducts])

  const formatNumber = (num: number) => {
    return num.toLocaleString('mn-MN')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Ачааллаж байна...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Нүүр</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Бүх контент
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Top Controls */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative group">
            {/* Animated background gradient */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity duration-300"></div>
            
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="flex items-center">
                {/* Search Icon */}
                <div className="pl-5 pr-4 flex items-center">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 shadow-md">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                {/* Input Field */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchQuery) {
                      // Trigger search if needed
                    }
                  }}
                  placeholder="Хайх... (жишээ: реферат, дипломын ажил, тоглоом)"
                  className="flex-1 py-4 text-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none pr-4"
                />
                
                {/* Clear Button */}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-2 mr-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                {/* Search Button */}
                <button
                  onClick={() => {
                    if (searchQuery) {
                      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
                    }
                  }}
                  disabled={!searchQuery}
                  className="m-1.5 px-6 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                >
                  <span>Хайх</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* View Mode and Sort */}
            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Филтер</span>
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
              {/* Price Range */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Үнэний муж: {formatNumber(minPrice)}₮ - {formatNumber(maxPrice)}₮
                  </label>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max={maxProductPrice}
                      value={minPrice}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="0"
                      max={maxProductPrice}
                      value={minPrice}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max={maxProductPrice}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="0"
                      max={maxProductPrice}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 block">
                  Хамгийн бага үнэлгээ: {minRating.toFixed(1)} ⭐
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>0</span>
                  <span>5</span>
                </div>
              </div>

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('Бүгд')
                  setMinPrice(0)
                  setMaxPrice(maxProductPrice)
                  setMinRating(0)
                  setSortBy('newest')
                }}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Филтерүүдийг цэвэрлэх
              </button>
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold">{filteredProducts.length}</span> бүтээгдэхүүн олдлоо
          </div>
        </div>

        {/* Products Grid/List */}
        {filteredProducts.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredProducts.map((product) => {
              const isUnique = (product as any).isUnique === true;
              return (
              <div
                key={product.id}
                className={`rounded-xl transition-all duration-300 transform hover:-translate-y-2 ${
                  isUnique 
                    ? 'p-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 shadow-lg hover:shadow-2xl' 
                    : ''
                }`}
              >
              <div
                onClick={() => router.push(`/products/${(product as any).uuid || (product as any).id}`)}
                className={`rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer ${
                  viewMode === 'list' ? 'flex' : ''
                } ${
                  isUnique 
                    ? 'bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30' 
                    : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
                style={isUnique ? {
                  boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.2), 0 10px 10px -5px rgba(34, 197, 94, 0.05)'
                } : {}}
              >
                {/* Product Image */}
                <div className={`relative overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 ${
                  viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'h-48'
                } ${isUnique ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' : ''}`}>
                  <img
                    src={(product as any).image || '/placeholder.png'}
                    alt={(product as any).title}
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
                  <div className="absolute top-3 right-3 flex items-center space-x-1 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full">
                    <span className="text-yellow-400 text-sm">⭐</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {parseFloat((product as any).rating) || 0}
                    </span>
                  </div>
                  <div className={`absolute ${isUnique ? 'top-12 left-3' : 'top-3 left-3'}`}>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-md">
                      {typeof (product as any).category === 'object' && (product as any).category?.name
                        ? (product as any).category.name
                        : typeof (product as any).category === 'string'
                        ? (product as any).category
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <h4 className={`text-lg font-semibold mb-3 line-clamp-2 transition-colors ${
                    isUnique 
                      ? 'text-green-900 dark:text-green-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400' 
                      : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
                  }`}>
                    {(product as any).title}
                  </h4>
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span className="flex items-center space-x-1">
                      <span>📄</span>
                      <span>{(product as any).pages ? `${(product as any).pages} хуудас` : (product as any).size || 'N/A'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>⬇️</span>
                      <span>{formatNumber((product as any).downloads || 0)}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
                    <span className={`text-lg font-bold ${
                      isUnique 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {formatNumber(parseFloat((product as any).price) || 0)}₮
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/products/${product.id}`)
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-all text-xs font-semibold shadow-md hover:shadow-lg transform hover:scale-105 ${
                        isUnique
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                      }`}
                    >
                      Дэлгэрэнгүй
                    </button>
                  </div>
                </div>
              </div>
              </div>
            );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Бүтээгдэхүүн олдсонгүй
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Филтерүүдийг өөрчлөөд дахин оролдоно уу
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('Бүгд')
                setMinPrice(0)
                setMaxPrice(maxProductPrice)
                setMinRating(0)
                setSortBy('newest')
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Бүх филтерүүдийг цэвэрлэх
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

