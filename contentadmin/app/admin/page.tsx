"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  TrendingUp, 
  Eye,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { dashboardApi, ordersApi } from "@/lib/api";
import { useRouter } from "next/navigation";

const statusConfig = {
  delivered: { label: 'Хүргэгдсэн', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  processing: { label: 'Боловсруулж байна', color: 'bg-blue-100 text-blue-800', icon: Clock },
  shipped: { label: 'Хүргэлтэнд гарсан', color: 'bg-purple-100 text-purple-800', icon: Package },
  pending: { label: 'Хүлээгдэж байна', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  completed: { label: 'Дууссан', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

export default function AdminHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJournalists: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    todayOrders: 0,
    pendingProducts: 0,
    qpayOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stats
      const statsData = await dashboardApi.getStats();
      if (statsData.stats) {
        setStats(statsData.stats);
      }

      // Fetch recent orders
      const ordersData = await ordersApi.getAll({ page: 1, limit: 4 });
      if (ordersData.orders) {
        setRecentOrders(ordersData.orders.slice(0, 4));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('mn-MN').format(price) + '₮';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Хянах самбарыг ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchDashboardData} className="mt-2" variant="outline">
            Дахин оролдох
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Хянах самбар</h1>
          <p className="text-gray-600">Өнөөдрийн үйл ажиллагааны тойм</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Өдөр</Button>
          <Button variant="outline">7 хоног</Button>
          <Button variant="default">Сар</Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт хэрэглэгч</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-blue-600">
              {stats.totalJournalists} нийтлэлч
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Захиалга</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-green-600">
              {stats.todayOrders} өнөөдөр
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Орлого</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
            <p className="text-xs text-purple-600">
              {formatPrice(stats.todayRevenue)} өнөөдөр
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Барааны тоо</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-orange-600">
              {stats.pendingProducts} хүлээгдэж байна
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Additional Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Сүүлийн захиалгууд</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/admin/order')}
              >
                Бүгдийг харах
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order: any) => {
                  const orderStatus = order.status || 'pending';
                  const StatusIcon = statusConfig[orderStatus as keyof typeof statusConfig]?.icon || AlertCircle;
                  const statusColor = statusConfig[orderStatus as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800';
                  const customerName = order.user?.fullName || order.user?.username || 'Хэрэглэгч';
                  const orderId = order.id || order.orderNumber || `ORD-${order.id}`;
                  const amount = order.amount || order.total || 0;
                  
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${statusColor}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{orderId}</div>
                          <div className="text-sm text-gray-500">{customerName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatPrice(amount)}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('mn-MN')}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Захиалга олдсонгүй
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Сүүлийн үйлдлүүд</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium">Систем</div>
                  <div className="text-sm text-gray-600">Нийт {stats.totalUsers} хэрэглэгч</div>
                  <div className="text-xs text-gray-400">Одоо</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium">Захиалга</div>
                  <div className="text-sm text-gray-600">Нийт {stats.totalOrders} захиалга</div>
                  <div className="text-xs text-gray-400">Одоо</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium">Орлого</div>
                  <div className="text-sm text-gray-600">{formatPrice(stats.totalRevenue)}</div>
                  <div className="text-xs text-gray-400">Нийт</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Чансааны бараанууд</span>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-4 text-gray-500 text-sm">
                Барааны статистик харах боломжтой
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Түргэн үйлдлүүд</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-16 flex-col gap-1">
                <ShoppingCart className="h-5 w-5" />
                <span className="text-xs">Захиалга үүсгэх</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex-col gap-1"
                onClick={() => router.push('/admin/product')}
              >
                <Package className="h-5 w-5" />
                <span className="text-xs">Бараа нэмэх</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex-col gap-1"
                onClick={() => router.push('/admin/users')}
              >
                <Users className="h-5 w-5" />
                <span className="text-xs">Хэрэглэгч нэмэх</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex-col gap-1"
                onClick={() => router.push('/admin/order')}
              >
                <Eye className="h-5 w-5" />
                <span className="text-xs">Захиалга харах</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>Системийн төлөв</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="font-semibold">Дэлгүүр</div>
              <div className="text-sm text-green-600">Идэвхтэй</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="font-semibold">Төлбөрийн систем</div>
              <div className="text-sm text-green-600">Ажиллаж байна</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="font-semibold">Сервер</div>
              <div className="text-sm text-green-600">Хэвийн</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="font-semibold">Нөөц</div>
              <div className="text-sm text-yellow-600">75% ашиглагдсан</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}