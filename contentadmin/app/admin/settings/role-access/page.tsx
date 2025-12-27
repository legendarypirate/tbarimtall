"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Plus, Loader2, Search, Shield, X, CheckCircle2, XCircle } from "lucide-react";
import { rolePermissionsApi } from "@/lib/api";

// Sidebar links structure from sidebar.tsx
const sidebarLinks = [
  { href: "/admin", label: "Хянах самбар", key: "dashboard" },
  { 
    href: "/admin/users", 
    label: "Хэрэглэгч", 
    key: "users",
    children: [
      { href: "/admin/users/list", label: "Хэрэглэгчдийн жагсаалт", key: "users_list" },
      { href: "/admin/users/income-request", label: "Орлогын хүсэлт", key: "users_income_request" },
    ]
  },
  { 
    href: "/admin/product", 
    label: "Бүтээгдэхүүн", 
    key: "product",
    children: [
      { href: "/admin/product/new", label: "New", key: "product_new" },
      { href: "/admin/product/all", label: "All", key: "product_all" },
      { href: "/admin/product/cancelled", label: "Cancelled", key: "product_cancelled" },
      { href: "/admin/product/deleted", label: "Deleted", key: "product_deleted" },
    ]
  },
  { 
    href: "/admin/settings", 
    label: "Тохиргоо", 
    key: "settings",
    children: [
      { href: "/admin/settings/category", label: "Category", key: "settings_category" },
      { href: "/admin/settings/banner-manage", label: "Banner Manage", key: "settings_banner" },
      { href: "/admin/settings/role-access", label: "Role Access", key: "settings_role_access" },
      { href: "/admin/settings/membership", label: "Membership", key: "settings_membership" },
    ]
  },
];

