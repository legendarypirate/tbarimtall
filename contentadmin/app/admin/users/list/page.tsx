"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Eye, ShoppingCart, Calendar, MapPin, UserPlus, Search, Filter, Edit, Trash2, Loader2 } from "lucide-react";
import { membershipsApi } from "@/lib/api";

// API base URL
const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users`;

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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// User type based on your API
export interface UserData {
  id: number;
  full_name: string;
  phone: string;
  password?: string;
  role: "admin" | "user"; // Only these two roles
  supervisor_id: number | null;
  is_active: boolean;
  membership_type: number | null;
  createdAt: string;
  updatedAt: string;
  // Display fields
  email?: string;
  location?: string;
  total_orders?: number;
  total_spent?: number;
  device?: "mobile" | "desktop" | "tablet";
}

// Membership type
interface MembershipData {
  id: number;
  name: string;
  price: number;
  maxPosts: number;
  advantages: string[];
  description?: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// User Form Component
function UserForm({
  user,
  onSubmit,
  onCancel,
  isLoading,
  memberships
}: {
  user?: UserData;
  onSubmit: (userData: Omit<UserData, "id" | "createdAt" | "updatedAt" | "password"> & { password?: string }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  memberships: MembershipData[];
}) {
  const [form, setForm] = useState<Omit<UserData, "id" | "createdAt" | "updatedAt" | "password"> & { password?: string }>({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    role: user?.role || "user",
    supervisor_id: user?.supervisor_id || null,
    is_active: user?.is_active ?? true,
    membership_type: user?.membership_type || null,
    email: user?.email || "",
    location: user?.location || "Улаанбаатар",
    total_orders: user?.total_orders || 0,
    total_spent: user?.total_spent || 0,
    device: user?.device || "mobile",
    password: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="full_name">Бүтэн нэр</Label>
          <Input
            id="full_name"
            value={form.full_name}
            onChange={(e) => setForm({...form, full_name: e.target.value})}
            placeholder="Бүтэн нэр"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Утасны дугаар</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm({...form, phone: e.target.value})}
            placeholder="99999999"
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Имэйл</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
            placeholder="имэйл хаяг"
          />
        </div>

        {!user && (
          <div>
            <Label htmlFor="password">Нууц үг</Label>
            <Input
              id="password"
              type="password"
              value={form.password || ""}
              onChange={(e) => setForm({...form, password: e.target.value})}
              placeholder="Нууц үг оруулах"
              required
            />
          </div>
        )}

        <div>
          <Label htmlFor="role">Үүрэг</Label>
          <Select
            value={form.role}
            onValueChange={(value: "admin" | "user") => setForm({...form, role: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Админ</SelectItem>
              <SelectItem value="user">Хэрэглэгч</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="is_active">Төлөв</Label>
          <Select
            value={form.is_active ? "active" : "inactive"}
            onValueChange={(value) => setForm({...form, is_active: value === "active"})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Идэвхтэй</SelectItem>
              <SelectItem value="inactive">Идэвхгүй</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="membership_type">Гишүүнчлэл</Label>
          <Select
            value={
              form.membership_type != null && 
              form.membership_type.toString().trim() !== "" && 
              !isNaN(Number(form.membership_type))
                ? form.membership_type.toString() 
                : "none"
            }
            onValueChange={(value) => {
              // Prevent empty string values
              if (!value || value.trim() === "") return;
              setForm({...form, membership_type: value === "none" ? null : parseInt(value)});
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Гишүүнчлэл сонгох" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Гишүүнчлэлгүй</SelectItem>
              {memberships
                .filter(m => {
                  // Filter out invalid memberships - ensure id is valid and positive
                  return m.isActive && 
                         m.id != null && 
                         m.id !== undefined && 
                         !isNaN(Number(m.id)) &&
                         Number(m.id) > 0;
                })
                .map((membership) => {
                  // Ensure the value is never an empty string
                  const idString = String(membership.id).trim();
                  // Double check - should never happen after filter, but just in case
                  if (!idString || idString === "" || idString === "0") return null;
                  return (
                    <SelectItem key={membership.id} value={idString}>
                      {membership.name}
                    </SelectItem>
                  );
                })
                .filter(Boolean)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="location">Байршил</Label>
          <Input
            id="location"
            value={form.location}
            onChange={(e) => setForm({...form, location: e.target.value})}
            placeholder="Хот, сум, дүүрэг"
          />
        </div>

        <div>
          <Label htmlFor="device">Төхөөрөмж</Label>
          <Select
            value={form.device}
            onValueChange={(value: "mobile" | "desktop" | "tablet") => setForm({...form, device: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mobile">Утас</SelectItem>
              <SelectItem value="desktop">Компьютер</SelectItem>
              <SelectItem value="tablet">Таблет</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="total_orders">Захиалгын тоо</Label>
          <Input
            id="total_orders"
            type="number"
            value={form.total_orders}
            onChange={(e) => setForm({...form, total_orders: parseInt(e.target.value) || 0})}
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="total_spent">Зарцуулалт (₮)</Label>
          <Input
            id="total_spent"
            type="number"
            value={form.total_spent}
            onChange={(e) => setForm({...form, total_spent: parseInt(e.target.value) || 0})}
            min="0"
          />
        </div>
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
            user ? "Хадгалах" : "Үүсгэх"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [memberships, setMemberships] = useState<MembershipData[]>([]);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, userId?: number}>({open: false});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Authentication required' }));
        if (response.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/');
          throw new Error('Та эхлээд нэвтэрнэ үү');
        }
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.users && Array.isArray(result.users)) {
        // Map API data to our UserData type
        const mappedUsers: UserData[] = result.users.map((user: any) => {
          // Map role from backend to frontend
          // Backend uses: 'journalist', 'admin'
          // Frontend uses: 'user', 'admin' (where 'user' = 'journalist')
          let role: "admin" | "user" = "user";
          if (user.role === "admin") {
            role = "admin";
          } else {
            // If not admin, it's journalist (mapped to 'user' in frontend)
            role = "user";
          }
          
          return {
            id: user.id,
            full_name: user.fullName || user.full_name || '',
            phone: user.phone || '',
            password: user.password,
            role: role,
            supervisor_id: user.supervisor_id || null,
            is_active: user.isActive !== undefined ? user.isActive : (user.is_active !== undefined ? user.is_active : true),
            membership_type: user.membership_type !== undefined ? user.membership_type : (user.membershipType !== undefined ? user.membershipType : null),
            createdAt: user.createdAt || user.created_at || new Date().toISOString(),
            updatedAt: user.updatedAt || user.updated_at || new Date().toISOString(),
            // Add default values for display fields
            email: user.email || undefined,
            location: user.location || "Улаанбаатар",
            total_orders: 0,
            total_spent: 0,
            device: "mobile" as "mobile" | "desktop" | "tablet"
          };
        });
        
        setUsers(mappedUsers);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch memberships
  const fetchMemberships = async () => {
    try {
      const result = await membershipsApi.getAll({ isActive: true });
      if (result.memberships && Array.isArray(result.memberships)) {
        setMemberships(result.memberships);
      }
    } catch (err) {
      console.error('Error fetching memberships:', err);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    fetchMemberships();
  }, []);

  // Create user via API
  const createUser = async (userData: Omit<UserData, "id" | "createdAt" | "updatedAt" | "password"> & { password?: string }) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      // Map frontend role to backend role
      // Frontend uses 'user' but backend expects 'journalist'
      const backendRole = userData.role === "user" ? "journalist" : userData.role;
      
      const apiData: any = {
        fullName: userData.full_name,
        username: userData.phone || userData.email || `user_${Date.now()}`,
        email: userData.email || undefined,
        password: userData.password || "default123",
        role: backendRole,
        isActive: userData.is_active !== undefined ? userData.is_active : true,
        membership_type: userData.membership_type !== undefined ? userData.membership_type : null
      };
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/');
          throw new Error('Та эхлээд нэвтэрнэ үү');
        }
        throw new Error(errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.user) {
        // Map the response back to our format
        const apiUser = result.user;
        let role: "admin" | "user" = "user";
        if (apiUser.role === "admin") {
          role = "admin";
        }
        
        // Add the new user to the list
        const newUser: UserData = {
          id: apiUser.id,
          full_name: apiUser.fullName || apiUser.full_name || '',
          phone: apiUser.phone || '',
          role: role,
          supervisor_id: null,
          is_active: apiUser.isActive !== undefined ? apiUser.isActive : (apiUser.is_active !== undefined ? apiUser.is_active : true),
          membership_type: apiUser.membership_type !== undefined ? apiUser.membership_type : (apiUser.membershipType !== undefined ? apiUser.membershipType : null),
          createdAt: apiUser.createdAt || new Date().toISOString(),
          updatedAt: apiUser.updatedAt || new Date().toISOString(),
          email: apiUser.email,
          location: userData.location,
          total_orders: userData.total_orders,
          total_spent: userData.total_spent,
          device: userData.device
        };
        
        setUsers([...users, newUser]);
        setShowForm(false);
        setSuccess("Хэрэглэгч амжилттай үүсгэгдлээ");
        // Refresh the list to get the latest data
        setTimeout(() => fetchUsers(), 500);
      } else {
        throw new Error('Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Update user via API
  const updateUser = async (userData: Omit<UserData, "id" | "createdAt" | "updatedAt" | "password"> & { password?: string }) => {
    try {
      if (!editingUser) return;
      
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      // Map frontend role to backend role
      // Frontend uses 'user' but backend expects 'journalist'
      const backendRole = userData.role === "user" ? "journalist" : userData.role;
      
      const apiData: any = {
        fullName: userData.full_name,
        email: userData.email || undefined,
        role: backendRole,
        isActive: userData.is_active !== undefined ? userData.is_active : true,
        membership_type: userData.membership_type !== undefined ? userData.membership_type : null
      };
      
      // Only update password if provided
      if (userData.password && userData.password.trim() !== '') {
        apiData.password = userData.password;
      }
      
      const response = await fetch(`${API_URL}/${editingUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/');
          throw new Error('Та эхлээд нэвтэрнэ үү');
        }
        throw new Error(errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.user) {
        // Map the response back to our format
        const apiUser = result.user;
        // Map backend role to frontend role
        // If not admin, it's journalist (mapped to 'user' in frontend)
        let role: "admin" | "user" = "user";
        if (apiUser.role === "admin") {
          role = "admin";
        } else {
          role = "user";
        }
        
        // Update the user in the list
        const updatedUsers = users.map(user => 
          user.id === editingUser.id 
            ? { 
                ...user, 
                full_name: apiUser.fullName || apiUser.full_name || '',
                phone: apiUser.phone || '',
                role: role,
                supervisor_id: null,
                is_active: apiUser.isActive !== undefined ? apiUser.isActive : (apiUser.is_active !== undefined ? apiUser.is_active : true),
                membership_type: apiUser.membership_type !== undefined ? apiUser.membership_type : (apiUser.membershipType !== undefined ? apiUser.membershipType : userData.membership_type),
                email: apiUser.email || userData.email,
                location: userData.location,
                total_orders: userData.total_orders,
                total_spent: userData.total_spent,
                device: userData.device,
                updatedAt: apiUser.updatedAt || new Date().toISOString()
              }
            : user
        );
        
        setUsers(updatedUsers);
        setEditingUser(null);
        setShowForm(false);
        setSuccess("Хэрэглэгч амжилттай шинэчлэгдлээ");
        // Refresh the list to get the latest data
        setTimeout(() => fetchUsers(), 500);
      } else {
        throw new Error('Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Delete user via API
  const deleteUser = async (userId: number) => {
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`${API_URL}/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/');
          throw new Error('Та эхлээд нэвтэрнэ үү');
        }
        throw new Error(errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Remove the user from the list
      setUsers(users.filter(user => user.id !== userId));
      setDeleteDialog({open: false});
      setSuccess("Хэрэглэгч амжилттай устгагдлаа");
      // Refresh the list to get the latest data
      setTimeout(() => fetchUsers(), 500);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.location && user.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.is_active).length,
    totalAdmins: users.filter(u => u.role === "admin").length,
    totalUsersCount: users.filter(u => u.role === "user").length,
    totalRevenue: users.reduce((sum, user) => sum + (user.total_spent || 0), 0),
    totalOrders: users.reduce((sum, user) => sum + (user.total_orders || 0), 0),
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('mn-MN').format(price) + '₮';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getRoleColor = (role: UserData["role"]) => {
    return role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('mn-MN');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Хэрэглэгчдийн мэдээлэл уншиж байна...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Хэрэглэгчийн удирдлага</h2>
          <p className="text-gray-600">Системийн хэрэглэгчдийн мэдээлэл</p>
        </div>
        <Button 
          onClick={() => { setEditingUser(null); setShowForm(true); setError(null); }}
          className="flex items-center gap-2"
        >
          <UserPlus size={16} />
          Шинэ хэрэглэгч
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <div className="text-sm text-red-800">{error}</div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start">
            <div className="text-sm text-green-800">{success}</div>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт хэрэглэгч</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Бүртгэлтэй хэрэглэгчид
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Идэвхтэй хэрэглэгч</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Идэвхтэй хэрэглэгчид
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Админууд</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdmins}</div>
            <p className="text-xs text-muted-foreground">
              Системийн админууд
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт зарцуулалт</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Бүх хэрэглэгчдийн нийт зарцуулалт
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 max-w-md w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Нэр, утас, имэйл, хаягаар хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select 
                value={roleFilter}
                onValueChange={setRoleFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Үүрэг" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Бүх үүрэг</SelectItem>
                  <SelectItem value="admin">Админ</SelectItem>
                  <SelectItem value="user">Хэрэглэгч</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Төлөв" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Бүх төлөв</SelectItem>
                  <SelectItem value="active">Идэвхтэй</SelectItem>
                  <SelectItem value="inactive">Идэвхгүй</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingUser ? "Хэрэглэгч засах" : "Шинэ хэрэглэгч үүсгэх"}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <UserForm
              user={editingUser || undefined}
              onSubmit={editingUser ? updateUser : createUser}
              onCancel={() => { setShowForm(false); setEditingUser(null); }}
              isLoading={isFormLoading}
              memberships={memberships}
            />
          </CardContent>
        </Card>
      )}

      {/* User Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Хэрэглэгчийн жагсаалт</span>
            <span className="text-sm text-muted-foreground">
              {filteredUsers.length} хэрэглэгч
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Хэрэглэгч</th>
                  <th className="text-left p-3">Холбоо барих</th>
                  <th className="text-left p-3">Үүрэг</th>
                  <th className="text-left p-3">Гишүүнчлэл</th>
                  <th className="text-left p-3">Төлөв</th>
                  <th className="text-left p-3">Захиалга</th>
                  <th className="text-left p-3">Зарцуулалт</th>
                  <th className="text-left p-3">Байршил</th>
                  <th className="text-left p-3">Бүртгүүлсэн</th>
                  <th className="text-left p-3">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-xs text-gray-500">
                          ID: {user.id}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{user.phone}</div>
                        {user.email && (
                          <div className="text-xs text-gray-500">{user.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {user.membership_type ? (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {memberships.find(m => m.id === user.membership_type)?.name || 'Unknown'}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge className={getStatusColor(user.is_active)}>
                        {user.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{user.total_orders || 0}</div>
                      <div className="text-xs text-gray-500">захиалга</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-green-600">
                        {formatPrice(user.total_spent || 0)}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>{user.location || "-"}</div>
                      <div className="text-xs text-gray-500">{user.device || "-"}</div>
                    </td>
                    <td className="p-3">
                      <div>{formatDate(user.createdAt)}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditingUser(user); setShowForm(true); setError(null); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteDialog({open: true, userId: user.id})}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-500">
                      Хэрэглэгч олдсонгүй
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Хэрэглэгч устгах уу?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Энэ үйлдлийг буцаах боломжгүй. Та устгахдаа итгэлтэй байна уу?
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteDialog({open: false})}>
                Цуцлах
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteDialog.userId && deleteUser(deleteDialog.userId)}
              >
                Устгах
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}