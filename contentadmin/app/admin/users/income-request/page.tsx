"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  DollarSign, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Calendar,
  Building2,
  CreditCard
} from "lucide-react";

interface WithdrawalRequest {
  id: string;
  userId: number;
  amount: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  bankAccount?: string;
  bankName?: string;
  accountHolderName?: string;
  notes?: string;
  adminNotes?: string;
  processedAt?: string;
  processedBy?: number;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
    fullName?: string;
  };
  processedByUser?: {
    id: number;
    username: string;
    email: string;
    fullName?: string;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}/api${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `API error: ${response.statusText}`);
  }

  return response.json();
}

export default function IncomeRequestPage() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalStatus, setModalStatus] = useState<'pending' | 'approved' | 'rejected' | 'completed'>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, searchQuery, pagination.page]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetchAPI(`/withdrawals?${params.toString()}`);
      
      if (response.withdrawalRequests) {
        setRequests(response.withdrawalRequests);
      }
      
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages
        }));
      }
    } catch (error: any) {
      console.error('Error fetching withdrawal requests:', error);
      alert('Хүсэлт авахад алдаа гарлаа: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: 'pending' | 'approved' | 'rejected' | 'completed') => {
    try {
      setProcessing(true);
      await fetchAPI(`/withdrawals/${requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          adminNotes: adminNotes || undefined
        }),
      });
      
      setShowModal(false);
      setAdminNotes('');
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert('Статус шинэчлэхэд алдаа гарлаа: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (request: WithdrawalRequest, status: 'approved' | 'rejected' | 'completed') => {
    setSelectedRequest(request);
    setModalStatus(status);
    setAdminNotes(request.adminNotes || '');
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'approved':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Дууссан';
      case 'approved':
        return 'Зөвшөөрсөн';
      case 'rejected':
        return 'Татгалзсан';
      default:
        return 'Хүлээгдэж байна';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Орлогын хүсэлт</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Нийтлэгчдийн орлогын хүсэлтийг удирдах
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Шүүлт</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Хайх</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Хэрэглэгчийн нэр, имэйл..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Label htmlFor="status">Статус</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Бүгд</option>
                <option value="pending">Хүлээгдэж байна</option>
                <option value="approved">Зөвшөөрсөн</option>
                <option value="rejected">Татгалзсан</option>
                <option value="completed">Дууссан</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Хүсэлтийн жагсаалт</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Ачааллаж байна...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Хүсэлт олдсонгүй</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {request.user?.fullName || request.user?.username || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {request.user?.email}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Дүн:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {parseFloat(request.amount).toLocaleString()}₮
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Огноо:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {new Date(request.createdAt).toLocaleDateString('mn-MN')}
                          </span>
                        </div>
                        {request.bankName && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Банк:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {request.bankName}
                            </span>
                          </div>
                        )}
                        {request.bankAccount && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Данс:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {request.bankAccount}
                            </span>
                          </div>
                        )}
                      </div>

                      {request.notes && (
                        <div className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Тайлбар: </span>
                          <span className="text-gray-900 dark:text-white">{request.notes}</span>
                        </div>
                      )}

                      {request.adminNotes && (
                        <div className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded">
                          <span className="text-gray-600 dark:text-gray-400">Админий тайлбар: </span>
                          <span className="text-gray-900 dark:text-white">{request.adminNotes}</span>
                        </div>
                      )}

                      {request.processedByUser && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Боловсруулсан: {request.processedByUser.fullName || request.processedByUser.username} 
                          {request.processedAt && ` - ${new Date(request.processedAt).toLocaleDateString('mn-MN')}`}
                        </div>
                      )}
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex flex-col gap-2 md:w-48">
                        <Button
                          onClick={() => openModal(request, 'approved')}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Зөвшөөрөх
                        </Button>
                        <Button
                          onClick={() => openModal(request, 'rejected')}
                          variant="destructive"
                          className="w-full"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Татгалзах
                        </Button>
                      </div>
                    )}

                    {request.status === 'approved' && (
                      <div className="flex flex-col gap-2 md:w-48">
                        <Button
                          onClick={() => openModal(request, 'completed')}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Шилжүүлсэн
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Нийт {pagination.total} хүсэлт
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Өмнөх
                </Button>
                <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Дараах
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {modalStatus === 'approved' && 'Хүсэлт зөвшөөрөх'}
                {modalStatus === 'rejected' && 'Хүсэлт татгалзах'}
                {modalStatus === 'completed' && 'Шилжүүлсэн гэж тэмдэглэх'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Хэрэглэгч: <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedRequest.user?.fullName || selectedRequest.user?.username}
                  </span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Дүн: <span className="font-semibold text-gray-900 dark:text-white">
                    {parseFloat(selectedRequest.amount).toLocaleString()}₮
                  </span>
                </p>
              </div>

              <div>
                <Label htmlFor="adminNotes">Админий тайлбар (сонгох)</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Нэмэлт тайлбар оруулах..."
                  className="mt-2"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setShowModal(false);
                    setAdminNotes('');
                    setSelectedRequest(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Цуцлах
                </Button>
                <Button
                  onClick={() => handleStatusUpdate(selectedRequest.id, modalStatus)}
                  disabled={processing}
                  className={`flex-1 ${
                    modalStatus === 'approved' || modalStatus === 'completed'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
                >
                  {processing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    'Баталгаажуулах'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

