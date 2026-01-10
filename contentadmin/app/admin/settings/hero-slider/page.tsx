"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, Trash2, Plus, Loader2, Search, Image as ImageIcon, ArrowUp, ArrowDown } from "lucide-react";
import { heroSlidersApi } from "@/lib/api";

// Hero Slider type based on your API
export interface HeroSliderData {
  id: number;
  imageUrl: string;
  title?: string | null;
  subtitle?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Hero Slider Form Component
function HeroSliderForm({
  slider,
  onSubmit,
  onCancel,
  isLoading
}: {
  slider?: HeroSliderData;
  onSubmit: (sliderData: { image?: File; imageUrl?: string; title?: string; subtitle?: string; order: number; isActive: boolean }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<{ image?: File; imageUrl?: string; title?: string; subtitle?: string; order: number; isActive: boolean }>({
    imageUrl: slider?.imageUrl || "",
    title: slider?.title || "",
    subtitle: slider?.subtitle || "",
    order: slider?.order || 0,
    isActive: slider?.isActive ?? true,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(slider?.imageUrl || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({...form, image: file, imageUrl: undefined});
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="image">Зураг *</Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          required={!slider}
        />
        <p className="text-xs text-gray-500 mt-1">Зураг оруулах (JPG, PNG, GIF гэх мэт)</p>
        {(imagePreview || form.imageUrl) && (
          <div className="mt-2">
            <img 
              src={imagePreview || form.imageUrl} 
              alt="Preview" 
              className="w-full h-48 object-cover rounded-lg border border-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="title">Гарчиг (Title)</Label>
        <Input
          id="title"
          value={form.title || ""}
          onChange={(e) => setForm({...form, title: e.target.value})}
          placeholder="Слайдерын гарчиг (сонголттой)"
        />
      </div>

      <div>
        <Label htmlFor="subtitle">Дэд гарчиг (Subtitle)</Label>
        <Input
          id="subtitle"
          value={form.subtitle || ""}
          onChange={(e) => setForm({...form, subtitle: e.target.value})}
          placeholder="Слайдерын дэд гарчиг (сонголттой)"
        />
      </div>

      <div>
        <Label htmlFor="order">Дараалал</Label>
        <Input
          id="order"
          type="number"
          value={form.order}
          onChange={(e) => setForm({...form, order: parseInt(e.target.value) || 0})}
          placeholder="0"
        />
        <p className="text-xs text-gray-500 mt-1">Бага тоо эхэнд харагдана</p>
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
            slider ? "Хадгалах" : "Үүсгэх"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function HeroSliderManagePage() {
  const [sliders, setSliders] = useState<HeroSliderData[]>([]);
  const [editingSlider, setEditingSlider] = useState<HeroSliderData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, sliderId?: number}>({open: false});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch sliders from API
  const fetchSliders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await heroSlidersApi.getAllAdmin();
      
      if (result.sliders && Array.isArray(result.sliders)) {
        setSliders(result.sliders);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching hero sliders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch hero sliders');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sliders on component mount
  useEffect(() => {
    fetchSliders();
  }, []);

  // Create slider via API
  const createSlider = async (sliderData: { image?: File; imageUrl?: string; title?: string; subtitle?: string; order: number; isActive: boolean }) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await heroSlidersApi.create({
        image: sliderData.image,
        imageUrl: sliderData.imageUrl,
        title: sliderData.title || undefined,
        subtitle: sliderData.subtitle || undefined,
        order: sliderData.order,
        isActive: sliderData.isActive,
      });

      setSuccess('Hero слайдер амжилттай үүслээ');
      setShowForm(false);
      fetchSliders();
    } catch (err) {
      console.error('Error creating hero slider:', err);
      setError(err instanceof Error ? err.message : 'Failed to create hero slider');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Update slider via API
  const updateSlider = async (sliderData: { image?: File; imageUrl?: string; title?: string; subtitle?: string; order: number; isActive: boolean }) => {
    if (!editingSlider) return;

    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await heroSlidersApi.update(editingSlider.id, {
        image: sliderData.image,
        imageUrl: sliderData.imageUrl,
        title: sliderData.title || undefined,
        subtitle: sliderData.subtitle || undefined,
        order: sliderData.order,
        isActive: sliderData.isActive,
      });

      setSuccess('Hero слайдер амжилттай шинэчлэгдлээ');
      setEditingSlider(null);
      fetchSliders();
    } catch (err) {
      console.error('Error updating hero slider:', err);
      setError(err instanceof Error ? err.message : 'Failed to update hero slider');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Delete slider via API
  const deleteSlider = async (id: number) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await heroSlidersApi.delete(id);
      
      setSuccess('Hero слайдер амжилттай устгагдлаа');
      setDeleteDialog({open: false});
      fetchSliders();
    } catch (err) {
      console.error('Error deleting hero slider:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete hero slider');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Update slider order
  const updateSliderOrder = async (id: number, newOrder: number) => {
    try {
      const slider = sliders.find(s => s.id === id);
      if (!slider) return;

      await heroSlidersApi.update(id, { order: newOrder });
      fetchSliders();
    } catch (err) {
      console.error('Error updating slider order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update slider order');
    }
  };

  // Filter sliders
  const filteredSliders = sliders.filter(slider => {
    const matchesSearch = (slider.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (slider.subtitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         slider.imageUrl.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && slider.isActive) ||
                         (statusFilter === "inactive" && !slider.isActive);
    return matchesSearch && matchesStatus;
  });

  // Sort by order
  const sortedSliders = [...filteredSliders].sort((a, b) => a.order - b.order);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hero Слайдер удирдах</h1>
          <p className="text-gray-500 mt-1">Нүүр хуудасны hero слайдеруудыг удирдах</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Шинэ слайдер
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

      {/* Sliders List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </CardContent>
        </Card>
      ) : sortedSliders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Слайдер олдсонгүй</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedSliders.map((slider, index) => (
            <Card key={slider.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-500">#{slider.order}</span>
                    {slider.title && (
                      <CardTitle className="text-lg">{slider.title}</CardTitle>
                    )}
                  </div>
                  <Badge variant={slider.isActive ? "default" : "secondary"}>
                    {slider.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={slider.imageUrl}
                    alt={slider.title || "Hero Slider"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23ddd" width="400" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                {slider.subtitle && (
                  <p className="text-sm text-gray-600 mb-2 truncate">
                    {slider.subtitle}
                  </p>
                )}
                <div className="flex gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (index > 0) {
                        const prevSlider = sortedSliders[index - 1];
                        updateSliderOrder(slider.id, prevSlider.order);
                        updateSliderOrder(prevSlider.id, slider.order);
                      }
                    }}
                    disabled={index === 0}
                    className="flex-1"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (index < sortedSliders.length - 1) {
                        const nextSlider = sortedSliders[index + 1];
                        updateSliderOrder(slider.id, nextSlider.order);
                        updateSliderOrder(nextSlider.id, slider.order);
                      }
                    }}
                    disabled={index === sortedSliders.length - 1}
                    className="flex-1"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSlider(slider);
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
                    onClick={() => setDeleteDialog({open: true, sliderId: slider.id})}
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
      <Dialog open={showForm || editingSlider !== null} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditingSlider(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSlider ? "Hero слайдер засах" : "Шинэ hero слайдер үүсгэх"}
            </DialogTitle>
          </DialogHeader>
          <HeroSliderForm
            slider={editingSlider || undefined}
            onSubmit={editingSlider ? updateSlider : createSlider}
            onCancel={() => {
              setShowForm(false);
              setEditingSlider(null);
            }}
            isLoading={isFormLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hero слайдер устгах</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Та энэ hero слайдерыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
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
                if (deleteDialog.sliderId) {
                  deleteSlider(deleteDialog.sliderId);
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

