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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Pagination } from "@/components/ui/pagination";
import { Eye, ShoppingCart, Calendar, MapPin, UserPlus, Search, Filter, Edit, Trash2, Loader2, Plus } from "lucide-react";
import { membershipsApi } from "@/lib/api";

// API base URL
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`;

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
  // New fields
  wallet?: string;
  income?: number;
  publishedFileCount?: number;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
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
    wallet: user?.wallet || "",
    password: "",
    subscriptionStartDate: user?.subscriptionStartDate || null,
    subscriptionEndDate: user?.subscriptionEndDate || null
  });

  // Update form when user prop changes (for edit mode)
  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        phone: user.phone || "",
        role: user.role || "user",
        supervisor_id: user.supervisor_id || null,
        is_active: user.is_active ?? true,
        membership_type: user.membership_type || null,
        email: user.email || "",
        location: user.location || "Улаанбаатар",
        total_orders: user.total_orders || 0,
        total_spent: user.total_spent || 0,
        device: user.device || "mobile",
        wallet: user.wallet || "",
        password: "", // Don't populate password when editing
        subscriptionStartDate: user.subscriptionStartDate || null,
        subscriptionEndDate: user.subscriptionEndDate || null
      });
    } else {
      // Reset form for new user
      setForm({
        full_name: "",
        phone: "",
        role: "user",
        supervisor_id: null,
        is_active: true,
        membership_type: null,
        email: "",
        location: "Улаанбаатар",
        total_orders: 0,
        total_spent: 0,
        device: "mobile",
        wallet: "",
        password: ""
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label htmlFor="full_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Бүтэн нэр</Label>
          <Input
            id="full_name"
            value={form.full_name}
            onChange={(e) => setForm({...form, full_name: e.target.value})}
            placeholder="Бүтэн нэр"
            required
            className="mt-1.5 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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

        <div>
          <Label htmlFor="wallet">Хэтэвчийн дугаар</Label>
          <Input
            id="wallet"
            value={form.wallet || ""}
            onChange={(e) => setForm({...form, wallet: e.target.value})}
            placeholder="QPay, банкны данс гэх мэт"
          />
        </div>

        {user && (
          <>
            <div>
              <Label htmlFor="subscriptionStartDate">Гишүүнчлэл эхлэх огноо</Label>
              <Input
                id="subscriptionStartDate"
                type="datetime-local"
                value={form.subscriptionStartDate ? new Date(form.subscriptionStartDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setForm({...form, subscriptionStartDate: e.target.value ? new Date(e.target.value).toISOString() : null})}
              />
            </div>

            <div>
              <Label htmlFor="subscriptionEndDate">Гишүүнчлэл дуусах огноо</Label>
              <Input
                id="subscriptionEndDate"
                type="datetime-local"
                value={form.subscriptionEndDate ? new Date(form.subscriptionEndDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setForm({...form, subscriptionEndDate: e.target.value ? new Date(e.target.value).toISOString() : null})}
              />
            </div>
          </>
        )}

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

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="min-w-[100px]">
          Цуцлах
        </Button>
        <Button type="submit" disabled={isLoading} className="min-w-[120px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
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
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, userId?: number}>({open: false});
  const [chargeIncomeDialog, setChargeIncomeDialog] = useState<{open: boolean, user?: UserData}>({open: false});
  const [chargeAmount, setChargeAmount] = useState<string>("");
  const [confirmCharge, setConfirmCharge] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);

  // Fetch users from API
  const fetchUsers = async (page: number = currentPage) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', itemsPerPage.toString());
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (roleFilter !== 'all') {
        params.append('role', roleFilter);
      }
      
      const response = await fetch(`${API_URL}?${params.toString()}`, {
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
            device: "mobile" as "mobile" | "desktop" | "tablet",
            // New fields
            wallet: user.wallet || undefined,
            income: user.income !== undefined ? parseFloat(user.income) : 0,
            publishedFileCount: user.publishedFileCount !== undefined ? parseInt(user.publishedFileCount) : 0,
            subscriptionStartDate: user.subscriptionStartDate || null,
            subscriptionEndDate: user.subscriptionEndDate || null
          };
        });
        
        setUsers(mappedUsers);
        
        // Store pagination info
        if (result.pagination) {
          setPagination(result.pagination);
        }
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

  // Fetch users when page changes
  useEffect(() => {
    fetchUsers(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Reset to page 1 when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter]);

  // Initial load
  useEffect(() => {
    fetchUsers(1);
    fetchMemberships();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        phone: userData.phone || undefined,
        username: userData.phone || userData.email || `user_${Date.now()}`,
        email: userData.email || undefined,
        password: userData.password || "default123",
        role: backendRole,
        isActive: userData.is_active !== undefined ? userData.is_active : true,
        membership_type: userData.membership_type !== undefined ? userData.membership_type : null,
        wallet: userData.wallet || undefined,
        subscriptionStartDate: userData.subscriptionStartDate || null,
        subscriptionEndDate: userData.subscriptionEndDate || null
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
          device: userData.device,
          wallet: apiUser.wallet || userData.wallet,
          income: apiUser.income !== undefined ? parseFloat(apiUser.income) : 0,
          publishedFileCount: apiUser.publishedFileCount !== undefined ? parseInt(apiUser.publishedFileCount) : 0
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
        phone: userData.phone || undefined,
        email: userData.email || undefined,
        role: backendRole,
        isActive: userData.is_active !== undefined ? userData.is_active : true,
        membership_type: userData.membership_type !== undefined ? userData.membership_type : null,
        wallet: userData.wallet || undefined,
        subscriptionStartDate: userData.subscriptionStartDate || null,
        subscriptionEndDate: userData.subscriptionEndDate || null
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
                wallet: apiUser.wallet !== undefined ? apiUser.wallet : userData.wallet,
                income: apiUser.income !== undefined ? parseFloat(apiUser.income) : (userData.income || 0),
                publishedFileCount: apiUser.publishedFileCount !== undefined ? parseInt(apiUser.publishedFileCount) : (userData.publishedFileCount || 0),
                subscriptionStartDate: apiUser.subscriptionStartDate !== undefined ? apiUser.subscriptionStartDate : (userData.subscriptionStartDate || null),
                subscriptionEndDate: apiUser.subscriptionEndDate !== undefined ? apiUser.subscriptionEndDate : (userData.subscriptionEndDate || null),
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

  // Charge user income
  const chargeUserIncome = async (userId: number, amount: number) => {
    try {
      // Validate inputs
      if (!userId || userId <= 0) {
        throw new Error('Хэрэглэгчийн ID буруу байна');
      }
  
      if (!amount || amount <= 0 || isNaN(amount)) {
        throw new Error('Мөнгөн дүн буруу байна');
      }
  
      // Format amount to 2 decimal places
      const formattedAmount = parseFloat(amount.toFixed(2));
      
      setIsCharging(true);
      setError(null);
      setSuccess(null);
      
      console.log(`🔄 Орлого нэмэх: Хэрэглэгч ${userId}, Дүн: ${formattedAmount}`);
  
      // Find the current user before update for comparison
      const currentUser = users.find(u => u.id === userId);
      const currentIncome = currentUser?.income || 0;
      console.log(`📊 Одоогийн орлого: ${currentIncome}`);
  
      const response = await fetch(`${API_URL}/${userId}/charge-income`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount: formattedAmount }),
      });
  
      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        
        // Handle authentication errors
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/');
          throw new Error('Нэвтрэх эрх хүчингүй боллоо. Дахин нэвтэрнэ үү.');
        }
        
        // Handle specific error statuses
        if (response.status === 400) {
          throw new Error(errorData?.error || errorData?.message || 'Мэдээлэл буруу байна');
        }
        
        if (response.status === 404) {
          throw new Error('Хэрэглэгч олдсонгүй');
        }
        
        throw new Error(errorData?.error || errorData?.message || `Алдаа гарлаа. Статус код: ${response.status}`);
      }
  
      const result = await response.json();
      
      console.log('📨 Серверээс ирсэн хариу:', result);
  
      // Validate response structure
      if (!result || typeof result !== 'object') {
        throw new Error('Серверээс буруу хариу ирлээ');
      }
  
      // Extract new income with multiple fallbacks
      let newIncome: number;
      
      if (result.newIncome !== undefined) {
        newIncome = typeof result.newIncome === 'number' 
          ? result.newIncome 
          : parseFloat(result.newIncome);
      } else if (result.user?.income !== undefined) {
        newIncome = typeof result.user.income === 'number' 
          ? result.user.income 
          : parseFloat(result.user.income);
      } else if (result.data?.transaction?.newIncome !== undefined) {
        newIncome = typeof result.data.transaction.newIncome === 'number'
          ? result.data.transaction.newIncome
          : parseFloat(result.data.transaction.newIncome);
      } else {
        // Calculate from current if no server value
        newIncome = currentIncome + formattedAmount;
      }
  
      // Validate the calculated newIncome
      if (isNaN(newIncome)) {
        console.warn('❌ Орлогын утга тоо биш байна:', newIncome);
        newIncome = currentIncome + formattedAmount; // Use calculated value
      }
  
      console.log(`✅ Шинэ орлого: ${newIncome} (${typeof newIncome})`);
  
      // Update the user in state - use functional update for reliability
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => {
          if (user.id === userId) {
            const updatedUser = {
              ...user,
              income: newIncome,
              updatedAt: new Date().toISOString() // Update timestamp
            };
            console.log(`🔄 Хэрэглэгч шинэчлэгдлээ:`, updatedUser);
            return updatedUser;
          }
          return user;
        });
        
        // Verify the update
        const updatedUser = updatedUsers.find(u => u.id === userId);
        console.log(`🔍 Шинэчлэгдсэн хэрэглэгчийн орлого:`, updatedUser?.income);
        
        return updatedUsers;
      });
  
      // Close dialog and reset
      setChargeIncomeDialog({ open: false });
      setChargeAmount("");
      setConfirmCharge(false);
      
      // Show success message
      const successMsg = result.message || 
        `Амжилттай ${formatPrice(formattedAmount)}₮ нэмлээ. Шинэ орлого: ${formatPrice(newIncome)}₮`;
      
      setSuccess(successMsg);
      
      // Optional: Log to analytics or send notification
      console.log(`🎉 Орлого амжилттай нэмэгдлээ! Хэрэглэгч: ${userId}, Хуучин: ${currentIncome}₮, Шинэ: ${newIncome}₮`);
      
      // Refresh the users list from server to get the latest data
      setTimeout(() => fetchUsers(currentPage), 500);
  
    } catch (err) {
      console.error('❌ Орлого нэмэхэд алдаа гарлаа:', err);
      
      let errorMessage = 'Орлого нэмэхэд алдаа гарлаа';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Show user-friendly error messages
      const userFriendlyErrors: Record<string, string> = {
        'NetworkError': 'Сүлжээний алдаа гарлаа. Интернэт холболтоо шалгана уу.',
        'Failed to fetch': 'Серверт холбогдоход алдаа гарлаа.',
        'Хэрэглэгч олдсонгүй': 'Хэрэглэгчийн мэдээлэл олдсонгүй.',
        'Мөнгөн дүн буруу байна': 'Мөнгөн дүн буруу байна. Зөв дүнг оруулна уу.',
      };
      
      if (userFriendlyErrors[errorMessage]) {
        errorMessage = userFriendlyErrors[errorMessage];
      }
      
      setError(errorMessage);
      
      // Keep dialog open on error for user to retry
      // setChargeIncomeDialog({ open: true });
      
    } finally {
      setIsCharging(false);
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

  // Filter users based on status filter (search and role are handled by API)
  const filteredUsers = users.filter(user => {
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    return matchesStatus;
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

      {/* User Form - Drawer from Right */}
      <Sheet open={showForm} onOpenChange={(open) => { 
        if (!open) { 
          setShowForm(false); 
          setEditingUser(null); 
        } 
      }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="px-0 pt-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <div className="px-6">
              <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {editingUser ? "Хэрэглэгч засах" : "Шинэ хэрэглэгч үүсгэх"}
              </SheetTitle>
            </div>
          </SheetHeader>
          <div className="px-6 py-6">
            <UserForm
              user={editingUser || undefined}
              onSubmit={async (userData) => {
                if (editingUser) {
                  await updateUser(userData);
                } else {
                  await createUser(userData);
                }
              }}
              onCancel={() => { setShowForm(false); setEditingUser(null); }}
              isLoading={isFormLoading}
              memberships={memberships}
            />
          </div>
        </SheetContent>
      </Sheet>

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
                  <th className="text-left p-3">Хэтэвч</th>
                  <th className="text-left p-3">Үүрэг</th>
                  <th className="text-left p-3">Гишүүнчлэл</th>
                  <th className="text-left p-3">Төлөв</th>
                  <th className="text-left p-3">Орлого</th>
                  <th className="text-left p-3">Нийтлэл</th>
                  <th className="text-left p-3">Захиалга</th>
                  <th className="text-left p-3">Зарцуулалт</th>
                  <th className="text-left p-3">Гишүүнчлэлийн хугацаа</th>
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
                      <div className="text-sm">
                        {user.wallet ? (
                          <span className="font-medium text-blue-600">{user.wallet}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
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
                      <div className="font-medium text-green-600">
                        {formatPrice(user.income || 0)}
                      </div>
                      <div className="text-xs text-gray-500">нийт орлого</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{user.publishedFileCount || 0}</div>
                      <div className="text-xs text-gray-500">нийтлэгдсэн</div>
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
                      <div className="text-xs">
                        {user.subscriptionStartDate ? (
                          <div className="text-gray-600">Эхлэх: {formatDate(user.subscriptionStartDate)}</div>
                        ) : (
                          <div className="text-gray-400">-</div>
                        )}
                        {user.subscriptionEndDate ? (
                          <div className={`mt-1 ${new Date(user.subscriptionEndDate) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                            Дуусах: {formatDate(user.subscriptionEndDate)}
                          </div>
                        ) : (
                          <div className="text-gray-400">-</div>
                        )}
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
                          variant="ghost"
                          onClick={() => setViewingUser(user)}
                          title="Харах"
                        >
                          <Eye className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setEditingUser(user); setShowForm(true); setError(null); }}
                          title="Засах"
                        >
                          <Edit className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setChargeIncomeDialog({open: true, user});
                            setChargeAmount("");
                            setConfirmCharge(false);
                            setError(null);
                          }}
                          title="Орлого нэмэх"
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteDialog({open: true, userId: user.id})}
                          title="Устгах"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={14} className="p-8 text-center text-gray-500">
                      Хэрэглэгч олдсонгүй
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-gray-600">
                Нийт {pagination.total} хэрэглэгч, {pagination.page}/{pagination.totalPages} хуудас
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
                disabled={isLoading}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Хэрэглэгчийн мэдээлэл</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Бүтэн нэр</Label>
                  <div className="mt-1 text-sm">{viewingUser.full_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">ID</Label>
                  <div className="mt-1 text-sm">{viewingUser.id}</div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Утасны дугаар</Label>
                  <div className="mt-1 text-sm">{viewingUser.phone || "-"}</div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Имэйл</Label>
                  <div className="mt-1 text-sm">{viewingUser.email || "-"}</div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Үүрэг</Label>
                  <div className="mt-1">
                    <Badge className={getRoleColor(viewingUser.role)}>
                      {viewingUser.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Төлөв</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(viewingUser.is_active)}>
                      {viewingUser.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Гишүүнчлэл</Label>
                  <div className="mt-1">
                    {viewingUser.membership_type ? (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {memberships.find(m => m.id === viewingUser.membership_type)?.name || 'Unknown'}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-400">Гишүүнчлэлгүй</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Гишүүнчлэл эхлэх огноо</Label>
                  <div className="mt-1 text-sm">
                    {viewingUser.subscriptionStartDate ? formatDate(viewingUser.subscriptionStartDate) : "-"}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Гишүүнчлэл дуусах огноо</Label>
                  <div className={`mt-1 text-sm ${
                    viewingUser.subscriptionEndDate && new Date(viewingUser.subscriptionEndDate) < new Date() 
                      ? 'text-red-600 font-semibold' 
                      : ''
                  }`}>
                    {viewingUser.subscriptionEndDate ? formatDate(viewingUser.subscriptionEndDate) : "-"}
                    {viewingUser.subscriptionEndDate && new Date(viewingUser.subscriptionEndDate) < new Date() && (
                      <span className="ml-2 text-xs">(Дууссан)</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Байршил</Label>
                  <div className="mt-1 text-sm">{viewingUser.location || "-"}</div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Төхөөрөмж</Label>
                  <div className="mt-1 text-sm">
                    {viewingUser.device === 'mobile' ? 'Утас' : 
                     viewingUser.device === 'desktop' ? 'Компьютер' : 
                     viewingUser.device === 'tablet' ? 'Таблет' : '-'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Захиалгын тоо</Label>
                  <div className="mt-1 text-sm">{viewingUser.total_orders || 0}</div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Зарцуулалт</Label>
                  <div className="mt-1 text-sm text-green-600 font-medium">
                    {formatPrice(viewingUser.total_spent || 0)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Бүртгүүлсэн огноо</Label>
                  <div className="mt-1 text-sm">{formatDate(viewingUser.createdAt)}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(viewingUser.createdAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Сүүлд шинэчлэгдсэн</Label>
                  <div className="mt-1 text-sm">{formatDate(viewingUser.updatedAt)}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(viewingUser.updatedAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingUser(null)}>
              Хаах
            </Button>
            {viewingUser && (
              <Button 
                onClick={() => {
                  setEditingUser(viewingUser);
                  setViewingUser(null);
                  setShowForm(true);
                  setError(null);
                }}
              >
                Засах
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Charge Income Dialog */}
      <Dialog open={chargeIncomeDialog.open} onOpenChange={(open) => {
        if (!open) {
          setChargeIncomeDialog({open: false});
          setChargeAmount("");
          setConfirmCharge(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Plus className="h-5 w-5 text-purple-600" />
              </div>
              Орлого нэмэх
            </DialogTitle>
          </DialogHeader>
          {chargeIncomeDialog.user && (
            <div className="space-y-4 py-4">
              {!confirmCharge ? (
                <>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Хэрэглэгч</div>
                    <div className="font-semibold text-lg">{chargeIncomeDialog.user.full_name}</div>
                    <div className="text-sm text-gray-500">Одоогийн орлого: <span className="font-semibold text-green-600">{formatPrice(chargeIncomeDialog.user.income || 0)}</span></div>
                  </div>
                  
                  <div>
                    <Label htmlFor="chargeAmount" className="text-sm font-semibold">
                      Нэмэх дүн (₮)
                    </Label>
                    <Input
                      id="chargeAmount"
                      type="number"
                      value={chargeAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                          setChargeAmount(value);
                        }
                      }}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="mt-2 text-lg"
                      autoFocus
                    />
                    {chargeAmount && !isNaN(parseFloat(chargeAmount)) && parseFloat(chargeAmount) > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Шинэ орлого: <span className="font-bold text-green-600">
                          {formatPrice((chargeIncomeDialog.user.income || 0) + parseFloat(chargeAmount))}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                        <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Та итгэлтэй байна уу?</div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                          <div>Хэрэглэгч: <span className="font-semibold">{chargeIncomeDialog.user.full_name}</span></div>
                          <div>Одоогийн орлого: <span className="font-semibold">{formatPrice(chargeIncomeDialog.user.income || 0)}</span></div>
                          <div>Нэмэх дүн: <span className="font-semibold text-green-600">{formatPrice(parseFloat(chargeAmount))}</span></div>
                          <div className="pt-2 border-t border-yellow-200 dark:border-yellow-800">
                            Шинэ орлого: <span className="font-bold text-lg text-green-600">
                              {formatPrice((chargeIncomeDialog.user.income || 0) + parseFloat(chargeAmount))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <div className="flex gap-2 w-full">
              {!confirmCharge ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setChargeIncomeDialog({open: false});
                      setChargeAmount("");
                    }}
                    className="flex-1"
                  >
                    Цуцлах
                  </Button>
                  <Button 
                    onClick={() => {
                      const amount = parseFloat(chargeAmount);
                      if (amount && amount > 0) {
                        setConfirmCharge(true);
                      } else {
                        setError('Хүчинтэй дүн оруулна уу');
                      }
                    }}
                    disabled={!chargeAmount || isNaN(parseFloat(chargeAmount)) || parseFloat(chargeAmount) <= 0}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    Үргэлжлүүлэх
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setConfirmCharge(false)}
                    className="flex-1"
                    disabled={isCharging}
                  >
                    Буцах
                  </Button>
                  <Button 
                    onClick={() => {
                      if (chargeIncomeDialog.user) {
                        chargeUserIncome(chargeIncomeDialog.user.id, parseFloat(chargeAmount));
                      }
                    }}
                    disabled={isCharging}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isCharging ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Нэмж байна...
                      </>
                    ) : (
                      'Тийм, нэмэх'
                    )}
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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