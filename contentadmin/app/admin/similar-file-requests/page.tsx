"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Calendar,
  Package,
  Eye
} from "lucide-react";

interface SimilarFileRequest {
  id: string;
  userId: number;
  productId: number;
  authorId: number;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNotes?: string;
  processedAt?: string;
  processedBy?: number;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
    fullName?: string;
    phone?: string;
  };
  product?: {
    id: number;
    title: string;
    price: string;
    image?: string;
    uuid?: string;
  };
  author?: {
    id: number;
    username: string;
    fullName?: string;
    email?: string;
  };
  processedByUser?: {
    id: number;
    username: string;
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

export default function SimilarFileRequestsPage() {
  const [requests, setRequests] = useState<SimilarFileRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<SimilarFileRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'view'>('view');
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

      const response = await fetchAPI(`/similar-file-requests/admin/all?${params.toString()}`);
      
      if (response.requests) {
        setRequests(response.requests);
      }
      
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages
        }));
      }
    } catch (error: any) {
      console.error('Error fetching similar file requests:', error);
      alert('Хүсэлт авахад алдаа гарлаа: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setProcessing(true);
      await fetchAPI(`/similar-file-requests/admin/${requestId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({
          adminNotes: adminNotes || undefined
        }),
      });
      
      setShowModal(false);
      setAdminNotes('');
      setSelectedRequest(null);
      await fetchRequests();
      alert('Хүсэлт баталгаажуулагдлаа');
    } catch (error: any) {
      console.error('Error approving request:', error);
      alert('Алдаа гарлаа: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setProcessing(true);
      await fetchAPI(`/similar-file-requests/admin/${requestId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({
          adminNotes: adminNotes || undefined
        }),
      });
      
      setShowModal(false);
      setAdminNotes('');
      setSelectedRequest(null);
      await fetchRequests();
      alert('Хүсэлт татгалзсан');
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      alert('Алдаа гарлаа: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Хүлээгдэж буй', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { label: 'Баталгаажсан', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Татгалзсан', color: 'bg-red-100 text-red-800', icon: XCircle },
      completed: { label: 'Дууссан', color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ижил төстэй файл захиалгын хүсэлт</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Хэрэглэгчдийн ижил төстэй файл захиалгын хүсэлтүүдийг удирдах</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Хайх..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('all');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                Бүгд
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('pending');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                Хүлээгдэж буй
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('approved');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                Баталгаажсан
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('rejected');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                Татгалзсан
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Хүсэлтүүд ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Ачааллаж байна...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-600 dark:text-gray-400">Хүсэлт олдсонгүй</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(request.status)}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(request.createdAt)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            Хэрэглэгч: {request.user?.fullName || request.user?.username || 'N/A'}
                          </span>
                          {request.user?.phone && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({request.user.phone})
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            Бараа: {request.product?.title || 'N/A'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            Нийтлэгч: {request.author?.fullName || request.author?.username || 'N/A'}
                          </span>
                        </div>
                        
                        {request.description && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>Тайлбар:</strong> {request.description}
                            </p>
                          </div>
                        )}
                        
                        {request.adminNotes && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              <strong>Админий тайлбар:</strong> {request.adminNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setModalAction('view');
                          setAdminNotes('');
                          setShowModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Дэлгэрэнгүй
                      </Button>
                      
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setModalAction('approve');
                              setAdminNotes('');
                              setShowModal(true);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Баталгаажуулах
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setModalAction('reject');
                              setAdminNotes('');
                              setShowModal(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Татгалзах
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
          >
            Өмнөх
          </Button>
          <span className="flex items-center px-4">
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
            disabled={pagination.page === pagination.totalPages}
          >
            Дараах
          </Button>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>
                {modalAction === 'view' && 'Хүсэлтийн дэлгэрэнгүй'}
                {modalAction === 'approve' && 'Хүсэлт баталгаажуулах'}
                {modalAction === 'reject' && 'Хүсэлт татгалзах'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div>
                  <Label>Хэрэглэгч</Label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedRequest.user?.fullName || selectedRequest.user?.username || 'N/A'}
                    {selectedRequest.user?.email && ` (${selectedRequest.user.email})`}
                    {selectedRequest.user?.phone && ` - ${selectedRequest.user.phone}`}
                  </p>
                </div>
                
                <div>
                  <Label>Бараа</Label>
                  <p className="text-gray-900 dark:text-white">{selectedRequest.product?.title || 'N/A'}</p>
                </div>
                
                <div>
                  <Label>Нийтлэгч</Label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedRequest.author?.fullName || selectedRequest.author?.username || 'N/A'}
                    {selectedRequest.author?.email && ` (${selectedRequest.author.email})`}
                  </p>
                </div>
                
                {selectedRequest.description && (
                  <div>
                    <Label>Тайлбар</Label>
                    <p className="text-gray-700 dark:text-gray-300">{selectedRequest.description}</p>
                  </div>
                )}
                
                <div>
                  <Label>Статус</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                
                <div>
                  <Label>Огноо</Label>
                  <p className="text-gray-700 dark:text-gray-300">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>

              {(modalAction === 'approve' || modalAction === 'reject') && (
                <div>
                  <Label htmlFor="adminNotes">Админий тайлбар (сонголттой)</Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Тайлбар оруулах..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {(modalAction === 'approve' || modalAction === 'reject') && (
                  <>
                    <Button
                      onClick={() => {
                        if (modalAction === 'approve') {
                          handleApprove(selectedRequest.id);
                        } else {
                          handleReject(selectedRequest.id);
                        }
                      }}
                      disabled={processing}
                      className={modalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {processing ? 'Хүлээгдэж байна...' : (modalAction === 'approve' ? 'Баталгаажуулах' : 'Татгалзах')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowModal(false);
                        setSelectedRequest(null);
                        setAdminNotes('');
                      }}
                      disabled={processing}
                    >
                      Цуцлах
                    </Button>
                  </>
                )}
                {modalAction === 'view' && (
                  <Button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedRequest(null);
                    }}
                  >
                    Хаах
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

