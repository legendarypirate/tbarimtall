"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Edit, Truck, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { ordersApi } from "@/lib/api";

type OrderItem = {
  name: string;
  qty: number;
  price: number;
};

type Order = {
  id: string;
  created_at: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_status: "paid" | "unpaid" | "refunded";
  items: OrderItem[];
  total: number;
  customer_name?: string;
  customer_phone?: string;
  address?: string;
  user?: {
    id: number;
    username: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  product?: {
    id: number;
    title: string;
    price: number;
    author?: {
      id: number;
      username: string;
      fullName?: string;
      email?: string;
      phone?: string;
      membership?: {
        id: number;
        name: string;
        percentage: number;
      };
    };
  };
  commission?: {
    journalistAmount: number;
    tbarimtAmount: number;
    commissionPercentage: number;
  };
};

export default function AdminOrderList() {
  return <OrderPage />;
}

function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map backend order status to frontend status
  const mapOrderStatus = (status: number | string): Order["status"] => {
    if (typeof status === 'string') {
      switch (status.toLowerCase()) {
        case 'completed': return "delivered";
        case 'processing': return "processing";
        case 'shipped': return "shipped";
        case 'cancelled': return "cancelled";
        default: return "pending";
      }
    }
    switch (status) {
      case 0: return "processing";
      case 1: return "shipped";
      case 2: return "delivered";
      case 3: return "cancelled";
      default: return "pending";
    }
  };

  // Map backend order status to frontend payment status
  // QPay orders: status 'completed' means paid, 'pending' means unpaid, 'cancelled' means refunded
  const mapPaymentStatus = (orderStatus: string, paymentStatus?: number | string): Order["payment_status"] => {
    // First check if there's an explicit paymentStatus field (legacy support)
    if (paymentStatus !== undefined && paymentStatus !== null) {
      if (typeof paymentStatus === 'string') {
        switch (paymentStatus.toLowerCase()) {
          case 'paid': return "paid";
          case 'refunded': return "refunded";
          default: return "unpaid";
        }
      }
      switch (paymentStatus) {
        case 1: return "paid";
        case 3: return "refunded";
        case 0:
        case 2:
        default: return "unpaid";
      }
    }
    
    // Map order status to payment status
    // This is the primary way to determine payment status for QPay orders
    if (typeof orderStatus === 'string') {
      switch (orderStatus.toLowerCase()) {
        case 'completed': return "paid";
        case 'cancelled': return "refunded";
        case 'failed': return "unpaid";
        case 'pending':
        default: return "unpaid";
      }
    }
    
    return "unpaid";
  };

  // Format date
  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await ordersApi.getAll();
      
      if (data.orders && Array.isArray(data.orders)) {
        // Transform backend data to frontend format
        const transformedOrders: Order[] = data.orders.map((order: any) => ({
          id: order.id || String(order.id),
          created_at: formatDate(order.createdAt || order.created_at),
          status: mapOrderStatus(order.status || 0),
          payment_status: mapPaymentStatus(order.status || 'pending', order.paymentStatus || order.payment_status),
          items: order.product ? [{
            name: order.product.title || order.product.name || "Бараа",
            qty: order.quantity || 1,
            price: parseFloat(order.amount || order.price || 0),
          }] : [],
          total: parseFloat(order.amount || 0),
          customer_name: order.user?.fullName || order.user?.username || "Хэрэглэгч",
          customer_phone: order.user?.phone || "",
          address: order.address || "",
          user: order.user,
          product: order.product,
          commission: order.commission,
        }));
        
        setOrders(transformedOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Update order status via API
  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      // Map frontend status to backend status
      const statusMap: Record<Order["status"], string> = {
        pending: 'pending',
        processing: 'processing',
        shipped: 'shipped',
        delivered: 'completed',
        cancelled: 'cancelled',
      };

      const backendStatus = statusMap[newStatus] || newStatus;

      await ordersApi.update(orderId, { status: backendStatus });

      // Refresh orders after update
      await fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    }
  };

  // Update payment status via API
  const updatePaymentStatus = async (orderId: string, newPaymentStatus: Order["payment_status"]) => {
    try {
      // Map frontend payment status to backend status
      const paymentMap: Record<Order["payment_status"], string> = {
        paid: 'paid',
        unpaid: 'unpaid',
        refunded: 'refunded',
      };

      const backendPaymentStatus = paymentMap[newPaymentStatus] || newPaymentStatus;

      await ordersApi.update(orderId, { paymentStatus: backendPaymentStatus });

      // Refresh orders after update
      await fetchOrders();
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update payment status');
    }
  };

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    processing: "bg-blue-100 text-blue-800 border-blue-200",
    shipped: "bg-purple-100 text-purple-800 border-purple-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  const paymentColor = {
    paid: "bg-green-100 text-green-700 border-green-200",
    unpaid: "bg-red-100 text-red-700 border-red-200",
    refunded: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const statusOptions = [
    { value: "pending", label: "Хүлээгдэж байна", icon: "⏳" },
    { value: "processing", label: "Боловсруулж байна", icon: "🔄" },
    { value: "shipped", label: "Хүргэлтэнд гарсан", icon: "🚚" },
    { value: "delivered", label: "Хүргэгдсэн", icon: "✅" },
    { value: "cancelled", label: "Цуцлагдсан", icon: "❌" },
  ];

  const paymentOptions = [
    { value: "paid", label: "Төлбөр төлөгдсөн" },
    { value: "unpaid", label: "Төлбөр төлөгдөөгүй" },
    { value: "refunded", label: "Буцаагдсан" },
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      String(order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsEditOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    // Optimistically update UI
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    // Then update via API
    await updateOrderStatus(orderId, newStatus);
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: Order["payment_status"]) => {
    // Optimistically update UI
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, payment_status: newPaymentStatus } : order
      )
    );
    // Then update via API
    await updatePaymentStatus(orderId, newPaymentStatus);
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "⏳";
      case "processing": return "🔄";
      case "shipped": return "🚚";
      case "delivered": return "✅";
      case "cancelled": return "❌";
      default: return "📦";
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Захиалгуудыг уншиж байна...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Захиалгын жагсаалт</h1>
        <div className="text-sm text-gray-500">
          Нийт: {filteredOrders.length} захиалга
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-500 hover:text-red-700 mt-1"
          >
            Хаах
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Захиалгын дугаар, харилцагчийн нэр, утасны дугаараар хайх..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Төлөв" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх төлөв</SelectItem>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.icon} {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Төлбөрийн төлөв" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх төлбөрийн төлөв</SelectItem>
            {paymentOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List - Table View */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Огноо</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Худалдан авагч</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Бүтээгдэхүүн</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Зохиогч (Журналист)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Нийт дүн</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tbarimt-д</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Журналист-д</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Төлөв</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-semibold">#{order.id}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {order.created_at}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {order.user?.fullName || order.user?.username || "Хэрэглэгч"}
                    </div>
                    {order.user?.phone && (
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{order.user.phone}</div>
                    )}
                    {order.user?.email && (
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{order.user.email}</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {order.product ? (
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">{order.product.title}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">ID: {order.product.id}</div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {order.product?.author ? (
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {order.product.author.fullName || order.product.author.username || "Зохиогч"}
                      </div>
                      {order.product.author.phone && (
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{order.product.author.phone}</div>
                      )}
                      {order.product.author.membership && (
                        <div className="text-xs">
                          <span className="text-blue-600 dark:text-blue-400">
                            {order.product.author.membership.name} ({order.product.author.membership.percentage}%)
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {order.total.toLocaleString()}₮
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {order.commission?.tbarimtAmount?.toLocaleString() || order.total.toLocaleString()}₮
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {order.commission?.journalistAmount?.toLocaleString() || "0"}₮
                  </span>
                  {order.commission?.commissionPercentage && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ({order.commission.commissionPercentage}%)
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs border ${statusColor[order.status]}`}>
                      {getStatusIcon(order.status)} {statusOptions.find(s => s.value === order.status)?.label}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs border ${paymentColor[order.payment_status]}`}>
                      {paymentOptions.find(p => p.value === order.payment_status)?.label}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditOrder(order)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Захиалга олдсонгүй</p>
        </Card>
      )}

      {/* Old Card View - Hidden but keeping for reference */}
      <div className="hidden grid grid-cols-1 gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="p-6 shadow-sm border">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-lg">#{order.id}</p>
                  <span className={`px-3 py-1 rounded-full text-sm border ${statusColor[order.status]}`}>
                    {getStatusIcon(order.status)} {statusOptions.find(s => s.value === order.status)?.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm border ${paymentColor[order.payment_status]}`}>
                    {paymentOptions.find(p => p.value === order.payment_status)?.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Үүссэн: {order.created_at}</p>
                {order.customer_name && (
                  <p className="text-sm">
                    <span className="font-medium">Харилцагч:</span> {order.customer_name} ({order.customer_phone})
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewOrder(order)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Харах
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditOrder(order)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Засах
                </Button>
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <p className="font-medium mb-2">Бараанууд:</p>
              <ul className="space-y-1 text-sm">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{item.name} × {item.qty}ш</span>
                    <span className="font-medium">{item.price.toLocaleString()}₮</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-lg font-semibold">
                Нийт: {order.total.toLocaleString()}₮
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Select 
                  value={order.status} 
                  onValueChange={(value: Order["status"]) => handleStatusChange(order.id, value)}
                >
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={order.payment_status} 
                  onValueChange={(value: Order["payment_status"]) => handlePaymentStatusChange(order.id, value)}
                >
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        ))}

      </div>

      {/* View Order Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Захиалгын дэлгэрэнгүй #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Худалдан авагчийн мэдээлэл</h4>
                  <p className="text-sm"><span className="font-medium">Нэр:</span> {selectedOrder.user?.fullName || selectedOrder.user?.username || selectedOrder.customer_name || "N/A"}</p>
                  <p className="text-sm"><span className="font-medium">Утас:</span> {selectedOrder.user?.phone || selectedOrder.customer_phone || "N/A"}</p>
                  <p className="text-sm"><span className="font-medium">Имэйл:</span> {selectedOrder.user?.email || "N/A"}</p>
                  {selectedOrder.address && <p className="text-sm"><span className="font-medium">Хаяг:</span> {selectedOrder.address}</p>}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Захиалгын мэдээлэл</h4>
                  <p className="text-sm"><span className="font-medium">Үүссэн огноо:</span> {selectedOrder.created_at}</p>
                  <p className="text-sm"><span className="font-medium">Төлөв:</span> {statusOptions.find(s => s.value === selectedOrder.status)?.label}</p>
                  <p className="text-sm"><span className="font-medium">Төлбөрийн төлөв:</span> {paymentOptions.find(p => p.value === selectedOrder.payment_status)?.label}</p>
                </div>
              </div>

              {selectedOrder.product && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Бүтээгдэхүүний мэдээлэл</h4>
                  <p className="text-sm"><span className="font-medium">Нэр:</span> {selectedOrder.product.title}</p>
                  <p className="text-sm"><span className="font-medium">ID:</span> {selectedOrder.product.id}</p>
                  <p className="text-sm"><span className="font-medium">Үнэ:</span> {selectedOrder.product.price?.toLocaleString()}₮</p>
                </div>
              )}

              {selectedOrder.product?.author && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Зохиогч (Журналист) мэдээлэл</h4>
                  <p className="text-sm"><span className="font-medium">Нэр:</span> {selectedOrder.product.author.fullName || selectedOrder.product.author.username || "N/A"}</p>
                  {selectedOrder.product.author.phone && (
                    <p className="text-sm"><span className="font-medium">Утас:</span> {selectedOrder.product.author.phone}</p>
                  )}
                  {selectedOrder.product.author.email && (
                    <p className="text-sm"><span className="font-medium">Имэйл:</span> {selectedOrder.product.author.email}</p>
                  )}
                  {selectedOrder.product.author.membership && (
                    <p className="text-sm">
                      <span className="font-medium">Гишүүнчлэл:</span> {selectedOrder.product.author.membership.name} ({selectedOrder.product.author.membership.percentage}%)
                    </p>
                  )}
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Захиалгын бараанууд</h4>
                <div className="border rounded-lg">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between p-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Тоо ширхэг: {item.qty}</p>
                      </div>
                      <p className="font-medium">{item.price.toLocaleString()}₮</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Нийт дүн:</span>
                  <span className="font-bold">{selectedOrder.total.toLocaleString()}₮</span>
                </div>
                {selectedOrder.commission && (
                  <>
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Tbarimt-д орох дүн:</span>
                      <span className="font-semibold">{selectedOrder.commission.tbarimtAmount.toLocaleString()}₮</span>
                    </div>
                    <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                      <span>Журналист-д орох дүн:</span>
                      <span className="font-semibold">
                        {selectedOrder.commission.journalistAmount.toLocaleString()}₮ 
                        ({selectedOrder.commission.commissionPercentage}%)
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>Хаах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Захиалга засах #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Төлөв</label>
                  <Select 
                    value={selectedOrder.status} 
                    onValueChange={(value: Order["status"]) => 
                      setSelectedOrder({...selectedOrder, status: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Төлбөрийн төлөв</label>
                  <Select 
                    value={selectedOrder.payment_status} 
                    onValueChange={(value: Order["payment_status"]) => 
                      setSelectedOrder({...selectedOrder, payment_status: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Бараанууд</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex gap-4 items-center p-2 border rounded">
                      <Input
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...selectedOrder.items];
                          newItems[i].name = e.target.value;
                          setSelectedOrder({...selectedOrder, items: newItems});
                        }}
                        placeholder="Барааны нэр"
                      />
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) => {
                          const newItems = [...selectedOrder.items];
                          newItems[i].qty = parseInt(e.target.value) || 0;
                          setSelectedOrder({...selectedOrder, items: newItems});
                        }}
                        className="w-20"
                        placeholder="Тоо"
                      />
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          const newItems = [...selectedOrder.items];
                          newItems[i].price = parseInt(e.target.value) || 0;
                          setSelectedOrder({...selectedOrder, items: newItems});
                        }}
                        className="w-32"
                        placeholder="Үнэ"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Цуцлах</Button>
            <Button onClick={async () => {
              if (selectedOrder) {
                // Update status and payment status via API
                await handleStatusChange(selectedOrder.id, selectedOrder.status);
                await handlePaymentStatusChange(selectedOrder.id, selectedOrder.payment_status);
                setIsEditOpen(false);
              }
            }}>Хадгалах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}