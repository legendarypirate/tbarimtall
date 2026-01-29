"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, DollarSign, ShoppingCart, CreditCard, Download, Filter, Loader2 } from "lucide-react";
import { incomeApi } from "@/lib/api";

// Line Chart Component
function DailyIncomeChart({ data, formatCurrency }: { data: DailyChartData[]; formatCurrency: (amount: number) => string }) {
  if (!data || data.length === 0) return null;

  // Calculate max value across all three series
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.subscription, d.purchase, d.isUnique)),
    1 // Ensure at least 1 to avoid division by zero
  );

  const chartHeight = 400;
  const padding = { top: 20, right: 20, bottom: 60, left: 60 };
  const chartAreaHeight = chartHeight - padding.top - padding.bottom;
  const chartAreaWidth = 1000; // Base width for calculations, will scale via viewBox

  // Helper function to get Y coordinate for a value
  const getY = (value: number) => {
    if (maxValue === 0) return padding.top + chartAreaHeight;
    return padding.top + chartAreaHeight - (value / maxValue) * chartAreaHeight;
  };

  // Helper function to get X coordinate for an index
  const getX = (index: number, total: number) => {
    if (total <= 1) return padding.left;
    return padding.left + (index / (total - 1)) * (chartAreaWidth - padding.left - padding.right);
  };

  // Generate path data for a line
  const generatePath = (getValue: (day: DailyChartData) => number) => {
    if (data.length === 0) return '';
    
    const points = data.map((day, index) => {
      const x = getX(index, data.length);
      const y = getY(getValue(day));
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  // Generate area path (for fill under line)
  const generateAreaPath = (getValue: (day: DailyChartData) => number) => {
    if (data.length === 0) return '';
    
    const linePath = generatePath(getValue);
    const firstX = getX(0, data.length);
    const lastX = getX(data.length - 1, data.length);
    const baseY = padding.top + chartAreaHeight;
    
    return `${linePath} L ${lastX},${baseY} L ${firstX},${baseY} Z`;
  };

  return (
    <div className="w-full">
      <svg 
        viewBox={`0 0 ${chartAreaWidth} ${chartHeight}`} 
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full min-h-[400px]"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const value = maxValue * ratio;
          const y = getY(value);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartAreaWidth - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-600"
                fontSize="12"
              >
                {new Intl.NumberFormat('mn-MN', { maximumFractionDigits: 0 }).format(value)}₮
              </text>
            </g>
          );
        })}

        {/* Area fills under lines */}
        <path
          d={generateAreaPath(d => d.subscription)}
          fill="#3b82f6"
          fillOpacity="0.1"
        />
        <path
          d={generateAreaPath(d => d.purchase)}
          fill="#10b981"
          fillOpacity="0.1"
        />
        <path
          d={generateAreaPath(d => d.isUnique)}
          fill="#f59e0b"
          fillOpacity="0.1"
        />

        {/* Lines */}
        <path
          d={generatePath(d => d.subscription)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="hover:stroke-[#2563eb] transition-colors"
        />
        <path
          d={generatePath(d => d.purchase)}
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="hover:stroke-[#059669] transition-colors"
        />
        <path
          d={generatePath(d => d.isUnique)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="hover:stroke-[#d97706] transition-colors"
        />

        {/* Data points */}
        {data.map((day, index) => {
          const x = getX(index, data.length);
          
          return (
            <g key={day.date}>
              {/* Subscription point */}
              {day.subscription > 0 && (
                <circle
                  cx={x}
                  cy={getY(day.subscription)}
                  r="4"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                  className="hover:r-6 transition-all cursor-pointer"
                >
                  <title>Захиалга: {formatCurrency(day.subscription)}</title>
                </circle>
              )}
              
              {/* Purchase point */}
              {day.purchase > 0 && (
                <circle
                  cx={x}
                  cy={getY(day.purchase)}
                  r="4"
                  fill="#10b981"
                  stroke="white"
                  strokeWidth="2"
                  className="hover:r-6 transition-all cursor-pointer"
                >
                  <title>Худалдан авалт: {formatCurrency(day.purchase)}</title>
                </circle>
              )}
              
              {/* isUnique point */}
              {day.isUnique > 0 && (
                <circle
                  cx={x}
                  cy={getY(day.isUnique)}
                  r="4"
                  fill="#f59e0b"
                  stroke="white"
                  strokeWidth="2"
                  className="hover:r-6 transition-all cursor-pointer"
                >
                  <title>Unique: {formatCurrency(day.isUnique)}</title>
                </circle>
              )}

              {/* Date label */}
              <text
                x={x}
                y={chartHeight - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
                fontSize="11"
                transform={`rotate(-45 ${x} ${chartHeight - padding.bottom + 20})`}
              >
                {new Date(day.date).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${chartAreaWidth - padding.right - 120}, ${padding.top})`}>
          <g>
            <line x1={0} y1={8} x2={20} y2={8} stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
            <text x={28} y={11} className="text-xs fill-gray-700" fontSize="12">Захиалга</text>
          </g>
          <g transform="translate(0, 20)">
            <line x1={0} y1={8} x2={20} y2={8} stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
            <text x={28} y={11} className="text-xs fill-gray-700" fontSize="12">Худалдан авалт</text>
          </g>
          <g transform="translate(0, 40)">
            <line x1={0} y1={8} x2={20} y2={8} stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
            <text x={28} y={11} className="text-xs fill-gray-700" fontSize="12">Unique</text>
          </g>
        </g>
      </svg>
    </div>
  );
}

interface IncomeSummary {
  subscriptionTotal: number;
  purchaseTotal: number;
  isUniqueTotal: number;
  grandTotal: number;
  subscriptionCount: number;
  purchaseCount: number;
  isUniqueCount: number;
}

interface DailyChartData {
  date: string;
  subscription: number;
  purchase: number;
  isUnique: number;
  total: number;
}

interface SubscriptionOrder {
  id: number;
  amount: number;
  paymentMethod: string;
  createdAt: string;
  membership: {
    id: number;
    name: string;
    price: number;
  } | null;
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string;
  } | null;
}

interface PurchaseOrder {
  id: number;
  amount: number;
  paymentMethod: string;
  createdAt: string;
  product: {
    id: number;
    title: string;
    price: number;
    author: {
      id: number;
      username: string;
      fullName: string;
    } | null;
  } | null;
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string;
  } | null;
}

interface IncomeData {
  summary: IncomeSummary;
  subscriptions?: SubscriptionOrder[];
  purchases?: PurchaseOrder[];
  isUnique?: PurchaseOrder[];
  dailyChart?: DailyChartData[];
}

export default function IncomePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IncomeData | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "subscription" | "purchase">("all");

  // Set default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Fetch income data
  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (activeTab !== "all") {
        params.type = activeTab;
      }
      
      const response = await incomeApi.getAnalytics(params);
      setData(response);
    } catch (error: any) {
      console.error("Error fetching income data:", error);
      alert(error.message || "Орлогын мэдээлэл авахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchIncomeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, activeTab]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency: 'MNT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      qpay: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      wallet: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      bank: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return (
      <Badge className={colors[method] || colors.other}>
        {method.toUpperCase()}
      </Badge>
    );
  };

  const exportToCSV = () => {
    if (!data) return;

    let csv = "Type,ID,Amount,Payment Method,Date,Details\n";
    
    if (data.subscriptions) {
      data.subscriptions.forEach((order) => {
        csv += `Subscription,${order.id},${order.amount},${order.paymentMethod},${order.createdAt},"${order.membership?.name || 'N/A'} - ${order.user?.fullName || order.user?.username || 'Guest'}"\n`;
      });
    }
    
    if (data.purchases) {
      data.purchases.forEach((order) => {
        csv += `Purchase,${order.id},${order.amount},${order.paymentMethod},${order.createdAt},"${order.product?.title || 'N/A'} - ${order.user?.fullName || order.user?.username || 'Guest'}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `income_${startDate}_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Орлогын мэдээлэл</h1>
          <p className="text-muted-foreground mt-1">
            Бүх захиалга болон захиалгын орлогын мэдээлэл
          </p>
        </div>
        {data && (
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            CSV татаж авах
          </Button>
        )}
      </div>

      {/* Date Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Шүүлт
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Эхлэх огноо</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endDate">Дуусах огноо</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={fetchIncomeData} 
                className="w-full"
                disabled={loading || !startDate || !endDate}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Ачааллаж байна...
                  </>
                ) : (
                  "Шүүх"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Нийт орлого</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.summary.grandTotal)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.summary.subscriptionCount + data.summary.purchaseCount + (data.summary.isUniqueCount || 0)} захиалга
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Захиалгын орлого</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.summary.subscriptionTotal)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.summary.subscriptionCount} захиалга
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Худалдан авалтын орлого</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.summary.purchaseTotal)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.summary.purchaseCount} захиалга
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique орлого</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.summary.isUniqueTotal || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.summary.isUniqueCount || 0} захиалга
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Огнооны хүрээ</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {startDate && endDate ? (
                  <>
                    {new Date(startDate).toLocaleDateString('mn-MN')} - {new Date(endDate).toLocaleDateString('mn-MN')}
                  </>
                ) : (
                  "Сонгоогүй"
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily Chart */}
      {data && data.dailyChart && data.dailyChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Өдрийн орлогын харьцуулалт</CardTitle>
          </CardHeader>
          <CardContent className="w-full p-6">
            <div className="w-full min-h-[400px]">
              <DailyIncomeChart data={data.dailyChart} formatCurrency={formatCurrency} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Tables */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : data ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Бүгд</TabsTrigger>
            <TabsTrigger value="subscription">Захиалга</TabsTrigger>
            <TabsTrigger value="purchase">Худалдан авалт</TabsTrigger>
            <TabsTrigger value="isUnique">Unique</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* Subscription Orders */}
            {data.subscriptions && data.subscriptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Захиалгын орлого</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Хэрэглэгч</TableHead>
                        <TableHead>Захиалгын төрөл</TableHead>
                        <TableHead>Дүн</TableHead>
                        <TableHead>Төлбөрийн арга</TableHead>
                        <TableHead>Огноо</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.subscriptions.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>
                            {order.user?.fullName || order.user?.username || 'Guest'}
                            {order.user?.email && (
                              <div className="text-xs text-muted-foreground">{order.user.email}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.membership?.name || 'N/A'}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(order.amount)}</TableCell>
                          <TableCell>{getPaymentMethodBadge(order.paymentMethod)}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Purchase Orders */}
            {data.purchases && data.purchases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Худалдан авалтын орлого</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Хэрэглэгч</TableHead>
                        <TableHead>Бүтээгдэхүүн</TableHead>
                        <TableHead>Зохиогч</TableHead>
                        <TableHead>Дүн</TableHead>
                        <TableHead>Төлбөрийн арга</TableHead>
                        <TableHead>Огноо</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.purchases.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>
                            {order.user?.fullName || order.user?.username || 'Guest'}
                            {order.user?.email && (
                              <div className="text-xs text-muted-foreground">{order.user.email}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.product?.title || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {order.product?.author?.fullName || order.product?.author?.username || 'N/A'}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(order.amount)}</TableCell>
                          <TableCell>{getPaymentMethodBadge(order.paymentMethod)}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* isUnique Orders */}
            {data.isUnique && data.isUnique.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Unique орлого</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Хэрэглэгч</TableHead>
                        <TableHead>Бүтээгдэхүүн</TableHead>
                        <TableHead>Зохиогч</TableHead>
                        <TableHead>Дүн</TableHead>
                        <TableHead>Төлбөрийн арга</TableHead>
                        <TableHead>Огноо</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.isUnique.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>
                            {order.user?.fullName || order.user?.username || 'Guest'}
                            {order.user?.email && (
                              <div className="text-xs text-muted-foreground">{order.user.email}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.product?.title || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {order.product?.author?.fullName || order.product?.author?.username || 'N/A'}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(order.amount)}</TableCell>
                          <TableCell>{getPaymentMethodBadge(order.paymentMethod)}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {(!data.subscriptions || data.subscriptions.length === 0) && 
             (!data.purchases || data.purchases.length === 0) && 
             (!data.isUnique || data.isUnique.length === 0) && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Мэдээлэл олдсонгүй</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="subscription">
            {data.subscriptions && data.subscriptions.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Захиалгын орлого</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Хэрэглэгч</TableHead>
                        <TableHead>Захиалгын төрөл</TableHead>
                        <TableHead>Дүн</TableHead>
                        <TableHead>Төлбөрийн арга</TableHead>
                        <TableHead>Огноо</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.subscriptions.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>
                            {order.user?.fullName || order.user?.username || 'Guest'}
                            {order.user?.email && (
                              <div className="text-xs text-muted-foreground">{order.user.email}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.membership?.name || 'N/A'}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(order.amount)}</TableCell>
                          <TableCell>{getPaymentMethodBadge(order.paymentMethod)}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Захиалгын орлого олдсонгүй</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="purchase">
            {data.purchases && data.purchases.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Худалдан авалтын орлого</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Хэрэглэгч</TableHead>
                        <TableHead>Бүтээгдэхүүн</TableHead>
                        <TableHead>Зохиогч</TableHead>
                        <TableHead>Дүн</TableHead>
                        <TableHead>Төлбөрийн арга</TableHead>
                        <TableHead>Огноо</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.purchases.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>
                            {order.user?.fullName || order.user?.username || 'Guest'}
                            {order.user?.email && (
                              <div className="text-xs text-muted-foreground">{order.user.email}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.product?.title || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {order.product?.author?.fullName || order.product?.author?.username || 'N/A'}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(order.amount)}</TableCell>
                          <TableCell>{getPaymentMethodBadge(order.paymentMethod)}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Худалдан авалтын орлого олдсонгүй</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="isUnique">
            {data.isUnique && data.isUnique.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Unique орлого</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Хэрэглэгч</TableHead>
                        <TableHead>Бүтээгдэхүүн</TableHead>
                        <TableHead>Зохиогч</TableHead>
                        <TableHead>Дүн</TableHead>
                        <TableHead>Төлбөрийн арга</TableHead>
                        <TableHead>Огноо</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.isUnique.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>
                            {order.user?.fullName || order.user?.username || 'Guest'}
                            {order.user?.email && (
                              <div className="text-xs text-muted-foreground">{order.user.email}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.product?.title || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {order.product?.author?.fullName || order.product?.author?.username || 'N/A'}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(order.amount)}</TableCell>
                          <TableCell>{getPaymentMethodBadge(order.paymentMethod)}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Unique орлого олдсонгүй</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Огноо сонгоод шүүнэ үү</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

