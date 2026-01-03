"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Plus, Edit, Eye, Trash, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";

// Types matching backend Product model
type Product = {
  id: string;
  title: string;
  description: string | null;
  categoryId: number;
  subcategoryId: number | null;
  authorId: number;
  price: number;
  image: string | null;
  previewImages: string[] | null;
  fileUrl: string | null;
  fileType: string | null;
  fileSize: string | null;
  pages: number | null;
  size: string | null;
  tags: string[] | null;
  rating: number;
  views: number;
  downloads: number;
  income: number;
  isDiploma: boolean;
  isActive: boolean;
  isUnique: boolean;
  status: 'new' | 'published' | 'cancelled' | 'deleted';
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
    icon: string | null;
  };
  author?: {
    id: number;
    username: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
  };
  subcategory?: {
    id: number;
    name: string;
  } | null;
};

type Category = {
  id: number;
  name: string;
  icon: string | null;
  description: string | null;
  isActive: boolean;
  subcategories?: Subcategory[];
};

type Subcategory = {
  id: number;
  name: string;
  categoryId: number;
  isActive: boolean;
};

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api`;

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Textarea component
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

// Alert component
const Alert = ({ 
  children, 
  variant = "default",
  className = ""
}: { 
  children: React.ReactNode; 
  variant?: "default" | "destructive";
  className?: string;
}) => {
  const variants = {
    default: "bg-blue-50 border-blue-200 text-blue-800",
    destructive: "bg-red-50 border-red-200 text-red-800"
  };

  return (
    <div className={`border rounded-md p-4 ${variants[variant]} ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="h-4 w-4 mr-3 mt-0.5" />
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
};

// Product Edit Form Component
interface ProductEditFormProps {
  product: Product;
  onCancel: () => void;
  onSave: (product: Partial<Product> | FormData) => Promise<void>;
  isCreating: boolean;
  categories: Category[];
}

