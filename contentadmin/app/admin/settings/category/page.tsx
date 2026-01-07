"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, Trash2, Plus, Loader2, Search, FolderOpen } from "lucide-react";
import { categoriesApi } from "@/lib/api";

// Category type based on your API
export interface CategoryData {
  id: number;
  name: string;
  icon?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subcategories?: SubcategoryData[];
}

export interface SubcategoryData {
  id: number;
  name: string;
  categoryId: number;
  description?: string | null;
  isActive: boolean;
}

// Category Form Component
function CategoryForm({
  category,
  onSubmit,
  onCancel,
  isLoading
}: {
  category?: CategoryData;
  onSubmit: (categoryData: Omit<CategoryData, "id" | "createdAt" | "updatedAt" | "subcategories">) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<Omit<CategoryData, "id" | "createdAt" | "updatedAt" | "subcategories">>({
    name: category?.name || "",
    icon: category?.icon || "",
    description: category?.description || "",
    isActive: category?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Ангиллын нэр *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({...form, name: e.target.value})}
          placeholder="Жишээ: ХИЧЭЭЛ, СУРЛАГА"
          required
        />
      </div>

      <div>
        <Label htmlFor="icon">Икон (emoji)</Label>
        <Input
          id="icon"
          value={form.icon || ""}
          onChange={(e) => setForm({...form, icon: e.target.value})}
          placeholder="Жишээ: 📚"
          maxLength={10}
        />
      </div>

      <div>
        <Label htmlFor="description">Тайлбар</Label>
        <Textarea
          id="description"
          value={form.description || ""}
          onChange={(e) => setForm({...form, description: e.target.value})}
          placeholder="Ангиллын тайлбар..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={form.isActive}
          onChange={(e) => setForm({...form, isActive: e.target.checked})}
          className="rounded border-gray-300"
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          Идэвхтэй
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Цуцлах
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            category ? "Хадгалах" : "Үүсгэх"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function CategoryPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, categoryId?: number}>({open: false});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await categoriesApi.getAllAdmin();
      
      if (result.categories && Array.isArray(result.categories)) {
        setCategories(result.categories);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Create category via API
  const createCategory = async (categoryData: Omit<CategoryData, "id" | "createdAt" | "updatedAt" | "subcategories">) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await categoriesApi.create({
        name: categoryData.name,
        icon: categoryData.icon || undefined,
        description: categoryData.description || undefined,
        isActive: categoryData.isActive,
      });

      setSuccess('Ангилал амжилттай үүслээ');
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Update category via API
  const updateCategory = async (categoryData: Omit<CategoryData, "id" | "createdAt" | "updatedAt" | "subcategories">) => {
    if (!editingCategory) return;

    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await categoriesApi.update(editingCategory.id, {
        name: categoryData.name,
        icon: categoryData.icon || undefined,
        description: categoryData.description || undefined,
        isActive: categoryData.isActive,
      });

      setSuccess('Ангилал амжилттай шинэчлэгдлээ');
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Delete category via API
  const deleteCategory = async (id: number) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await categoriesApi.delete(id);
      
      setSuccess('Ангилал амжилттай устгагдлаа');
      setDeleteDialog({open: false, categoryId: undefined});
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ангилал устгахад алдаа гарлаа';
      setError(errorMessage);
      // Keep dialog open on error so user can see the error message
    } finally {
      setIsFormLoading(false);
    }
  };

  // Filter categories
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && category.isActive) ||
                         (statusFilter === "inactive" && !category.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ангиллууд</h1>
          <p className="text-gray-500 mt-1">Ангиллуудыг удирдах</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Шинэ ангилал
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <p className="text-green-800">{success}</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">Бүх статус</option>
              <option value="active">Идэвхтэй</option>
              <option value="inactive">Идэвхгүй</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </CardContent>
        </Card>
      ) : filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Ангилал олдсонгүй</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    {category.icon && (
                      <span className="text-2xl">{category.icon}</span>
                    )}
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {category.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {category.description}
                  </p>
                )}
                {category.subcategories && category.subcategories.length > 0 && (
                  <p className="text-xs text-gray-500 mb-4">
                    {category.subcategories.length} дэд ангилал
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCategory(category);
                      setShowForm(false);
                    }}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Засах
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteDialog({open: true, categoryId: category.id})}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Устгах
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm || editingCategory !== null} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditingCategory(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Ангилал засах" : "Шинэ ангилал үүсгэх"}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editingCategory || undefined}
            onSubmit={editingCategory ? updateCategory : createCategory}
            onCancel={() => {
              setShowForm(false);
              setEditingCategory(null);
            }}
            isLoading={isFormLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ангилал устгах</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Та энэ ангиллыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({open: false})}
              disabled={isFormLoading}
            >
              Цуцлах
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialog.categoryId) {
                  deleteCategory(deleteDialog.categoryId);
                }
              }}
              disabled={isFormLoading}
            >
              {isFormLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Устгаж байна...
                </>
              ) : (
                "Устгах"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

