"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, Trash2, Plus, Loader2, Search, Image as ImageIcon, ArrowUp, ArrowDown } from "lucide-react";
import { bannersApi } from "@/lib/api";

// Banner type based on your API
export interface BannerData {
  id: number;
  imageUrl: string;
  title?: string | null;
  linkUrl?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Banner Form Component
function BannerForm({
  banner,
  onSubmit,
  onCancel,
  isLoading
}: {
  banner?: BannerData;
  onSubmit: (bannerData: Omit<BannerData, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<Omit<BannerData, "id" | "createdAt" | "updatedAt">>({
    imageUrl: banner?.imageUrl || "",
    title: banner?.title || "",
    linkUrl: banner?.linkUrl || "",
    order: banner?.order || 0,
    isActive: banner?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="imageUrl">Зургийн URL *</Label>
        <Input
          id="imageUrl"
          value={form.imageUrl}
          onChange={(e) => setForm({...form, imageUrl: e.target.value})}
          placeholder="https://example.com/image.jpg"
          required
        />
        {form.imageUrl && (
          <div className="mt-2">
            <img 
              src={form.imageUrl} 
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
        <Label htmlFor="title">Гарчиг</Label>
        <Input
          id="title"
          value={form.title || ""}
          onChange={(e) => setForm({...form, title: e.target.value})}
          placeholder="Баннерын гарчиг (сонголттой)"
        />
      </div>

      <div>
        <Label htmlFor="linkUrl">Холбоос</Label>
        <Input
          id="linkUrl"
          value={form.linkUrl || ""}
          onChange={(e) => setForm({...form, linkUrl: e.target.value})}
          placeholder="https://example.com (сонголттой)"
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
            banner ? "Хадгалах" : "Үүсгэх"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function BannerManagePage() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [editingBanner, setEditingBanner] = useState<BannerData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, bannerId?: number}>({open: false});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch banners from API
  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await bannersApi.getAllAdmin();
      
      if (result.banners && Array.isArray(result.banners)) {
        setBanners(result.banners);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch banners');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch banners on component mount
  useEffect(() => {
    fetchBanners();
  }, []);

  // Create banner via API
  const createBanner = async (bannerData: Omit<BannerData, "id" | "createdAt" | "updatedAt">) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await bannersApi.create({
        imageUrl: bannerData.imageUrl,
        title: bannerData.title || undefined,
        linkUrl: bannerData.linkUrl || undefined,
        order: bannerData.order,
        isActive: bannerData.isActive,
      });

      setSuccess('Баннер амжилттай үүслээ');
      setShowForm(false);
      fetchBanners();
    } catch (err) {
      console.error('Error creating banner:', err);
      setError(err instanceof Error ? err.message : 'Failed to create banner');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Update banner via API
  const updateBanner = async (bannerData: Omit<BannerData, "id" | "createdAt" | "updatedAt">) => {
    if (!editingBanner) return;

    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await bannersApi.update(editingBanner.id, {
        imageUrl: bannerData.imageUrl,
        title: bannerData.title || undefined,
        linkUrl: bannerData.linkUrl || undefined,
        order: bannerData.order,
        isActive: bannerData.isActive,
      });

      setSuccess('Баннер амжилттай шинэчлэгдлээ');
      setEditingBanner(null);
      fetchBanners();
    } catch (err) {
      console.error('Error updating banner:', err);
      setError(err instanceof Error ? err.message : 'Failed to update banner');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Delete banner via API
  const deleteBanner = async (id: number) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await bannersApi.delete(id);
      
      setSuccess('Баннер амжилттай устгагдлаа');
      setDeleteDialog({open: false});
      fetchBanners();
    } catch (err) {
      console.error('Error deleting banner:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete banner');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Update banner order
  const updateBannerOrder = async (id: number, newOrder: number) => {
    try {
      const banner = banners.find(b => b.id === id);
      if (!banner) return;

      await bannersApi.update(id, { order: newOrder });
      fetchBanners();
    } catch (err) {
      console.error('Error updating banner order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update banner order');
    }
  };

  // Filter banners
  const filteredBanners = banners.filter(banner => {
    const matchesSearch = (banner.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         banner.imageUrl.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && banner.isActive) ||
                         (statusFilter === "inactive" && !banner.isActive);
    return matchesSearch && matchesStatus;
  });

  // Sort by order
  const sortedBanners = [...filteredBanners].sort((a, b) => a.order - b.order);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Баннер удирдах</h1>
          <p className="text-gray-500 mt-1">Бүтээгдэхүүний дэлгэрэнгүй хуудас дээр харагдах баннеруудыг удирдах</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Шинэ баннер
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

      {/* Banners List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </CardContent>
        </Card>
      ) : sortedBanners.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Баннер олдсонгүй</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedBanners.map((banner, index) => (
            <Card key={banner.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-500">#{banner.order}</span>
                    {banner.title && (
                      <CardTitle className="text-lg">{banner.title}</CardTitle>
                    )}
                  </div>
                  <Badge variant={banner.isActive ? "default" : "secondary"}>
                    {banner.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title || "Banner"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23ddd" width="400" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                {banner.linkUrl && (
                  <p className="text-xs text-gray-500 mb-2 truncate">
                    🔗 {banner.linkUrl}
                  </p>
                )}
                <div className="flex gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (index > 0) {
                        const prevBanner = sortedBanners[index - 1];
                        updateBannerOrder(banner.id, prevBanner.order);
                        updateBannerOrder(prevBanner.id, banner.order);
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
                      if (index < sortedBanners.length - 1) {
                        const nextBanner = sortedBanners[index + 1];
                        updateBannerOrder(banner.id, nextBanner.order);
                        updateBannerOrder(nextBanner.id, banner.order);
                      }
                    }}
                    disabled={index === sortedBanners.length - 1}
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
                      setEditingBanner(banner);
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
                    onClick={() => setDeleteDialog({open: true, bannerId: banner.id})}
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
      <Dialog open={showForm || editingBanner !== null} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditingBanner(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? "Баннер засах" : "Шинэ баннер үүсгэх"}
            </DialogTitle>
          </DialogHeader>
          <BannerForm
            banner={editingBanner || undefined}
            onSubmit={editingBanner ? updateBanner : createBanner}
            onCancel={() => {
              setShowForm(false);
              setEditingBanner(null);
            }}
            isLoading={isFormLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Баннер устгах</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Та энэ баннерыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
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
                if (deleteDialog.bannerId) {
                  deleteBanner(deleteDialog.bannerId);
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

