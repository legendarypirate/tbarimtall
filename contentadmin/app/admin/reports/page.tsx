"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Calendar,
  Package,
  Mail,
  Phone,
  Eye,
  ExternalLink
} from "lucide-react";

interface CopyrightReport {
  id: number;
  productId: number;
  userId?: number;
  email?: string;
  phone?: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  processedBy?: number;
  processedAt?: string;
  createdAt: string;
  product?: {
    id: number;
    uuid: string;
    title: string;
    isActive: boolean;
  };
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
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

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

export default function ReportsPage() {
  const [reports, setReports] = useState<CopyrightReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<CopyrightReport | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [adminComment, setAdminComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [statusFilter, searchQuery]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetchAPI(`/copyright-reports?${params.toString()}`);
      
      if (response.reports) {
        let filteredReports = response.reports;
        
        // Client-side search filtering
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredReports = filteredReports.filter((report: CopyrightReport) => {
            return (
              report.product?.title?.toLowerCase().includes(query) ||
              report.comment?.toLowerCase().includes(query) ||
              report.email?.toLowerCase().includes(query) ||
              report.phone?.includes(query) ||
              report.user?.username?.toLowerCase().includes(query)
            );
          });
        }
        
        setReports(filteredReports);
      }
    } catch (error: any) {
      console.error('Error fetching copyright reports:', error);
      alert('Мэдэгдэл авахад алдаа гарлаа: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId: number) => {
    try {
      setProcessing(true);
      await fetchAPI(`/copyright-reports/${reportId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({
          adminComment: adminComment.trim()
        }),
      });
      
      setShowModal(false);
      setAdminComment('');
      setSelectedReport(null);
      await fetchReports();
      alert('Мэдэгдэл баталгаажлаа');
    } catch (error: any) {
      console.error('Error approving report:', error);
      alert('Баталгаажуулахад алдаа гарлаа: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (reportId: number) => {
    try {
      setProcessing(true);
      await fetchAPI(`/copyright-reports/${reportId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({
          adminComment: adminComment.trim()
        }),
      });
      
      setShowModal(false);
      setAdminComment('');
      setSelectedReport(null);
      await fetchReports();
      alert('Мэдэгдэл татгалзлаа');
    } catch (error: any) {
      console.error('Error rejecting report:', error);
      alert('Татгалзуулахад алдаа гарлаа: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (report: CopyrightReport, action: 'approve' | 'reject') => {
    setSelectedReport(report);
    setModalAction(action);
    setAdminComment('');
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Хүлээгдэж байна', icon: Clock, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      approved: { label: 'Баталгаажсан', icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      rejected: { label: 'Татгалзсан', icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Зохиогчийн эрхийн мэдэгдэл</h1>
          <p className="text-muted-foreground mt-1">
            Бүтээгдэхүүний зохиогчийн эрхийн мэдэгдлүүдийг удирдах
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Бүтээгдэхүүн, тайлбар, имэйл, утасны дугаар..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                Бүгд
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
              >
                <Clock className="w-4 h-4 mr-2" />
                Хүлээгдэж байна
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('approved')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Баталгаажсан
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('rejected')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Татгалзсан
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Мэдэгдлийн жагсаалт ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Ачааллаж байна...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Мэдэгдэл олдсонгүй</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <h3 className="font-semibold text-lg">
                                {report.product?.title || 'Бүтээгдэхүүн олдсонгүй'}
                              </h3>
                              {report.product && (
                                <span className={`text-xs px-2 py-1 rounded ${
                                  report.product.isActive 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {report.product.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Бүтээгдэхүүний ID: {report.productId}
                            </p>
                          </div>
                          {getStatusBadge(report.status)}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Мэдэгдлийн тайлбар:</p>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {report.comment}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {report.user ? (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Хэрэглэгч:</span>
                                <span className="font-medium">
                                  {report.user.fullName || report.user.username}
                                </span>
                              </div>
                            ) : (
                              <>
                                {report.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Утас:</span>
                                    <span className="font-medium">{report.phone}</span>
                                  </div>
                                )}
                              </>
                            )}
                            {report.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Имэйл:</span>
                                <span className="font-medium">{report.email}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Огноо:</span>
                              <span className="font-medium">{formatDate(report.createdAt)}</span>
                            </div>
                          </div>

                          {report.adminComment && (
                            <div className="mt-2 p-3 bg-muted rounded-lg">
                              <p className="text-sm font-medium mb-1">Админы тайлбар:</p>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {report.adminComment}
                              </p>
                              {report.processedByUser && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Боловсруулсан: {report.processedByUser.fullName || report.processedByUser.username} 
                                  {report.processedAt && ` - ${formatDate(report.processedAt)}`}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {report.status === 'pending' && (
                        <div className="flex flex-col gap-2 md:min-w-[200px]">
                          <Button
                            onClick={() => openModal(report, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Баталгаажуулах
                          </Button>
                          <Button
                            onClick={() => openModal(report, 'reject')}
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Татгалзах
                          </Button>
                          <Button
                            onClick={() => {
                              if (report.product?.uuid) {
                                window.open(`${FRONTEND_URL}/products/${report.product.uuid}`, '_blank');
                              } else if (report.productId) {
                                window.open(`${FRONTEND_URL}/products/${report.productId}`, '_blank');
                              }
                            }}
                            variant="outline"
                            disabled={!report.product}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Бүтээгдэхүүн харах
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve/Reject Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {modalAction === 'approve' ? 'Мэдэгдэл баталгаажуулах' : 'Мэдэгдэл татгалзах'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Бүтээгдэхүүн:</p>
                <p className="text-sm text-muted-foreground">{selectedReport.product?.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Мэдэгдлийн тайлбар:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedReport.comment}
                </p>
              </div>
              {modalAction === 'approve' && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Баталгаажуулахад бүтээгдэхүүний <strong>isActive</strong> талбар <strong>false</strong> болно.
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="adminComment">
                  Тайлбар <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="adminComment"
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Тайлбар оруулна уу..."
                  rows={4}
                  className="mt-2"
                />
              </div>
              <div className="flex flex-col gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedReport.product?.uuid) {
                      window.open(`${FRONTEND_URL}/products/${selectedReport.product.uuid}`, '_blank');
                    } else if (selectedReport.productId) {
                      window.open(`${FRONTEND_URL}/products/${selectedReport.productId}`, '_blank');
                    }
                  }}
                  disabled={!selectedReport.product}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Бүтээгдэхүүн харах
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (!adminComment.trim()) {
                        alert('Тайлбар шаардлагатай');
                        return;
                      }
                      if (modalAction === 'approve') {
                        handleApprove(selectedReport.id);
                      } else {
                        handleReject(selectedReport.id);
                      }
                    }}
                    disabled={processing || !adminComment.trim()}
                    className={modalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {processing ? 'Боловсруулж байна...' : (modalAction === 'approve' ? 'Баталгаажуулах' : 'Татгалзах')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setAdminComment('');
                      setSelectedReport(null);
                    }}
                    disabled={processing}
                  >
                    Цуцлах
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