// Role Permission type
export interface RolePermissionData {
  id: number;
  roleName: string;
  description?: string | null;
  permissions: {
    [key: string]: {
      read?: boolean;
      create?: boolean;
      update?: boolean;
      delete?: boolean;
    };
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Permission Form Component
function PermissionForm({
  rolePermission,
  onSubmit,
  onCancel,
  isLoading
}: {
  rolePermission?: RolePermissionData;
  onSubmit: (rolePermissionData: Omit<RolePermissionData, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<Omit<RolePermissionData, "id" | "createdAt" | "updatedAt">>({
    roleName: rolePermission?.roleName || "",
    description: rolePermission?.description || "",
    permissions: rolePermission?.permissions || {},
    isActive: rolePermission?.isActive ?? true,
  });

  // Initialize permissions for all sidebar links
  useEffect(() => {
    const initialPermissions: any = {};
    
    sidebarLinks.forEach(link => {
      if (!form.permissions[link.key]) {
        initialPermissions[link.key] = {
          read: false,
          create: false,
          update: false,
          delete: false,
        };
      } else {
        // Ensure all permission properties are boolean, not undefined
        initialPermissions[link.key] = {
          read: form.permissions[link.key]?.read ?? false,
          create: form.permissions[link.key]?.create ?? false,
          update: form.permissions[link.key]?.update ?? false,
          delete: form.permissions[link.key]?.delete ?? false,
        };
      }
      
      if (link.children) {
        link.children.forEach(child => {
          if (!form.permissions[child.key]) {
            initialPermissions[child.key] = {
              read: false,
              create: false,
              update: false,
              delete: false,
            };
          } else {
            // Ensure all permission properties are boolean, not undefined
            initialPermissions[child.key] = {
              read: form.permissions[child.key]?.read ?? false,
              create: form.permissions[child.key]?.create ?? false,
              update: form.permissions[child.key]?.update ?? false,
              delete: form.permissions[child.key]?.delete ?? false,
            };
          }
        });
      }
    });
    
    setForm(prev => ({
      ...prev,
      permissions: { ...initialPermissions, ...prev.permissions }
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const togglePermission = (key: string, permission: 'read' | 'create' | 'update' | 'delete') => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: {
          read: prev.permissions[key]?.read ?? false,
          create: prev.permissions[key]?.create ?? false,
          update: prev.permissions[key]?.update ?? false,
          delete: prev.permissions[key]?.delete ?? false,
          [permission]: !(prev.permissions[key]?.[permission] ?? false)
        }
      }
    }));
  };

  const toggleAllForLink = (key: string, value: boolean) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: {
          read: value,
          create: value,
          update: value,
          delete: value,
        }
      }
    }));
  };

  // Collect all permissions for table
  const allPermissions = sidebarLinks.flatMap(link => {
    const items: Array<{ key: string; label: string; isChild: boolean; parentKey?: string }> = [
      { key: link.key, label: link.label, isChild: false }
    ];
    if (link.children) {
      link.children.forEach(child => {
        items.push({ key: child.key, label: child.label, isChild: true, parentKey: link.key });
      });
    }
    return items;
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="roleName" className="mb-2 block">Үүргийн нэр *</Label>
        <Input
          id="roleName"
          value={form.roleName}
          onChange={(e) => setForm({...form, roleName: e.target.value})}
          placeholder="Жишээ: Content Manager, Product Admin"
          required
        />
      </div>

      <div>
        <Label htmlFor="description" className="mb-2 block">Тайлбар</Label>
        <Textarea
          id="description"
          value={form.description || ""}
          onChange={(e) => setForm({...form, description: e.target.value})}
          placeholder="Үүргийн тайлбар..."
          rows={3}
        />
      </div>

      <div>
        <Label className="mb-3 block text-base font-semibold">Эрхүүд</Label>
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 z-10">
                <TableRow>
                  <TableHead className="w-[250px] font-semibold">Модуль / Цэс</TableHead>
                  <TableHead className="text-center w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium">Унших</span>
                      <Checkbox
                        checked={allPermissions.length > 0 && allPermissions.every(item => form.permissions[item.key]?.read ?? false)}
                        onCheckedChange={(checked) => {
                          allPermissions.forEach(item => {
                            setForm(prev => ({
                              ...prev,
                              permissions: {
                                ...prev.permissions,
                                [item.key]: {
                                  read: checked as boolean,
                                  create: prev.permissions[item.key]?.create ?? false,
                                  update: prev.permissions[item.key]?.update ?? false,
                                  delete: prev.permissions[item.key]?.delete ?? false,
                                }
                              }
                            }));
                          });
                        }}
                        className="h-4 w-4"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium">Үүсгэх</span>
                      <Checkbox
                        checked={allPermissions.length > 0 && allPermissions.every(item => form.permissions[item.key]?.create ?? false)}
                        onCheckedChange={(checked) => {
                          allPermissions.forEach(item => {
                            setForm(prev => ({
                              ...prev,
                              permissions: {
                                ...prev.permissions,
                                [item.key]: {
                                  read: prev.permissions[item.key]?.read ?? false,
                                  create: checked as boolean,
                                  update: prev.permissions[item.key]?.update ?? false,
                                  delete: prev.permissions[item.key]?.delete ?? false,
                                }
                              }
                            }));
                          });
                        }}
                        className="h-4 w-4"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium">Засах</span>
                      <Checkbox
                        checked={allPermissions.length > 0 && allPermissions.every(item => form.permissions[item.key]?.update ?? false)}
                        onCheckedChange={(checked) => {
                          allPermissions.forEach(item => {
                            setForm(prev => ({
                              ...prev,
                              permissions: {
                                ...prev.permissions,
                                [item.key]: {
                                  read: prev.permissions[item.key]?.read ?? false,
                                  create: prev.permissions[item.key]?.create ?? false,
                                  update: checked as boolean,
                                  delete: prev.permissions[item.key]?.delete ?? false,
                                }
                              }
                            }));
                          });
                        }}
                        className="h-4 w-4"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium">Устгах</span>
                      <Checkbox
                        checked={allPermissions.length > 0 && allPermissions.every(item => form.permissions[item.key]?.delete ?? false)}
                        onCheckedChange={(checked) => {
                          allPermissions.forEach(item => {
                            setForm(prev => ({
                              ...prev,
                              permissions: {
                                ...prev.permissions,
                                [item.key]: {
                                  read: prev.permissions[item.key]?.read ?? false,
                                  create: prev.permissions[item.key]?.create ?? false,
                                  update: prev.permissions[item.key]?.update ?? false,
                                  delete: checked as boolean,
                                }
                              }
                            }));
                          });
                        }}
                        className="h-4 w-4"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium">Бүгдийг сонгох</span>
                      <Checkbox
                        checked={allPermissions.every(item => {
                          const perm = form.permissions[item.key];
                          return (perm?.read ?? false) && (perm?.create ?? false) && (perm?.update ?? false) && (perm?.delete ?? false);
                        })}
                        onCheckedChange={(checked) => {
                          allPermissions.forEach(item => {
                            toggleAllForLink(item.key, checked as boolean);
                          });
                        }}
                        className="h-4 w-4"
                      />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPermissions.map((item) => {
                  const perm = form.permissions[item.key] || {};
                  const hasAll = (perm.read ?? false) && (perm.create ?? false) && (perm.update ?? false) && (perm.delete ?? false);
                  
                  return (
                    <TableRow 
                      key={item.key} 
                      className={item.isChild ? "bg-muted/30" : "bg-card font-medium"}
                    >
                      <TableCell className={item.isChild ? "pl-8 text-sm" : "font-semibold"}>
                        <div className="flex items-center gap-2">
                          {item.isChild && (
                            <span className="text-muted-foreground">└─</span>
                          )}
                          <span>{item.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={perm.read ?? false}
                            onCheckedChange={() => togglePermission(item.key, 'read')}
                            className="h-4 w-4"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={perm.create ?? false}
                            onCheckedChange={() => togglePermission(item.key, 'create')}
                            className="h-4 w-4"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={perm.update ?? false}
                            onCheckedChange={() => togglePermission(item.key, 'update')}
                            className="h-4 w-4"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={perm.delete ?? false}
                            onCheckedChange={() => togglePermission(item.key, 'delete')}
                            className="h-4 w-4"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={hasAll}
                            onCheckedChange={(checked) => toggleAllForLink(item.key, checked as boolean)}
                            className="h-4 w-4"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
            rolePermission ? "Хадгалах" : "Үүсгэх"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function RoleAccessPage() {
  const router = useRouter();
  const [rolePermissions, setRolePermissions] = useState<RolePermissionData[]>([]);
  const [editingRolePermission, setEditingRolePermission] = useState<RolePermissionData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, rolePermissionId?: number}>({open: false});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState<boolean | null>(null); // null = checking, true = denied, false = granted

  // Check if user is super admin and fetch data
  useEffect(() => {
    const checkAccessAndFetch = async () => {
      if (typeof window !== 'undefined') {
        setIsLoading(true);
        const userStr = localStorage.getItem('user');
        
        if (!userStr) {
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }

        try {
          const user = JSON.parse(userStr);
          if (user.role !== 'admin' || !user.isSuperAdmin) {
            setAccessDenied(true);
            setIsLoading(false);
            return;
          }

          // User has access, fetch role permissions
          setAccessDenied(false);
          try {
            const result = await rolePermissionsApi.getAll();
            
            if (result.rolePermissions && Array.isArray(result.rolePermissions)) {
              setRolePermissions(result.rolePermissions);
            } else {
              throw new Error('Invalid API response format');
            }
          } catch (err: any) {
            console.error('Error fetching role permissions:', err);
            if (err.message?.includes('Super admin')) {
              setAccessDenied(true);
            }
            setError(err instanceof Error ? err.message : 'Failed to fetch role permissions');
          }
        } catch (e) {
          setAccessDenied(true);
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkAccessAndFetch();
  }, []);

  // Fetch role permissions from API (for refresh after create/update/delete)
  const fetchRolePermissions = async () => {
    if (accessDenied) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await rolePermissionsApi.getAll();
      
      if (result.rolePermissions && Array.isArray(result.rolePermissions)) {
        setRolePermissions(result.rolePermissions);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err: any) {
      console.error('Error fetching role permissions:', err);
      if (err.message?.includes('Super admin')) {
        setAccessDenied(true);
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch role permissions');
    } finally {
      setIsLoading(false);
    }
  };

  // Create role permission via API
  const createRolePermission = async (rolePermissionData: Omit<RolePermissionData, "id" | "createdAt" | "updatedAt">) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await rolePermissionsApi.create({
        roleName: rolePermissionData.roleName,
        description: rolePermissionData.description || undefined,
        permissions: rolePermissionData.permissions,
        isActive: rolePermissionData.isActive,
      });

      setSuccess('Үүргийн эрх амжилттай үүслээ');
      setShowForm(false);
      fetchRolePermissions();
    } catch (err: any) {
      console.error('Error creating role permission:', err);
      if (err.message?.includes('Super admin')) {
        setAccessDenied(true);
      }
      setError(err instanceof Error ? err.message : 'Failed to create role permission');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Update role permission via API
  const updateRolePermission = async (rolePermissionData: Omit<RolePermissionData, "id" | "createdAt" | "updatedAt">) => {
    if (!editingRolePermission) return;

    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await rolePermissionsApi.update(editingRolePermission.id, {
        roleName: rolePermissionData.roleName,
        description: rolePermissionData.description || undefined,
        permissions: rolePermissionData.permissions,
        isActive: rolePermissionData.isActive,
      });

      setSuccess('Үүргийн эрх амжилттай шинэчлэгдлээ');
      setEditingRolePermission(null);
      fetchRolePermissions();
    } catch (err: any) {
      console.error('Error updating role permission:', err);
      if (err.message?.includes('Super admin')) {
        setAccessDenied(true);
      }
      setError(err instanceof Error ? err.message : 'Failed to update role permission');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Delete role permission via API
  const deleteRolePermission = async (id: number) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await rolePermissionsApi.delete(id);
      
      setSuccess('Үүргийн эрх амжилттай устгагдлаа');
      setDeleteDialog({open: false});
      fetchRolePermissions();
    } catch (err: any) {
      console.error('Error deleting role permission:', err);
      if (err.message?.includes('Super admin')) {
        setAccessDenied(true);
      }
      setError(err instanceof Error ? err.message : 'Failed to delete role permission');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Filter role permissions
  const filteredRolePermissions = rolePermissions.filter(rp => {
    const matchesSearch = rp.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rp.description && rp.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && rp.isActive) ||
                         (statusFilter === "inactive" && !rp.isActive);
    return matchesSearch && matchesStatus;
  });

  if (accessDenied === true) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-800 mb-2">Хандах эрхгүй</h2>
              <p className="text-red-600 mb-4">
                Энэ хуудсыг зөвхөн Super Admin хандаж болно.
              </p>
              <Button onClick={() => router.push('/admin')} variant="outline">
                Буцах
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Үүргийн эрх</h1>
          <p className="text-gray-500 mt-1">Үүргийн эрхүүдийг удирдах</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Шинэ үүргийн эрх
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <p className="text-green-800">{success}</p>
              <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <p className="text-red-800">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
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

      {/* Role Permissions List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </CardContent>
        </Card>
      ) : filteredRolePermissions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Үүргийн эрх олдсонгүй</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRolePermissions.map((rp) => (
            <Card key={rp.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{rp.roleName}</CardTitle>
                  <Badge variant={rp.isActive ? "default" : "secondary"}>
                    {rp.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {rp.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {rp.description}
                  </p>
                )}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Эрхүүд:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(rp.permissions || {}).slice(0, 5).map((key) => {
                      const perm = rp.permissions[key];
                      const hasAny = perm?.read || perm?.create || perm?.update || perm?.delete;
                      return hasAny ? (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}
                        </Badge>
                      ) : null;
                    })}
                    {Object.keys(rp.permissions || {}).length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{Object.keys(rp.permissions || {}).length - 5}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingRolePermission(rp);
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
                    onClick={() => setDeleteDialog({open: true, rolePermissionId: rp.id})}
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

      {/* Create/Edit Drawer */}
      <Sheet open={showForm || editingRolePermission !== null} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditingRolePermission(null);
        }
      }}>
        <SheetContent 
          side="right" 
          className="!w-full !max-w-6xl sm:!max-w-6xl overflow-y-auto bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl"
        >
          <SheetHeader className="pb-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 -mx-6 -mt-6 px-6 pt-6">
            <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              {editingRolePermission ? "Үүргийн эрх засах" : "Шинэ үүргийн эрх үүсгэх"}
            </SheetTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {editingRolePermission 
                ? "Үүргийн эрхийн мэдээллийг засах" 
                : "Шинэ үүргийн эрх үүсгэж, эрхүүдийг тохируулах"}
            </p>
          </SheetHeader>
          <div className="mt-6 p-2">
            <PermissionForm
              rolePermission={editingRolePermission || undefined}
              onSubmit={editingRolePermission ? updateRolePermission : createRolePermission}
              onCancel={() => {
                setShowForm(false);
                setEditingRolePermission(null);
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
            <DialogTitle>Үүргийн эрх устгах</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Та энэ үүргийн эрхийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
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
                if (deleteDialog.rolePermissionId) {
                  deleteRolePermission(deleteDialog.rolePermissionId);
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