function ProductEditForm({ product, onCancel, onSave, isCreating, categories }: ProductEditFormProps) {
  const [form, setForm] = useState<Partial<Product>>({ ...product });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>(Array.isArray(product.previewImages) ? product.previewImages : []);
  const [newPreviewImages, setNewPreviewImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Update previewImages when product changes
  useEffect(() => {
    if (product.previewImages) {
      setPreviewImages(Array.isArray(product.previewImages) ? product.previewImages : []);
    }
  }, [product.previewImages]);

  // Check if user is admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setIsAdmin(user.role === 'admin');
        } catch {
          setIsAdmin(false);
        }
      }
    }
  }, []);

  const updateField = <K extends keyof Product>(key: K, value: Product[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handlePreviewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setNewPreviewImages(prev => [...prev, ...files]);
    }
  };

  const removePreviewImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewPreviewImage = (index: number) => {
    setNewPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setUploadingImages(true);

      // If there are new images to upload, use FormData
      if (newPreviewImages.length > 0) {
        const formData = new FormData();
        
        // Add all form fields (excluding previewImages - we'll handle it separately)
        Object.keys(form).forEach(key => {
          const value = form[key as keyof Product];
          if (value !== null && value !== undefined && key !== 'previewImages') {
            if (key === 'tags') {
              // Handle arrays
              formData.append(key, JSON.stringify(value));
            } else if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        });
        
        // Add existing preview images as JSON (only once)
        // The backend will merge these with newly uploaded images
        formData.append('previewImages', JSON.stringify(previewImages));
        
        // Add new preview images as files
        newPreviewImages.forEach((file) => {
          formData.append('previewImages', file);
        });

        await onSave(formData);
        
        // Reset new images after successful save
        setNewPreviewImages([]);
      } else {
        // No new images, just update with previewImages array
        const updatedForm = {
          ...form,
          previewImages: previewImages
        };
        await onSave(updatedForm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  // Get subcategories for selected category
  const selectedCategory = categories.find(c => c.id === form.categoryId);
  const availableSubcategories = selectedCategory?.subcategories || [];

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">{error}</Alert>
      )}

      {/* Author Information Section */}
      {product.author && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Зохиогчийн мэдээлэл</h3>
          <div className={`grid gap-4 ${product.author.phone ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div>
              <label className="text-xs text-blue-700 dark:text-blue-300 block mb-1">Нэр</label>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {product.author.fullName || product.author.username || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-xs text-blue-700 dark:text-blue-300 block mb-1">Имэйл</label>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {product.author.email || 'N/A'}
              </p>
            </div>
            {product.author.phone && (
              <div>
                <label className="text-xs text-blue-700 dark:text-blue-300 block mb-1">Утас</label>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {product.author.phone}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Гарчиг</label>
          <Input 
            value={form.title || ''} 
            onChange={(e) => updateField('title', e.target.value)} 
            placeholder="Барааны гарчиг"
            disabled={saving}
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Ангилал</label>
          <Select 
            value={form.categoryId?.toString() || ''} 
            onValueChange={(value) => {
              updateField('categoryId', parseInt(value));
              updateField('subcategoryId', null); // Reset subcategory when category changes
            }}
            disabled={saving}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ангилал сонгох" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {availableSubcategories.length > 0 && (
        <div>
          <label className="text-sm font-medium block mb-1">Дэд ангилал</label>
          <Select 
            value={form.subcategoryId?.toString() || 'none'} 
            onValueChange={(value) => {
              if (value === 'none') {
                updateField('subcategoryId', null);
              } else {
                updateField('subcategoryId', parseInt(value));
              }
            }}
            disabled={saving}
          >
            <SelectTrigger>
              <SelectValue placeholder="Дэд ангилал сонгох (сонголттой)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Дэд ангилалгүй</SelectItem>
              {availableSubcategories.map((sub) => (
                <SelectItem key={sub.id} value={sub.id.toString()}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Үнэ (₮)</label>
          <Input 
            type="number" 
            value={form.price || 0} 
            onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)} 
            placeholder="0"
            min="0"
            step="0.01"
            disabled={saving}
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Хуудас</label>
          <Input 
            type="number" 
            value={form.pages || ''} 
            onChange={(e) => updateField('pages', e.target.value ? parseInt(e.target.value) : null)} 
            placeholder="Хуудасны тоо"
            min="0"
            disabled={saving}
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Хэмжээ</label>
          <Input 
            value={form.size || ''} 
            onChange={(e) => updateField('size', e.target.value || null)} 
            placeholder="Жишээ: 2.5 GB"
            disabled={saving}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Тайлбар</label>
        <Textarea 
          value={form.description || ''} 
          onChange={(e) => updateField('description', e.target.value || null)} 
          placeholder="Барааны тайлбар"
          rows={4}
          disabled={saving}
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Зурагны URL</label>
        <Input 
          value={form.image || ''} 
          onChange={(e) => updateField('image', e.target.value || null)} 
          placeholder="https://example.com/image.jpg"
          disabled={saving}
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Preview Зургууд (Олон зураг)</label>
        <div className="space-y-4">
          {/* Existing Preview Images */}
          {previewImages.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Одоогийн preview зургууд:</p>
              <div className="grid grid-cols-4 gap-3">
                {previewImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePreviewImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={saving}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Preview Images (not yet uploaded) */}
          {newPreviewImages.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Шинээр нэмэгдсэн зургууд (хадгалахад upload хийгдэнэ):</p>
              <div className="grid grid-cols-4 gap-3">
                {newPreviewImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewPreviewImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={saving}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Plus className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">Зураг сонгох</span> эсвэл чирж тавих
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF хэлбэрээр (10MB хүртэл)</p>
              </div>
              <input
                type="file"
                className="hidden"
                multiple
                accept="image/*"
                onChange={handlePreviewImageUpload}
                disabled={saving || uploadingImages}
              />
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Файлын URL (Cloudinary)</label>
        <div className="flex items-center gap-2">
          <Input 
            value={form.fileUrl || (form as any).cloudinaryFileUrl || ''} 
            onChange={(e) => updateField('fileUrl', e.target.value || null)} 
            placeholder="https://res.cloudinary.com/..."
            disabled={saving}
            className="flex-1"
          />
          {(form.fileUrl || (form as any).cloudinaryFileUrl) && (() => {
            // Use fileUrl if available, otherwise use cloudinaryFileUrl
            const fileUrl = form.fileUrl || (form as any).cloudinaryFileUrl || '';
            try {
              // Extract filename from URL query parameter or use fileType to construct filename
              const url = new URL(fileUrl);
              const filenameParam = url.searchParams.get('filename');
              const filename = filenameParam || (form.fileType ? `file.${form.fileType}` : 'download.zip');
              
              // Use admin download endpoint instead of direct Cloudinary URL
              const productId = (form as any).id || product.id;
              const downloadUrl = `${API_URL}/admin/products/${productId}/download`;
              
              const handleDownload = async (e: React.MouseEvent) => {
                e.preventDefault();
                const token = getAuthToken();
                if (!token) {
                  alert('Нэвтрэх шаардлагатай');
                  return;
                }
                
                try {
                  const response = await fetch(downloadUrl, {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  
                  if (!response.ok) {
                    throw new Error(`Download failed: ${response.status}`);
                  }
                  
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (error) {
                  console.error('Download error:', error);
                  alert('Файл татахад алдаа гарлаа');
                }
              };
              
              return (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  title={`Файл татаж авах: ${filename}`}
                  disabled={saving}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              );
            } catch (e) {
              // If URL parsing fails, still show download button using admin endpoint
              const productId = (form as any).id || product.id;
              const downloadUrl = `${API_URL}/admin/products/${productId}/download`;
              
              const handleDownload = async (e: React.MouseEvent) => {
                e.preventDefault();
                const token = getAuthToken();
                if (!token) {
                  alert('Нэвтрэх шаардлагатай');
                  return;
                }
                
                try {
                  const response = await fetch(downloadUrl, {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  
                  if (!response.ok) {
                    throw new Error(`Download failed: ${response.status}`);
                  }
                  
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = form.fileType ? `file.${form.fileType}` : 'download';
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (error) {
                  console.error('Download error:', error);
                  alert('Файл татахад алдаа гарлаа');
                }
              };
              
              return (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  title="Файл татаж авах"
                  disabled={saving}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              );
            }
          })()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Файлын төрөл</label>
          <Input 
            value={form.fileType || ''} 
            onChange={(e) => updateField('fileType', e.target.value || null)} 
            placeholder="PDF, DOCX, EXE, гэх мэт"
            disabled={saving}
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Файлын хэмжээ</label>
          <Input 
            value={form.fileSize || ''} 
            onChange={(e) => updateField('fileSize', e.target.value || null)} 
            placeholder="2.5 MB"
            disabled={saving}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Тэмдэглэгээ (таслалаар тусгаарлана)</label>
        <Input 
          value={(form.tags || []).join(', ')} 
          onChange={(e) => {
            const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
            updateField('tags', tags.length > 0 ? tags : null);
          }} 
          placeholder="tag1, tag2, tag3"
          disabled={saving}
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Статус</label>
        <Select 
          value={form.status || 'new'}
          onValueChange={(value) => {
            updateField('status', value as 'new' | 'published' | 'cancelled' | 'deleted');
          }}
          disabled={saving}
        >
          <SelectTrigger>
            <SelectValue placeholder="Статус сонгох" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isAdmin && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isUnique"
            checked={form.isUnique || false}
            onChange={(e) => updateField('isUnique', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={saving}
          />
          <label htmlFor="isUnique" className="text-sm font-medium">
            Unique product (2000₮ төлбөртэй)
          </label>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Цуцлах
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            isCreating ? "Үүсгэх" : "Хадгалах"
          )}
        </Button>
      </div>
    </div>
  );
}

// Drawer Component
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-6xl bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-2xl transform transition-transform border-l border-gray-200 dark:border-gray-700">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden bg-white/50 dark:bg-gray-900/50">
            <div className="h-full overflow-y-auto p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Main Component
export default function AdminProductList() {
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [isPurchaseHistoryOpen, setIsPurchaseHistoryOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [purchaseHistoryLoading, setPurchaseHistoryLoading] = useState(false);
  const [purchaseHistoryPagination, setPurchaseHistoryPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [selectedProductTitle, setSelectedProductTitle] = useState<string>('');
  const [selectedProductIncome, setSelectedProductIncome] = useState<number>(0);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when pathname changes
  }, [pathname]);

  useEffect(() => {
    fetchProducts(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pathname]);

  // Debounce search query - reset to page 1 when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async (page: number = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get status from URL path
      let statusParam = '';
      if (pathname?.includes('/new')) {
        statusParam = 'status=new';
      } else if (pathname?.includes('/all')) {
        statusParam = 'status=published';
      } else if (pathname?.includes('/cancelled')) {
        statusParam = 'status=cancelled';
      } else if (pathname?.includes('/deleted')) {
        statusParam = 'status=deleted';
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', itemsPerPage.toString());
      if (statusParam) {
        params.append(statusParam.split('=')[0], statusParam.split('=')[1]);
      }
      if (query) {
        params.append('search', query);
      }
      
      const response = await fetch(`${API_URL}/admin/products?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Нэвтрэх шаардлагатай');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Normalize products to ensure rating is always a number
      const normalizedProducts = (data.products || []).map((product: any) => ({
        ...product,
        rating: product.rating != null ? Number(product.rating) || 0 : 0
      }));
      setProducts(normalizedProducts);
      
      // Store pagination info
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Барааны мэдээлэл авахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/categories`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const createProduct = async (productData: Partial<Product>) => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`);
      }

      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err instanceof Error ? err.message : 'Бараа үүсгэхэд алдаа гарлаа');
      throw err;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const response = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`);
      }

      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err instanceof Error ? err.message : 'Бараа засахдаа алдаа гарлаа');
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err instanceof Error ? err.message : 'Бараа устгахад алдаа гарлаа');
      return false;
    }
  };

  // Search is now handled by API, but we can still filter client-side if needed
  const filtered = products;

  function handleView(product: Product) {
    setSelected(product);
    setIsViewOpen(true);
  }

  function handleEdit(product: Product) {
    setSelected(product);
    setIsCreating(false);
    setIsEditOpen(true);
  }

  function handleDelete(product: Product) {
    setSelected(product);
    setIsDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!selected) return;

    const success = await deleteProduct(selected.id);
    if (success) {
      setIsDeleteOpen(false);
      setSelected(null);
    }
  }

  async function saveEdit(edited: Partial<Product> | FormData) {
    try {
      if (isCreating) {
        await createProduct(edited as Partial<Product>);
        setIsEditOpen(false);
        setSelected(null);
        setIsCreating(false);
      } else {
        if (!selected) return;
        // If it's FormData, handle it directly
        if (edited instanceof FormData) {
          const token = getAuthToken();
          const response = await fetch(`${API_URL}/admin/products/${selected.id}`, {
            method: 'PUT',
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: edited
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`);
          }

          await fetchProducts();
        } else {
          await updateProduct(selected.id, edited as Partial<Product>);
        }
        setIsEditOpen(false);
        setSelected(null);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      // Error is already set by create/update functions
      throw error;
    }
  }

  const handleViewIncome = async (productId: string) => {
    try {
      setSelectedProductId(productId);
      setIsPurchaseHistoryOpen(true);
      setPurchaseHistoryLoading(true);
      
      // Find product to get title
      const product = products.find(p => p.id === productId);
      if (product) {
        setSelectedProductTitle(product.title);
        setSelectedProductIncome(product.income || 0);
      }
      
      const response = await fetch(`${API_URL}/admin/products/${productId}/purchases?page=1&limit=20`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchase history');
      }
      
      const data = await response.json();
      setPurchaseHistory(data.orders || []);
      setPurchaseHistoryPagination(data.pagination || null);
      if (data.product) {
        setSelectedProductTitle(data.product.title);
        setSelectedProductIncome(data.product.totalIncome || 0);
      }
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      setError('Орлогын түүх авахад алдаа гарлаа');
    } finally {
      setPurchaseHistoryLoading(false);
    }
  };

  function addProduct() {
    const newProduct: Partial<Product> = { 
      title: "Шинэ бараа", 
      description: null,
      categoryId: categories[0]?.id || 0,
      subcategoryId: null,
      price: 0,
      image: null,
      previewImages: null,
      fileUrl: null,
      fileType: null,
      fileSize: null,
      pages: null,
      size: null,
      tags: null,
      rating: 0,
      views: 0,
      downloads: 0,
      income: 0,
      isDiploma: false,
      isActive: true,
      status: 'new',
    };
    setSelected(newProduct as Product);
    setIsCreating(true);
    setIsEditOpen(true);
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('mn-MN').format(price) + '₮';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="mt-4 text-gray-600">Барааны мэдээлэл уншиж байна...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">
            {pathname?.includes('/new') ? 'Шинэ бараа' :
             pathname?.includes('/cancelled') ? 'Цуцлагдсан бараа' :
             pathname?.includes('/deleted') ? 'Устгагдсан бараа' :
             'Бүх бараа'}
          </h2>
          <span className="text-sm text-gray-500">Барааны мэдээллийг удирдах</span>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Барааны нэрээр хайх..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1); // Reset to first page when search changes
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                fetchProducts(1);
              }
            }}
            className="w-72"
          />
          <Button onClick={addProduct} variant="default" className="flex items-center gap-2">
            <Plus size={16} /> Шинэ бараа
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Барааны жагсаалт</span>
            <span className="text-sm text-gray-500">{filtered.length} ширхэг</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Гарчиг</TableHead>
                <TableHead className="w-32">Зохиогч</TableHead>
                <TableHead className="w-28">Үнэ</TableHead>
                <TableHead className="w-28">Орлого</TableHead>
                <TableHead className="w-24">Утас</TableHead>
                <TableHead className="w-24">Үзсэн</TableHead>
                <TableHead className="w-24">Татаж авсан</TableHead>
                <TableHead className="w-32">Үүсгэсэн огноо</TableHead>
                <TableHead className="w-32">Төлөв</TableHead>
                <TableHead className="w-48 text-right">Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div>
                      <div className="font-medium">{p.title}</div>
                      {p.description && (
                        <div className="text-sm text-gray-500 truncate max-w-md">
                          {p.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {p.author ? (
                      <span className="text-sm">{p.author.fullName || p.author.username || '-'}</span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatPrice(p.price)}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleViewIncome(p.id)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      title="Орлогын түүхийг харах"
                    >
                      {formatPrice(p.income || 0)}
                    </button>
                  </TableCell>
                  <TableCell>
                    {p.author?.phone ? (
                      <span className="text-sm">{p.author.phone}</span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{p.views}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{p.downloads}</span>
                  </TableCell>
                  <TableCell>
                    {p.createdAt ? (
                      <span className="text-sm text-gray-600">
                        {new Date(p.createdAt).toLocaleDateString('mn-MN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {p.status === 'new' && (
                        <Badge variant="default" className="w-fit bg-blue-500">New</Badge>
                      )}
                      {p.status === 'published' && (
                        <Badge variant="default" className="w-fit bg-green-500">Published</Badge>
                      )}
                      {p.status === 'cancelled' && (
                        <Badge variant="destructive" className="w-fit bg-orange-500">Cancelled</Badge>
                      )}
                      {p.status === 'deleted' && (
                        <Badge variant="destructive" className="w-fit bg-red-600">Deleted</Badge>
                      )}
                      {p.isActive ? (
                        <Badge variant="default" className="w-fit">Идэвхтэй</Badge>
                      ) : (
                        <Badge variant="destructive" className="w-fit">Идэвхгүй</Badge>
                      )}
                      {p.isDiploma && (
                        <Badge variant="outline" className="w-fit text-xs bg-purple-50 text-purple-700 border-purple-200">
                          Дипломын ажил
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-end">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleView(p)} 
                        className="hover:shadow-md"
                      >
                        <Eye size={14} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEdit(p)} 
                        className="hover:shadow-md"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDelete(p)} 
                        className="hover:shadow-md text-red-600"
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-sm text-gray-500">
                    {query ? "Хайлтын үр дүнд бараа олдсонгүй." : "Бараа олдсонгүй."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-gray-600">
                Нийт {pagination.total} бараа, {pagination.page}/{pagination.totalPages} хуудас
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
                disabled={loading}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Барааны дэлгэрэнгүй</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {selected ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Үндсэн мэдээлэл</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Гарчиг:</span>
                        <span className="font-medium">{selected.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ангилал:</span>
                        <span>
                          {selected.category ? (
                            <span>{selected.category.icon} {selected.category.name}</span>
                          ) : (
                            "-"
                          )}
                        </span>
                      </div>
                      {selected.subcategory && (
                        <div className="flex justify-between">
                          <span>Дэд ангилал:</span>
                          <span>{selected.subcategory.name}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Үнэ:</span>
                        <span className="font-medium">{formatPrice(selected.price)}</span>
                      </div>
                      {selected.pages && (
                        <div className="flex justify-between">
                          <span>Хуудас:</span>
                          <span>{selected.pages}</span>
                        </div>
                      )}
                      {selected.size && (
                        <div className="flex justify-between">
                          <span>Хэмжээ:</span>
                          <span>{selected.size}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Статистик</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Үзсэн:</span>
                        <span>{selected.views}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Татаж авсан:</span>
                        <span>{selected.downloads}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Үнэлгээ:</span>
                        <span>{selected.rating != null ? Number(selected.rating).toFixed(1) : '0.0'} / 5.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Статус:</span>
                        <span>
                          {selected.status === 'new' && (
                            <Badge variant="default" className="text-xs bg-blue-500">New</Badge>
                          )}
                          {selected.status === 'published' && (
                            <Badge variant="default" className="text-xs bg-green-500">Published</Badge>
                          )}
                          {selected.status === 'cancelled' && (
                            <Badge variant="destructive" className="text-xs bg-orange-500">Cancelled</Badge>
                          )}
                          {selected.status === 'deleted' && (
                            <Badge variant="destructive" className="text-xs bg-red-600">Deleted</Badge>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Төлөв:</span>
                        <span>
                          {selected.isActive ? (
                            <Badge variant="default" className="text-xs">Идэвхтэй</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">Идэвхгүй</Badge>
                          )}
                        </span>
                      </div>
                      {selected.isDiploma && (
                        <div className="flex justify-between">
                          <span>Төрөл:</span>
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                            Дипломын ажил
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selected.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Тайлбар</h4>
                    <p className="text-sm text-gray-700">{selected.description}</p>
                  </div>
                )}

                {selected.tags && selected.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Тэмдэглэгээ</h4>
                    <div className="flex flex-wrap gap-2">
                      {selected.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selected.image && (
                  <div>
                    <h4 className="font-semibold mb-2">Зураг</h4>
                    <img
                      src={selected.image}
                      alt={selected.title}
                      className="w-full max-w-md h-auto rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {selected.author && (
                  <div>
                    <h4 className="font-semibold mb-2">Зохиогч</h4>
                    <div className="text-sm">
                      <span>{selected.author.fullName || selected.author.username}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>Ачааллаж байна...</div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>Хаах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Create Drawer */}
      <Drawer 
        isOpen={isEditOpen} 
        onClose={() => {
          setIsEditOpen(false);
          setSelected(null);
          setIsCreating(false);
        }}
        title={isCreating ? "Шинэ бараа үүсгэх" : "Бараа засах"}
      >
        {selected && (
          <ProductEditForm 
            product={selected} 
            onCancel={() => {
              setIsEditOpen(false);
              setSelected(null);
              setIsCreating(false);
            }} 
            onSave={saveEdit}
            isCreating={isCreating}
            categories={categories}
          />
        )}
      </Drawer>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Бараа устгах уу?</DialogTitle>
            <DialogDescription>
              Энэ үйлдлийг буцаах боломжгүй.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            Та <strong>"{selected?.title}"</strong> барааг устгахдаа итгэлтэй байна уу?
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Цуцлах</Button>
              <Button variant="destructive" onClick={confirmDelete}>Устгах</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase History Modal */}
      <Dialog open={isPurchaseHistoryOpen} onOpenChange={setIsPurchaseHistoryOpen}>
  <DialogContent className="max-w-[98vw] w-[98vw] max-h-[90vh] overflow-y-auto sm:max-w-[95vw] sm:w-[95vw]">
    <DialogHeader>
      <DialogTitle className="text-xl">Орлогын түүх: {selectedProductTitle}</DialogTitle>
      <DialogDescription className="text-base">
        Нийт орлого: <span className="font-semibold text-green-600">{formatPrice(selectedProductIncome)}</span>
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {purchaseHistoryLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : purchaseHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Худалдан авалтын түүх олдсонгүй
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base min-w-[180px]">Огноо</TableHead>
                <TableHead className="text-base min-w-[200px]">Худалдан авагч</TableHead>
                <TableHead className="text-base min-w-[140px]">Утас</TableHead>
                <TableHead className="text-base min-w-[150px]">Төлбөрийн арга</TableHead>
                <TableHead className="text-base text-right min-w-[140px]">Дүн</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseHistory.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <span className="text-base">
                      {new Date(order.createdAt).toLocaleDateString('mn-MN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-base">
                      {(() => {
                        // If user has Gmail email, show full name, otherwise show "Хэрэглэгч"
                        if (order.user?.email && order.user.email.endsWith('@gmail.com')) {
                          return order.user?.fullName || order.user?.username || 'Хэрэглэгч';
                        }
                        return 'Хэрэглэгч';
                      })()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-base">
                      {order.user?.phone || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {order.paymentMethod === 'qpay' ? 'QPay' : 
                       order.paymentMethod === 'bank' ? 'Банк' : 'Бусад'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-base">
                    {formatPrice(parseFloat(order.amount))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {purchaseHistoryPagination && purchaseHistoryPagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-base text-gray-600">
                Нийт {purchaseHistoryPagination.total} худалдан авалт
              </div>
              <Pagination
                currentPage={purchaseHistoryPagination.page}
                totalPages={purchaseHistoryPagination.totalPages}
                onPageChange={(page) => {
                  // Fetch next page
                  if (selectedProductId) {
                    fetch(`${API_URL}/admin/products/${selectedProductId}/purchases?page=${page}&limit=20`, {
                      headers: getAuthHeaders()
                    })
                      .then(res => res.json())
                      .then(data => {
                        setPurchaseHistory(data.orders || []);
                        setPurchaseHistoryPagination(data.pagination || null);
                      })
                      .catch(err => console.error('Error fetching purchase history:', err));
                  }
                }}
                disabled={purchaseHistoryLoading}
              />
            </div>
          )}
        </div>
      )}
    </div>
    <DialogFooter>
      <Button onClick={() => setIsPurchaseHistoryOpen(false)} className="px-6 py-2 text-base">Хаах</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
}
