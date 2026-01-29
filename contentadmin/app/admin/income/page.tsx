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

// Line Chart Component with improved tooltips
function DailyIncomeChart({ data, formatCurrency }: { data: DailyChartData[]; formatCurrency: (amount: number) => string }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [chartContainer, setChartContainer] = useState<HTMLDivElement | null>(null);

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
    <div className="w-full relative" ref={setChartContainer}>
      {/* Tooltip */}
      {hoveredIndex !== null && tooltipPosition && data[hoveredIndex] && (
        <div
          className="absolute z-50 bg-gray-900 text-white p-3 rounded-lg shadow-2xl pointer-events-none min-w-[200px]"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 140}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-sm font-semibold mb-2 border-b border-gray-700 pb-2 text-center">
            {new Date(data[hoveredIndex].date).toLocaleDateString('mn-MN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Гишүүнчлэл:</span>
              </div>
              <span className="font-semibold">{formatCurrency(data[hoveredIndex].subscription)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Худалдан авалт:</span>
              </div>
              <span className="font-semibold">{formatCurrency(data[hoveredIndex].purchase)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>Unique:</span>
              </div>
              <span className="font-semibold">{formatCurrency(data[hoveredIndex].isUnique)}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-700 font-bold text-center text-sm">
              Нийт: {formatCurrency(data[hoveredIndex].total)}
            </div>
          </div>
        </div>
      )}
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

        {/* Interactive hover area for tooltips */}
        {data.map((day, index) => {
          const x = getX(index, data.length);
          const hoverAreaWidth = chartAreaWidth / data.length;
          
          return (
            <rect
              key={`hover-${day.date}`}
              x={x - hoverAreaWidth / 2}
              y={padding.top}
              width={hoverAreaWidth}
              height={chartAreaHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={(e) => {
                setHoveredIndex(index);
                if (chartContainer) {
                  const containerRect = chartContainer.getBoundingClientRect();
                  const xPercent = (x / chartAreaWidth);
                  setTooltipPosition({ 
                    x: containerRect.left + (containerRect.width * xPercent), 
                    y: containerRect.top + 20
                  });
                } else {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipPosition({ 
                    x: rect.left + rect.width / 2, 
                    y: rect.top - 10
                  });
                }
              }}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setTooltipPosition(null);
              }}
            />
          );
        })}

        {/* Data points */}
        {data.map((day, index) => {
          const x = getX(index, data.length);
          const isHovered = hoveredIndex === index;
          
          return (
            <g key={day.date}>
              {/* Vertical line on hover */}
              {isHovered && (
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + chartAreaHeight}
                  stroke="#6b7280"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.5"
                />
              )}
              
              {/* Subscription point */}
              {day.subscription > 0 && (
                <circle
                  cx={x}
                  cy={getY(day.subscription)}
                  r={isHovered ? "6" : "4"}
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth={isHovered ? "3" : "2"}
                  className="transition-all cursor-pointer"
                >
                  <title>Гишүүнчлэл: {formatCurrency(day.subscription)}</title>
                </circle>
              )}
              
              {/* Purchase point */}
              {day.purchase > 0 && (
                <circle
                  cx={x}
                  cy={getY(day.purchase)}
                  r={isHovered ? "6" : "4"}
                  fill="#10b981"
                  stroke="white"
                  strokeWidth={isHovered ? "3" : "2"}
                  className="transition-all cursor-pointer"
                >
                  <title>Худалдан авалт: {formatCurrency(day.purchase)}</title>
                </circle>
              )}
              
              {/* isUnique point */}
              {day.isUnique > 0 && (
                <circle
                  cx={x}
                  cy={getY(day.isUnique)}
                  r={isHovered ? "6" : "4"}
                  fill="#f59e0b"
                  stroke="white"
                  strokeWidth={isHovered ? "3" : "2"}
                  className="transition-all cursor-pointer"
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

        {/* Enhanced Legend */}
        <g transform={`translate(${chartAreaWidth - padding.right - 150}, ${padding.top})`}>
          <rect x="-10" y="-5" width="140" height="70" fill="white" fillOpacity="0.9" rx="4" stroke="#e5e7eb" strokeWidth="1" />
          <g>
            <line x1={0} y1={8} x2={20} y2={8} stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
            <text x={28} y={11} className="text-xs fill-gray-700 font-semibold" fontSize="12">Гишүүнчлэл</text>
          </g>
          <g transform="translate(0, 20)">
            <line x1={0} y1={8} x2={20} y2={8} stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
            <text x={28} y={11} className="text-xs fill-gray-700 font-semibold" fontSize="12">Худалдан авалт</text>
          </g>
          <g transform="translate(0, 40)">
            <line x1={0} y1={8} x2={20} y2={8} stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
            <text x={28} y={11} className="text-xs fill-gray-700 font-semibold" fontSize="12">Unique</text>
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
    <div className="space-y-6 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Орлогын мэдээлэл
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Бүх захиалга болон захиалгын орлогын мэдээлэл
          </p>
        </div>
        {data && (
          <Button 
            onClick={exportToCSV} 
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV татаж авах
          </Button>
        )}
      </div>

      {/* Date Filters */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-xl bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="w-5 h-5" />
            Шүүлт
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-gray-700 dark:text-gray-300 font-semibold">Эхлэх огноо</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-gray-700 dark:text-gray-300 font-semibold">Дуусах огноо</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={fetchIncomeData} 
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
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

      {/* Key Metrics Row - ARPU, AOV, Revenue Structure */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {/* ARPU Card */}
          <Card className="border-2 border-cyan-400 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-indigo-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">ARPU</CardTitle>
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                {(() => {
                  const uniqueUsers = new Set([
                    ...(data.subscriptions || []).map(s => s.user?.id).filter(Boolean),
                    ...(data.purchases || []).map(p => p.user?.id).filter(Boolean),
                    ...(data.isUnique || []).map(u => u.user?.id).filter(Boolean),
                  ]).size;
                  return uniqueUsers > 0 
                    ? formatCurrency(data.summary.grandTotal / uniqueUsers)
                    : formatCurrency(0);
                })()}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                Нэг хэрэглэгчээс дунджаар орж буй орлого
              </p>
            </CardContent>
          </Card>

          {/* AOV Card */}
          <Card className="border-2 border-violet-400 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-fuchsia-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">AOV</CardTitle>
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                {(() => {
                  const totalOrders = data.summary.subscriptionCount + data.summary.purchaseCount + (data.summary.isUniqueCount || 0);
                  return totalOrders > 0 
                    ? formatCurrency(data.summary.grandTotal / totalOrders)
                    : formatCurrency(0);
                })()}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                Нэг захиалгын дундаж дүн
              </p>
            </CardContent>
          </Card>

          {/* Revenue Structure - Subscription % */}
          <Card className="border-2 border-blue-400 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">Гишүүнчлэл %</CardTitle>
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {data.summary.grandTotal > 0 
                  ? ((data.summary.subscriptionTotal / data.summary.grandTotal) * 100).toFixed(1)
                  : '0.0'}%
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                Орлогын бүтэц
              </p>
            </CardContent>
          </Card>

          {/* Revenue Structure - Purchase % */}
          <Card className="border-2 border-green-400 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-lime-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">Худалдан авалт %</CardTitle>
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {data.summary.grandTotal > 0 
                  ? ((data.summary.purchaseTotal / data.summary.grandTotal) * 100).toFixed(1)
                  : '0.0'}%
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                Орлогын бүтэц
              </p>
            </CardContent>
          </Card>

          {/* Revenue Structure - Unique % */}
          <Card className="border-2 border-amber-400 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">Unique %</CardTitle>
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {data.summary.grandTotal > 0 
                  ? (((data.summary.isUniqueTotal || 0) / data.summary.grandTotal) * 100).toFixed(1)
                  : '0.0'}%
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                Орлогын бүтэц
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-2 border-gradient-to-br from-emerald-400 to-teal-600 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">Нийт орлого</CardTitle>
              <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {formatCurrency(data.summary.grandTotal)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                {data.summary.subscriptionCount + data.summary.purchaseCount + (data.summary.isUniqueCount || 0)} захиалга
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-400 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">Гишүүнчлэлийн орлого</CardTitle>
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {formatCurrency(data.summary.subscriptionTotal)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                {data.summary.subscriptionCount} захиалга
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-400 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-lime-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">Файлын орлого</CardTitle>
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {formatCurrency(data.summary.purchaseTotal)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                {data.summary.purchaseCount} захиалга
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-400 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ads орлого</CardTitle>
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {formatCurrency(data.summary.isUniqueTotal || 0)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                {data.summary.isUniqueCount || 0} захиалга
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-400 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-rose-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">Огнооны хүрээ</CardTitle>
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
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
        <Card className="border-2 border-indigo-200 dark:border-indigo-800 shadow-2xl bg-gradient-to-br from-white via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-indigo-900/20 dark:to-purple-900/20">
          <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-t-lg">
            <CardTitle className="text-white text-xl font-bold">Өдрийн орлогын харьцуулалт</CardTitle>
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
          <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 p-1 rounded-lg">
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white font-semibold transition-all"
            >
              Бүгд
            </TabsTrigger>
            <TabsTrigger 
              value="subscription"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-600 data-[state=active]:text-white font-semibold transition-all"
            >
              Захиалга
            </TabsTrigger>
            <TabsTrigger 
              value="purchase"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white font-semibold transition-all"
            >
              Худалдан авалт
            </TabsTrigger>
            <TabsTrigger 
              value="isUnique"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white font-semibold transition-all"
            >
              Unique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* Subscription Orders */}
            {data.subscriptions && data.subscriptions.length > 0 && (
              <Card className="border-2 border-indigo-200 dark:border-indigo-800 shadow-xl bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900/20">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="text-white text-lg font-bold">Захиалгын орлого</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50">
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">ID</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Хэрэглэгч</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Захиалгын төрөл</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Дүн</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Төлбөрийн арга</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Огноо</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.subscriptions.map((order, index) => (
                        <TableRow 
                          key={order.id}
                          className={`hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/30 dark:hover:to-blue-900/30 transition-colors ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'
                          }`}
                        >
                          <TableCell className="font-bold text-indigo-600 dark:text-indigo-400">#{order.id}</TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {order.user?.fullName || order.user?.username || 'Guest'}
                            </div>
                            {order.user?.email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{order.user.email}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                              {order.membership?.name || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-green-600 dark:text-green-400 text-lg">
                            {formatCurrency(order.amount)}
                          </TableCell>
                          <TableCell>{getPaymentMethodBadge(order.paymentMethod)}</TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Purchase Orders */}
            {data.purchases && data.purchases.length > 0 && (
              <Card className="border-2 border-green-200 dark:border-green-800 shadow-xl bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                  <CardTitle className="text-white text-lg font-bold">Худалдан авалтын орлого</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50">
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">ID</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Хэрэглэгч</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Бүтээгдэхүүн</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Зохиогч</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Дүн</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Төлбөрийн арга</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Огноо</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.purchases.map((order, index) => (
                        <TableRow 
                          key={order.id}
                          className={`hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-colors ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'
                          }`}
                        >
                          <TableCell className="font-bold text-green-600 dark:text-green-400">#{order.id}</TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {order.user?.fullName || order.user?.username || 'Guest'}
                            </div>
                            {order.user?.email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{order.user.email}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {order.product?.title || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              {order.product?.author?.fullName || order.product?.author?.username || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-green-600 dark:text-green-400 text-lg">
                            {formatCurrency(order.amount)}
                          </TableCell>
                          <TableCell>{getPaymentMethodBadge(order.paymentMethod)}</TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* isUnique Orders */}
            {data.isUnique && data.isUnique.length > 0 && (
              <Card className="border-2 border-amber-200 dark:border-amber-800 shadow-xl bg-gradient-to-br from-white to-amber-50 dark:from-gray-800 dark:to-amber-900/20">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
                  <CardTitle className="text-white text-lg font-bold">Unique орлого</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50">
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">ID</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Хэрэглэгч</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Бүтээгдэхүүн</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Зохиогч</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Дүн</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Төлбөрийн арга</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Огноо</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.isUnique.map((order, index) => (
                        <TableRow 
                          key={order.id}
                          className={`hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-colors ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'
                          }`}
                        >
                          <TableCell className="font-bold text-amber-600 dark:text-amber-400">#{order.id}</TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {order.user?.fullName || order.user?.username || 'Guest'}
                            </div>
                            {order.user?.email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{order.user.email}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {order.product?.title || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                              {order.product?.author?.fullName || order.product?.author?.username || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-amber-600 dark:text-amber-400 text-lg">
                            {formatCurrency(order.amount)}
                          </TableCell>
                          <TableCell>{getPaymentMethodBadge(order.paymentMethod)}</TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">{formatDate(order.createdAt)}</TableCell>
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
              <Card className="border-2 border-indigo-200 dark:border-indigo-800 shadow-xl bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900/20">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="text-white text-lg font-bold">Захиалгын орлого</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50">
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">ID</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Хэрэглэгч</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Захиалгын төрөл</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Дүн</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Төлбөрийн арга</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Огноо</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.subscriptions.map((order, index) => (
                        <TableRow 
                          key={order.id}
                          className={`hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/30 dark:hover:to-blue-900/30 transition-colors ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'
                          }`}
                        >
                          <TableCell className="font-bold text-indigo-600 dark:text-indigo-400">#{order.id}</TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {order.user?.fullName || order.user?.username || 'Guest'}
                            </div>
                            {order.user?.email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{order.user.email}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                              {order.membership?.name || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-green-600 dark:text-green-400 text-lg">
                            {formatCurrency(order.amount)}
                          </TableCell>
                          <TableCell>{getPaymentMethodBadge(order.paymentMethod)}</TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-gray-200 dark:border-gray-700">
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground text-lg">Захиалгын орлого олдсонгүй</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="purchase">
            {data.purchases && data.purchases.length > 0 ? (
              <Card className="border-2 border-green-200 dark:border-green-800 shadow-xl bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                  <CardTitle className="text-white text-lg font-bold">Худалдан авалтын орлого</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50">
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">ID</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Хэрэглэгч</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Бүтээгдэхүүн</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Зохиогч</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Дүн</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Төлбөрийн арга</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Огноо</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.purchases.map((order, index) => (
                        <TableRow 
                          key={order.id}
                          className={`hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-colors ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'
                          }`}
                        >
                          <TableCell className="font-bold text-green-600 dark:text-green-400">#{order.id}</TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {order.user?.fullName || order.user?.username || 'Guest'}
                            </div>
                            {order.user?.email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{order.user.email}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {order.product?.title || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              {order.product?.author?.fullName || order.product?.author?.username || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-green-600 dark:text-green-400 text-lg">
                            {formatCurrency(order.amount)}
                          </TableCell>
                          <TableCell>{getPaymentMethodBadge(order.paymentMethod)}</TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-gray-200 dark:border-gray-700">
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground text-lg">Худалдан авалтын орлого олдсонгүй</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="isUnique">
            {data.isUnique && data.isUnique.length > 0 ? (
              <Card className="border-2 border-amber-200 dark:border-amber-800 shadow-xl bg-gradient-to-br from-white to-amber-50 dark:from-gray-800 dark:to-amber-900/20">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
                  <CardTitle className="text-white text-lg font-bold">Unique орлого</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50">
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">ID</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Хэрэглэгч</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Бүтээгдэхүүн</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Зохиогч</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Дүн</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Төлбөрийн арга</TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-300">Огноо</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.isUnique.map((order, index) => (
                        <TableRow 
                          key={order.id}
                          className={`hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-colors ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'
                          }`}
                        >
                          <TableCell className="font-bold text-amber-600 dark:text-amber-400">#{order.id}</TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {order.user?.fullName || order.user?.username || 'Guest'}
                            </div>
                            {order.user?.email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{order.user.email}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {order.product?.title || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                              {order.product?.author?.fullName || order.product?.author?.username || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-amber-600 dark:text-amber-400 text-lg">
                            {formatCurrency(order.amount)}
                          </TableCell>
                          <TableCell>{getPaymentMethodBadge(order.paymentMethod)}</TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-gray-200 dark:border-gray-700">
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground text-lg">Unique орлого олдсонгүй</p>
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

