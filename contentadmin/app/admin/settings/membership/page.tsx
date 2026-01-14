"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Plus, Loader2, Search, X, Crown, Star, Zap, CheckCircle2, XCircle } from "lucide-react";
import { membershipsApi } from "@/lib/api";

// Membership type
export interface MembershipData {
  id: number;
  name: string;
  price: number;
  maxPosts: number;
  advantages: string[];
  description?: string | null;
  isActive: boolean;
  order: number;
  percentage: number;
  fileSizeLimit?: number | null;
  fileSizeLimitUnit?: 'MB' | 'GB' | 'TB' | null;
  createdAt: string;
  updatedAt: string;
}

// Membership Form Component
function MembershipForm({
  membership,
  onSubmit,
  onCancel,
  isLoading
}: {
  membership?: MembershipData;
  onSubmit: (membershipData: Omit<MembershipData, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<Omit<MembershipData, "id" | "createdAt" | "updatedAt">>({
    name: membership?.name || "",
    price: membership?.price || 0,
    maxPosts: membership?.maxPosts || 0,
    advantages: membership?.advantages || [],
    description: membership?.description || "",
    isActive: membership?.isActive ?? true,
    order: membership?.order || 0,
    percentage: membership?.percentage || 20.00,
    fileSizeLimit: membership?.fileSizeLimit ?? null,
    fileSizeLimitUnit: membership?.fileSizeLimitUnit || 'MB',
  });

  const [advantageInput, setAdvantageInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const addAdvantage = () => {
    if (advantageInput.trim()) {
      setForm(prev => ({
        ...prev,
        advantages: [...prev.advantages, advantageInput.trim()]
      }));
      setAdvantageInput("");
    }
  };

  const removeAdvantage = (index: number) => {
    setForm(prev => ({
      ...prev,
      advantages: prev.advantages.filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="mb-2 block">Нэр *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            placeholder="Жишээ: Basic, Premium, Enterprise"
            required
          />
        </div>

        <div>
          <Label htmlFor="price" className="mb-2 block">Үнэ (₮) *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({...form, price: parseFloat(e.target.value) || 0})}
            placeholder="70000"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="maxPosts" className="mb-2 block">Сарын нийтлэлтийн тоо *</Label>
          <Input
            id="maxPosts"
            type="number"
            min="0"
            value={form.maxPosts}
            onChange={(e) => setForm({...form, maxPosts: parseInt(e.target.value) || 0})}
            placeholder="10"
            required
          />
        </div>

        <div>
          <Label htmlFor="order" className="mb-2 block">Дараалал</Label>
          <Input
            id="order"
            type="number"
            min="0"
            value={form.order}
            onChange={(e) => setForm({...form, order: parseInt(e.target.value) || 0})}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="percentage" className="mb-2 block">Комиссын хувь (%) *</Label>
        <Input
          id="percentage"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={form.percentage}
          onChange={(e) => setForm({...form, percentage: parseFloat(e.target.value) || 20.00})}
          placeholder="20.00"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Борлуулалтаас авна комиссын хувь (жишээ: 20.00 = 20%)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fileSizeLimit" className="mb-2 block">Файлын хэмжээний хязгаар</Label>
          <Input
            id="fileSizeLimit"
            type="number"
            min="0"
            step="0.01"
            value={form.fileSizeLimit || ""}
            onChange={(e) => setForm({...form, fileSizeLimit: e.target.value ? parseFloat(e.target.value) : null})}
            placeholder="60"
          />
          <p className="text-sm text-gray-500 mt-1">
            Нэг удаагийн файл оруулалтын хязгаар (жишээ: 60)
          </p>
        </div>

        <div>
          <Label htmlFor="fileSizeLimitUnit" className="mb-2 block">Хэмжээний нэгж</Label>
          <Select
            value={form.fileSizeLimitUnit || 'MB'}
            onValueChange={(value: 'MB' | 'GB' | 'TB') => setForm({...form, fileSizeLimitUnit: value})}
          >
            <SelectTrigger id="fileSizeLimitUnit">
              <SelectValue placeholder="Нэгж сонгох" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MB">MB</SelectItem>
              <SelectItem value="GB">GB</SelectItem>
              <SelectItem value="TB">TB</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-1">
            Файлын хэмжээний нэгж
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="mb-2 block">Тайлбар</Label>
        <Textarea
          id="description"
          value={form.description || ""}
          onChange={(e) => setForm({...form, description: e.target.value})}
          placeholder="Гишүүнчлэлийн тайлбар..."
          rows={3}
        />
      </div>

      <div>
        <Label className="mb-2 block">Давуу талууд</Label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={advantageInput}
              onChange={(e) => setAdvantageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAdvantage();
                }
              }}
              placeholder="Давуу тал нэмэх..."
            />
            <Button type="button" onClick={addAdvantage} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {form.advantages.map((advantage, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                {advantage}
                <button
                  type="button"
                  onClick={() => removeAdvantage(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="isActive"
          checked={form.isActive}
          onCheckedChange={(checked) => setForm({...form, isActive: checked as boolean})}
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
            membership ? "Хадгалах" : "Үүсгэх"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function MembershipPage() {
  const [memberships, setMemberships] = useState<MembershipData[]>([]);
  const [editingMembership, setEditingMembership] = useState<MembershipData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, membershipId?: number}>({open: false});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch memberships
  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await membershipsApi.getAll();
      
      if (result.memberships && Array.isArray(result.memberships)) {
        setMemberships(result.memberships);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err: any) {
      console.error('Error fetching memberships:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch memberships');
    } finally {
      setIsLoading(false);
    }
  };

  // Create membership
  const createMembership = async (membershipData: Omit<MembershipData, "id" | "createdAt" | "updatedAt">) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await membershipsApi.create({
        name: membershipData.name,
        price: membershipData.price,
        maxPosts: membershipData.maxPosts,
        advantages: membershipData.advantages,
        description: membershipData.description || undefined,
        isActive: membershipData.isActive,
        order: membershipData.order,
        percentage: membershipData.percentage,
        fileSizeLimit: membershipData.fileSizeLimit,
        fileSizeLimitUnit: membershipData.fileSizeLimitUnit ?? undefined,
      });

      setSuccess('Гишүүнчлэл амжилттай үүслээ');
      setShowForm(false);
      fetchMemberships();
    } catch (err: any) {
      console.error('Error creating membership:', err);
      setError(err instanceof Error ? err.message : 'Failed to create membership');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Update membership
  const updateMembership = async (membershipData: Omit<MembershipData, "id" | "createdAt" | "updatedAt">) => {
    if (!editingMembership) return;

    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await membershipsApi.update(editingMembership.id, {
        name: membershipData.name,
        price: membershipData.price,
        maxPosts: membershipData.maxPosts,
        advantages: membershipData.advantages,
        description: membershipData.description || undefined,
        isActive: membershipData.isActive,
        order: membershipData.order,
        percentage: membershipData.percentage,
        fileSizeLimit: membershipData.fileSizeLimit,
        fileSizeLimitUnit: membershipData.fileSizeLimitUnit ?? undefined,
      });

      setSuccess('Гишүүнчлэл амжилттай шинэчлэгдлээ');
      setEditingMembership(null);
      fetchMemberships();
    } catch (err: any) {
      console.error('Error updating membership:', err);
      setError(err instanceof Error ? err.message : 'Failed to update membership');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Delete membership
  const deleteMembership = async (id: number) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await membershipsApi.delete(id);
      
      setSuccess('Гишүүнчлэл амжилттай устгагдлаа');
      setDeleteDialog({open: false});
      fetchMemberships();
    } catch (err: any) {
      console.error('Error deleting membership:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete membership');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Filter memberships
  const filteredMemberships = memberships.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && m.isActive) ||
                         (statusFilter === "inactive" && !m.isActive);
    return matchesSearch && matchesStatus;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency: 'MNT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Гишүүнчлэл
          </h1>
          <p className="text-gray-500 mt-1">Гишүүнчлэлийн төрлүүдийг удирдах</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
          <Plus className="h-4 w-4 mr-2" />
          Шинэ гишүүнчлэл
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="bg-green-50 border-green-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-green-800 font-medium">{success}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="bg-red-50 border-red-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">{error}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="shadow-sm">
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
              className="px-4 py-2 border rounded-md bg-background"
            >
              <option value="all">Бүх статус</option>
              <option value="active">Идэвхтэй</option>
              <option value="inactive">Идэвхгүй</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Memberships List */}
      {isLoading ? (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      ) : filteredMemberships.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Гишүүнчлэл олдсонгүй</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemberships.map((membership) => (
            <Card 
              key={membership.id} 
              className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-bl-full`} />
              <CardHeader className="relative">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1 flex items-center gap-2">
                      {membership.order === 0 && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
                      {membership.order === 1 && <Zap className="h-5 w-5 text-blue-500" />}
                      {membership.order === 2 && <Crown className="h-5 w-5 text-purple-500" />}
                      {membership.name}
                    </CardTitle>
                    <div className="text-2xl font-bold text-primary mt-2">
                      {formatPrice(membership.price)}
                      <span className="text-sm font-normal text-gray-500">/сар</span>
                    </div>
                  </div>
                  <Badge variant={membership.isActive ? "default" : "secondary"} className="ml-2">
                    {membership.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-4">
                {membership.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {membership.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Сарын нийтлэл: {membership.maxPosts}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Комисс: {membership.percentage || 20}%</span>
                  </div>
                  
                  {membership.advantages && membership.advantages.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 font-medium">Давуу талууд:</p>
                      <ul className="space-y-1">
                        {membership.advantages.slice(0, 3).map((advantage, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-primary">•</span>
                            <span>{advantage}</span>
                          </li>
                        ))}
                        {membership.advantages.length > 3 && (
                          <li className="text-xs text-gray-500">
                            +{membership.advantages.length - 3} нэмэлт давуу тал
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingMembership(membership);
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
                    onClick={() => setDeleteDialog({open: true, membershipId: membership.id})}
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

      {/* Create/Edit Sheet */}
      <Sheet open={showForm || editingMembership !== null} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditingMembership(null);
        }
      }}>
        <SheetContent 
          side="right" 
          className="!w-full !max-w-6xl sm:!max-w-6xl overflow-y-auto bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl"
        >
          <SheetHeader className="pb-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 -mx-6 -mt-6 px-6 pt-6">
            <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              {editingMembership ? "Гишүүнчлэл засах" : "Шинэ гишүүнчлэл үүсгэх"}
            </SheetTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {editingMembership 
                ? "Гишүүнчлэлийн мэдээллийг засах" 
                : "Шинэ гишүүнчлэлийн төрөл үүсгэх"}
            </p>
          </SheetHeader>
          <div className="mt-6 p-2">
            <MembershipForm
              membership={editingMembership || undefined}
              onSubmit={editingMembership ? updateMembership : createMembership}
              onCancel={() => {
                setShowForm(false);
                setEditingMembership(null);
              }}
              isLoading={isFormLoading}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Гишүүнчлэл устгах</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Та энэ гишүүнчлэлийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
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
                if (deleteDialog.membershipId) {
                  deleteMembership(deleteDialog.membershipId);
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

