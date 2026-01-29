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
  TrendingDown,
  Eye,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Activity,
  Shield,
  FileText,
  ShoppingBag,
  AlertTriangle
} from "lucide-react";
import { dashboardApi, ordersApi, incomeApi, usersApi, productsApi } from "@/lib/api";
import { useRouter } from "next/navigation";

const statusConfig = {
  delivered: { label: 'Хүргэгдсэн', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  processing: { label: 'Боловсруулж байна', color: 'bg-blue-100 text-blue-800', icon: Clock },
  shipped: { label: 'Хүргэлтэнд гарсан', color: 'bg-purple-100 text-purple-800', icon: Package },
  pending: { label: 'Хүлээгдэж байна', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  completed: { label: 'Дууссан', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

type PeriodType = 'today' | '7days' | 'month';

export default function AdminHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    registeredUsers: 0,
    guestBuyers: 0,
    totalJournalists: 0,
    totalProducts: 0,
    totalOrders: 0,
    newOrders: 0,
    activeOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    todayOrders: 0,
    pendingProducts: 0,
    qpayOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [revenuePeriod, setRevenuePeriod] = useState<PeriodType>('today');
  const [revenueData, setRevenueData] = useState({
    current: 0,
    previous: 0,
    growth: 0
  });
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [subscriptionRevenue, setSubscriptionRevenue] = useState({
    active: 0,
    percentage: 0
  });
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [oneTimeRevenue, setOneTimeRevenue] = useState({
    membership: 0,
    adsUnique: 0,
    total: 0,
    percentage: 0
  });
  const [oneTimeLoading, setOneTimeLoading] = useState(false);
  const [executiveView, setExecutiveView] = useState({
    monthlyRevenue: 0,
    subscriptionGrowth: 0,
    topContent: [] as any[],
    arpu: 0,
    conversionRate: 0,
    activeSubscribers: 0
  });
  const [executiveLoading, setExecutiveLoading] = useState(false);
  const [adminActionsLog, setAdminActionsLog] = useState<any[]>([]);
  const [actionsLogLoading, setActionsLogLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState({
    paymentApi: { status: 'unknown', message: '' },
    downloadErrors: { count: 0, period: '24 hours' }
  });
  const [healthLoading, setHealthLoading] = useState(false);
  const [productPerformance, setProductPerformance] = useState({
    topSelling: [] as any[],
    lowPerformance: [] as any[],
    conversionRate: 0,
    categoryRevenue: [] as any[]
  });
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [userBehavior, setUserBehavior] = useState({
    newUsers: 0,
    returningBuyers: 0,
    visitorToBuyerRate: 0,
    registeredToPaidRate: 0,
    topPayingUsers: [] as any[],
    guestPurchasePercentage: 0,
    registeredPurchasePercentage: 0
  });
  const [userBehaviorLoading, setUserBehaviorLoading] = useState(false);
  const [paymentMonitoring, setPaymentMonitoring] = useState({
    qpaySuccessRate: 0,
    qpayTotal: 0,
    qpaySuccess: 0,
    qpayFailed: 0,
    failedPayments: 0,
    pendingOrders: 0,
    unresolvedOrders: 0,
    refunds: 0,
    cancellations: 0,
    cancellationReasons: [] as { reason: string; count: number }[]
  });
  const [paymentMonitoringLoading, setPaymentMonitoringLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchPaymentMonitoring();
  }, []);

  useEffect(() => {
    fetchUserBehavior();
  }, []);

  useEffect(() => {
    fetchRevenueData();
  }, [revenuePeriod]);

  useEffect(() => {
    fetchSubscriptionRevenue();
  }, [revenuePeriod, revenueData.current]);

  useEffect(() => {
    fetchOneTimeRevenue();
  }, [revenuePeriod, revenueData.current]);

  useEffect(() => {
    fetchExecutiveView();
  }, []);

  useEffect(() => {
    fetchAdminActionsLog();
    fetchSystemHealth();
    
    // Refresh system health every 30 seconds
    const healthInterval = setInterval(() => {
      fetchSystemHealth();
    }, 30000);
    
    return () => clearInterval(healthInterval);
  }, []);

  useEffect(() => {
    fetchProductPerformance();
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

  const getDateRange = (period: PeriodType) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date();
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousEndDate = new Date(startDate);
        break;
      case '7days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        previousEndDate = new Date(startDate);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousStartDate.setHours(0, 0, 0, 0);
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        previousEndDate.setHours(23, 59, 59, 999);
        break;
    }

    return {
      current: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      previous: {
        startDate: previousStartDate.toISOString().split('T')[0],
        endDate: previousEndDate.toISOString().split('T')[0]
      }
    };
  };

  const fetchRevenueData = async () => {
    try {
      setRevenueLoading(true);
      const dateRanges = getDateRange(revenuePeriod);

      // Fetch current period revenue
      const currentData = await incomeApi.getAnalytics({
        startDate: dateRanges.current.startDate,
        endDate: dateRanges.current.endDate
      });

      // Fetch previous period revenue
      const previousData = await incomeApi.getAnalytics({
        startDate: dateRanges.previous.startDate,
        endDate: dateRanges.previous.endDate
      });

      const currentRevenue = currentData.summary?.grandTotal || currentData.totalRevenue || currentData.total || 0;
      const previousRevenue = previousData.summary?.grandTotal || previousData.totalRevenue || previousData.total || 0;

      // Calculate growth percentage
      let growth = 0;
      if (previousRevenue > 0) {
        growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
      } else if (currentRevenue > 0) {
        growth = 100; // 100% growth if previous was 0
      }

      setRevenueData({
        current: currentRevenue,
        previous: previousRevenue,
        growth: growth
      });
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setRevenueData({ current: 0, previous: 0, growth: 0 });
    } finally {
      setRevenueLoading(false);
    }
  };

  const fetchSubscriptionRevenue = async () => {
    try {
      setSubscriptionLoading(true);
      
      // Use the same date range as total revenue
      const dateRanges = getDateRange(revenuePeriod);
      
      // Fetch revenue data for the current period
      const allData = await incomeApi.getAnalytics({
        startDate: dateRanges.current.startDate,
        endDate: dateRanges.current.endDate
      });

      // Get subscription revenue from the API response
      const activeSubscriptionRevenue = allData.summary?.subscriptionTotal || 0;

      // Calculate percentage of total revenue
      const totalRevenue = revenueData.current > 0 ? revenueData.current : stats.totalRevenue || 0;
      let percentage = 0;
      if (totalRevenue > 0 && activeSubscriptionRevenue > 0) {
        percentage = (activeSubscriptionRevenue / totalRevenue) * 100;
      }

      setSubscriptionRevenue({
        active: activeSubscriptionRevenue,
        percentage: percentage
      });
    } catch (err) {
      console.error('Error fetching subscription revenue:', err);
      setSubscriptionRevenue({ active: 0, percentage: 0 });
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const fetchOneTimeRevenue = async () => {
    try {
      setOneTimeLoading(true);
      
      // Use the same date range as total revenue
      const dateRanges = getDateRange(revenuePeriod);
      
      // Fetch revenue data for the current period
      const allData = await incomeApi.getAnalytics({
        startDate: dateRanges.current.startDate,
        endDate: dateRanges.current.endDate
      });

      // Get revenue from API response summary
      const membershipRevenue = allData.summary?.purchaseTotal || 0;
      const adsUniqueRevenue = allData.summary?.isUniqueTotal || 0;
      const total = membershipRevenue + adsUniqueRevenue;

      // Calculate percentage of total revenue
      const totalRevenue = revenueData.current > 0 ? revenueData.current : stats.totalRevenue || 0;
      let percentage = 0;
      if (totalRevenue > 0 && total > 0) {
        percentage = (total / totalRevenue) * 100;
      }

      setOneTimeRevenue({
        membership: membershipRevenue,
        adsUnique: adsUniqueRevenue,
        total: total,
        percentage: percentage
      });
    } catch (err) {
      console.error('Error fetching one-time revenue:', err);
      setOneTimeRevenue({ membership: 0, adsUnique: 0, total: 0, percentage: 0 });
    } finally {
      setOneTimeLoading(false);
    }
  };

  const fetchExecutiveView = async () => {
    try {
      setExecutiveLoading(true);
      
      // Get current month date range
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      const monthEndStr = now.toISOString().split('T')[0];
      
      // Get previous month for growth calculation
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const prevMonthStartStr = prevMonthStart.toISOString().split('T')[0];
      const prevMonthEndStr = prevMonthEnd.toISOString().split('T')[0];

      // Fetch current month revenue
      const currentMonthData = await incomeApi.getAnalytics({
        startDate: monthStartStr,
        endDate: monthEndStr
      });
      const monthlyRevenue = currentMonthData.summary?.grandTotal || currentMonthData.totalRevenue || currentMonthData.total || 0;

      // Fetch previous month revenue for growth calculation
      const prevMonthData = await incomeApi.getAnalytics({
        startDate: prevMonthStartStr,
        endDate: prevMonthEndStr
      });
      const prevMonthRevenue = prevMonthData.summary?.grandTotal || prevMonthData.totalRevenue || prevMonthData.total || 0;
      
      // Calculate subscription growth
      let subscriptionGrowth = 0;
      const currentSubRevenue = currentMonthData.summary?.subscriptionTotal || 0;
      const prevSubRevenue = prevMonthData.summary?.subscriptionTotal || 0;
      if (prevSubRevenue > 0) {
        subscriptionGrowth = ((currentSubRevenue - prevSubRevenue) / prevSubRevenue) * 100;
      } else if (currentSubRevenue > 0) {
        subscriptionGrowth = 100;
      }

      // Fetch top products by revenue
      const allOrders = await ordersApi.getAll({ limit: 1000 });
      const productsData = await productsApi.getAll({ limit: 1000 });
      
      // Calculate product revenue from orders
      const productRevenueMap = new Map<number, { revenue: number; sales: number; product: any }>();
      
      if (allOrders.orders) {
        allOrders.orders.forEach((order: any) => {
          const productId = order.productId || order.product?.id;
          if (productId) {
            const amount = parseFloat(order.amount || order.total || 0);
            const current = productRevenueMap.get(productId) || { revenue: 0, sales: 0, product: null };
            productRevenueMap.set(productId, {
              revenue: current.revenue + amount,
              sales: current.sales + 1,
              product: order.product || current.product
            });
          }
        });
      }

      // Match products with revenue data
      const productsWithRevenue = (productsData.products || []).map((product: any) => {
        const salesData = productRevenueMap.get(product.id) || { revenue: 0, sales: 0, product: null };
        return {
          ...product,
          revenue: salesData.revenue,
          sales: salesData.sales
        };
      });

      // Get top 10 content by revenue
      const topContent = [...productsWithRevenue]
        .filter(p => p.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Calculate ARPU (Average Revenue Per User)
      // ARPU = Total Revenue / Active Users (users with orders or subscriptions)
      const activeUsers = new Set<number>();
      if (allOrders.orders) {
        allOrders.orders.forEach((order: any) => {
          if (order.userId) activeUsers.add(order.userId);
        });
      }
      
      // Get users with active subscriptions
      const usersData = await usersApi.getAll({ limit: 1000 });
      if (usersData.users) {
        usersData.users.forEach((user: any) => {
          if (user.membership_type && user.subscriptionEndDate) {
            const endDate = new Date(user.subscriptionEndDate);
            if (endDate > now) {
              activeUsers.add(user.id);
            }
          }
        });
      }

      const arpu = activeUsers.size > 0 ? monthlyRevenue / activeUsers.size : 0;

      // Calculate conversion rate
      // Conversion rate = (Total Orders / Total Product Views) * 100
      const totalViews = productsWithRevenue.reduce((sum: number, p: any) => sum + (p.views || 0), 0);
      const totalSales = productsWithRevenue.reduce((sum: number, p: any) => sum + p.sales, 0);
      const conversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;

      // Count active subscribers (users with active membership subscriptions)
      let activeSubscribers = 0;
      if (usersData.users) {
        activeSubscribers = usersData.users.filter((user: any) => {
          if (!user.membership_type || !user.subscriptionEndDate) return false;
          const endDate = new Date(user.subscriptionEndDate);
          return endDate > now;
        }).length;
      }

      setExecutiveView({
        monthlyRevenue,
        subscriptionGrowth,
        topContent,
        arpu,
        conversionRate,
        activeSubscribers
      });
    } catch (err) {
      console.error('Error fetching executive view:', err);
      setExecutiveView({
        monthlyRevenue: 0,
        subscriptionGrowth: 0,
        topContent: [],
        arpu: 0,
        conversionRate: 0,
        activeSubscribers: 0
      });
    } finally {
      setExecutiveLoading(false);
    }
  };

  const fetchAdminActionsLog = async () => {
    try {
      setActionsLogLoading(true);
      const response = await dashboardApi.getAdminActionsLog();
      if (response.actions) {
        setAdminActionsLog(response.actions);
      }
    } catch (err) {
      console.error('Error fetching admin actions log:', err);
      setAdminActionsLog([]);
    } finally {
      setActionsLogLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      setHealthLoading(true);
      const response = await dashboardApi.getSystemHealth();
      if (response.health) {
        setSystemHealth(response.health);
      }
    } catch (err) {
      console.error('Error fetching system health:', err);
      setSystemHealth({
        paymentApi: { status: 'error', message: 'Failed to fetch health data' },
        downloadErrors: { count: 0, period: '24 hours' }
      });
    } finally {
      setHealthLoading(false);
    }
  };


  const fetchPaymentMonitoring = async () => {
    try {
      setPaymentMonitoringLoading(true);
      
      // Fetch all orders to calculate payment metrics
      const ordersResponse = await ordersApi.getAll({ page: 1, limit: 1000 });
      const allOrders = ordersResponse.orders || [];
      
      // QPay statistics
      const qpayOrders = allOrders.filter((o: any) => o.paymentMethod === 'qpay');
      const qpayTotal = qpayOrders.length;
      const qpaySuccess = qpayOrders.filter((o: any) => o.status === 'completed').length;
      const qpayFailed = qpayOrders.filter((o: any) => o.status === 'failed' || o.status === 'cancelled').length;
      const qpaySuccessRate = qpayTotal > 0 ? (qpaySuccess / qpayTotal) * 100 : 0;
      
      // Failed payments (all payment methods)
      const failedPayments = allOrders.filter((o: any) => o.status === 'failed').length;
      
      // Pending orders
      const pendingOrders = allOrders.filter((o: any) => o.status === 'pending').length;
      
      // Unresolved orders (pending + failed)
      const unresolvedOrders = pendingOrders + failedPayments;
      
      // Refunds and cancellations
      const refunds = allOrders.filter((o: any) => o.status === 'refunded').length;
      const cancellations = allOrders.filter((o: any) => o.status === 'cancelled').length;
      
      // Cancellation reasons (if order has a reason/cancellationReason field)
      const cancelledOrders = allOrders.filter((o: any) => o.status === 'cancelled');
      const reasonCounts = new Map<string, number>();
      cancelledOrders.forEach((order: any) => {
        const reason = order.cancellationReason || order.reason || 'Шалтгаан тодорхойгүй';
        reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
      });
      const cancellationReasons = Array.from(reasonCounts.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 reasons
      
      setPaymentMonitoring({
        qpaySuccessRate,
        qpayTotal,
        qpaySuccess,
        qpayFailed,
        failedPayments,
        pendingOrders,
        unresolvedOrders,
        refunds,
        cancellations,
        cancellationReasons
      });
    } catch (err) {
      console.error('Error fetching payment monitoring:', err);
      setPaymentMonitoring({
        qpaySuccessRate: 0,
        qpayTotal: 0,
        qpaySuccess: 0,
        qpayFailed: 0,
        failedPayments: 0,
        pendingOrders: 0,
        unresolvedOrders: 0,
        refunds: 0,
        cancellations: 0,
        cancellationReasons: []
      });
    } finally {
      setPaymentMonitoringLoading(false);
    }
  };

  const fetchProductPerformance = async () => {
    try {
      setPerformanceLoading(true);
      
      // Fetch all products with their stats
      const productsData = await productsApi.getAll({ page: 1, limit: 1000 });
      const products = productsData.products || [];
      
      // Get orders to calculate sales
      const ordersData = await ordersApi.getAll({ page: 1, limit: 1000 });
      const orders = ordersData.orders || [];
      
      // Calculate sales count per product
      const productSalesMap = new Map<number, { count: number; revenue: number }>();
      orders.forEach((order: any) => {
        const productId = order.productId || order.product?.id;
        if (productId) {
          const current = productSalesMap.get(productId) || { count: 0, revenue: 0 };
          productSalesMap.set(productId, {
            count: current.count + 1,
            revenue: current.revenue + (parseFloat(order.amount || order.total || 0))
          });
        }
      });
      
      // Calculate metrics for each product
      const productsWithMetrics = products.map((product: any) => {
        const sales = productSalesMap.get(product.id) || { count: 0, revenue: 0 };
        const views = product.views || 0;
        const conversionRate = views > 0 ? (sales.count / views) * 100 : 0;
        
        return {
          ...product,
          salesCount: sales.count,
          revenue: sales.revenue,
          views: views,
          conversionRate: conversionRate
        };
      });
      
      // Top Selling Products (by sales count and revenue)
      const topSelling = [...productsWithMetrics]
        .filter(p => p.salesCount > 0)
        .sort((a, b) => {
          // Sort by revenue first, then by sales count
          if (b.revenue !== a.revenue) return b.revenue - a.revenue;
          return b.salesCount - a.salesCount;
        })
        .slice(0, 10);
      
      // Low Performance Content (high views but low sales)
      const lowPerformance = [...productsWithMetrics]
        .filter(p => p.views > 50 && p.salesCount < 5) // High views but low sales
        .sort((a, b) => {
          // Sort by views descending, but prioritize those with 0 sales
          if (a.salesCount === 0 && b.salesCount > 0) return -1;
          if (b.salesCount === 0 && a.salesCount > 0) return 1;
          return b.views - a.views;
        })
        .slice(0, 10);
      
      // Overall Conversion Rate
      const totalViews = productsWithMetrics.reduce((sum: number, p: any) => sum + p.views, 0);
      const totalSales = productsWithMetrics.reduce((sum: number, p: any) => sum + p.salesCount, 0);
      const overallConversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;
      
      // Category Revenue
      const categoryRevenueMap = new Map<number | string, { name: string; revenue: number; count: number }>();
      productsWithMetrics.forEach((product: any) => {
        const categoryId = product.categoryId || product.category?.id || 'unknown';
        const categoryName = product.category?.name || 'Unknown';
        const current = categoryRevenueMap.get(categoryId) || { name: categoryName, revenue: 0, count: 0 };
        categoryRevenueMap.set(categoryId, {
          name: categoryName,
          revenue: current.revenue + product.revenue,
          count: current.count + product.salesCount
        });
      });
      
      const categoryRevenue = Array.from(categoryRevenueMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      setProductPerformance({
        topSelling,
        lowPerformance,
        conversionRate: overallConversionRate,
        categoryRevenue
      });
    } catch (err) {
      console.error('Error fetching product performance:', err);
      setProductPerformance({
        topSelling: [],
        lowPerformance: [],
        conversionRate: 0,
        categoryRevenue: []
      });
    } finally {
      setPerformanceLoading(false);
    }
  };

  const fetchUserBehavior = async () => {
    try {
      setUserBehaviorLoading(true);
      
      // Fetch all orders to calculate metrics
      const ordersResponse = await ordersApi.getAll({ page: 1, limit: 1000 });
      const allOrders = ordersResponse.orders || [];
      const completedOrders = allOrders.filter((o: any) => o.status === 'completed');
      
      // Fetch all users
      const usersResponse = await usersApi.getAll({ page: 1, limit: 1000 });
      const allUsers = usersResponse.users || [];
      
      // 1. New vs Returning Users
      // New users: users created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newUsers = allUsers.filter((u: any) => 
        new Date(u.createdAt) >= thirtyDaysAgo
      ).length;
      
      // Returning buyers: users who have made more than 1 purchase
      const userOrderCounts = new Map<number, number>();
      completedOrders.forEach((order: any) => {
        if (order.userId) {
          userOrderCounts.set(order.userId, (userOrderCounts.get(order.userId) || 0) + 1);
        }
      });
      const returningBuyers = Array.from(userOrderCounts.values()).filter(count => count > 1).length;
      
      // 2. Conversion Rates
      // Visitor → Buyer: completed orders / total users (approximation)
      const totalBuyers = new Set(completedOrders.map((o: any) => o.userId).filter(Boolean)).size;
      const visitorToBuyerRate = allUsers.length > 0 
        ? (totalBuyers / allUsers.length) * 100 
        : 0;
      
      // Registered → Paid: registered users who made purchases
      const registeredUsers = allUsers.length;
      const registeredToPaidRate = registeredUsers > 0 
        ? (totalBuyers / registeredUsers) * 100 
        : 0;
      
      // 3. Top Paying Users
      const userRevenue = new Map<number, { userId: number; revenue: number; user: any }>();
      completedOrders.forEach((order: any) => {
        if (order.userId && order.amount) {
          const current = userRevenue.get(order.userId) || { userId: order.userId, revenue: 0, user: order.user };
          current.revenue += parseFloat(order.amount) || 0;
          userRevenue.set(order.userId, current);
        }
      });
      
      const topPayingUsers = Array.from(userRevenue.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(item => ({
          userId: item.userId,
          revenue: item.revenue,
          username: item.user?.username || item.user?.fullName || `User ${item.userId}`,
          orderCount: userOrderCounts.get(item.userId) || 0
        }));
      
      // 4. Guest vs Registered Purchase
      const guestOrders = completedOrders.filter((o: any) => !o.userId);
      const registeredOrders = completedOrders.filter((o: any) => o.userId);
      const totalCompletedOrders = completedOrders.length;
      
      const guestPurchasePercentage = totalCompletedOrders > 0 
        ? (guestOrders.length / totalCompletedOrders) * 100 
        : 0;
      const registeredPurchasePercentage = totalCompletedOrders > 0 
        ? (registeredOrders.length / totalCompletedOrders) * 100 
        : 0;
      
      setUserBehavior({
        newUsers,
        returningBuyers,
        visitorToBuyerRate,
        registeredToPaidRate,
        topPayingUsers,
        guestPurchasePercentage,
        registeredPurchasePercentage
      });
    } catch (err) {
      console.error('Error fetching user behavior:', err);
      setUserBehavior({
        newUsers: 0,
        returningBuyers: 0,
        visitorToBuyerRate: 0,
        registeredToPaidRate: 0,
        topPayingUsers: [],
        guestPurchasePercentage: 0,
        registeredPurchasePercentage: 0
      });
    } finally {
      setUserBehaviorLoading(false);
    }
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
      </div>

      {/* Revenue Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Revenue Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader>
            <div className="flex flex-col gap-3">
              <CardTitle className="text-xl font-bold">Нийт орлого (Total Revenue)</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={revenuePeriod === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRevenuePeriod('today')}
                  disabled={revenueLoading}
                >
                  Өнөөдөр
                </Button>
                <Button
                  variant={revenuePeriod === '7days' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRevenuePeriod('7days')}
                  disabled={revenueLoading}
                >
                  7 хоног
                </Button>
                <Button
                  variant={revenuePeriod === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRevenuePeriod('month')}
                  disabled={revenueLoading}
                >
                  Сар
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <div className="text-4xl font-bold text-purple-900">
                    {formatPrice(revenueData.current)}
                  </div>
                  {revenueData.growth !== 0 && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold ${
                      revenueData.growth >= 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {revenueData.growth >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>{Math.abs(revenueData.growth).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <div className="text-sm text-purple-700">
                  {revenuePeriod === 'today' && 'Өмнөх өдөртэй харьцуулалт'}
                  {revenuePeriod === '7days' && 'Өмнөх 7 хоногтой харьцуулалт'}
                  {revenuePeriod === 'month' && 'Өмнөх сартай харьцуулалт'}
                  {revenueData.previous > 0 && (
                    <span className="ml-2">
                      ({formatPrice(revenueData.previous)})
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Revenue Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Захиалгын орлого (Subscription Revenue)</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-4xl font-bold text-blue-900">
                  {formatPrice(subscriptionRevenue.active)}
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-blue-700">
                    Active subscription-оос орж буй орлого
                  </div>
                  {revenueData.current > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-blue-800">
                        Нийт орлогын {subscriptionRevenue.percentage.toFixed(1)}%
                      </div>
                      <div className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${Math.min(subscriptionRevenue.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* One-time / Content Sales Card */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Нэг удаагийн борлуулалтын орлого (One-time / Content Sales)</CardTitle>
          </CardHeader>
          <CardContent>
            {oneTimeLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-4xl font-bold text-green-900">
                  {formatPrice(oneTimeRevenue.total)}
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-700">Membership эрхийн борлуулалт:</span>
                      <span className="font-semibold text-green-900">{formatPrice(oneTimeRevenue.membership)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-700">ADS/Unique болгосон орлого:</span>
                      <span className="font-semibold text-green-900">{formatPrice(oneTimeRevenue.adsUnique)}</span>
                    </div>
                  </div>
                  {revenueData.current > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-green-200">
                      <div className="text-sm font-semibold text-green-800">
                        Нийт орлогын {oneTimeRevenue.percentage.toFixed(1)}%
                      </div>
                      <div className="flex-1 h-2 bg-green-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-600 transition-all duration-300"
                          style={{ width: `${Math.min(oneTimeRevenue.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Statistics Card */}
      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Захиалгын статистик</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-3xl font-bold text-indigo-900">{stats.totalOrders}</div>
              <div className="text-sm text-indigo-700 mt-1">Захиалгын тоо</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-700">{stats.newOrders}</div>
              <div className="text-sm text-yellow-600 mt-1">Шинэ захиалга</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-3xl font-bold text-emerald-700">{stats.activeOrders}</div>
              <div className="text-sm text-emerald-600 mt-1">Active захиалга</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-3xl font-bold text-red-700">{stats.cancelledOrders}</div>
              <div className="text-sm text-red-600 mt-1">Цуцлагдсан захиалга</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      {/* User Statistics Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Хэрэглэгчийн статистик
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-4xl font-bold text-blue-900 mb-2">{stats.totalUsers}</div>
              <div className="text-sm font-semibold text-blue-700 mb-1">Нийт хэрэглэгч</div>
              <div className="text-xs text-blue-600">
                Бүртгэлтэй: {stats.registeredUsers || stats.totalUsers}
              </div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-4xl font-bold text-blue-800 mb-2">{stats.totalJournalists}</div>
              <div className="text-sm font-semibold text-blue-700 mb-1">Нийтлэлч</div>
              <div className="text-xs text-blue-600">
                Бүртгэлтэй хэрэглэгч
              </div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-4xl font-bold text-blue-700 mb-2">{stats.guestBuyers || 0}</div>
              <div className="text-sm font-semibold text-blue-700 mb-1">Guest худалдан авагч</div>
              <div className="text-xs text-blue-600">
                Бүртгэлгүй худалдан авагч
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* User Behavior Section */}
      <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-pink-600" />
            Хэрэглэгчийн зан төлөв (User Behavior)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userBehaviorLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* New vs Returning Users */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/70 rounded-lg p-4 border border-pink-200">
                  <div className="text-sm font-semibold text-pink-700 mb-2">New vs Returning Users</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Шинэ хэрэглэгч (30 хоног)</span>
                      <span className="text-lg font-bold text-pink-900">{userBehavior.newUsers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Дахин худалдан авалт хийсэн хэрэглэгч</span>
                      <span className="text-lg font-bold text-pink-900">{userBehavior.returningBuyers}</span>
                    </div>
                  </div>
                </div>

                {/* Conversion Rate */}
                <div className="bg-white/70 rounded-lg p-4 border border-pink-200">
                  <div className="text-sm font-semibold text-pink-700 mb-2">Conversion Rate</div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Visitor → Buyer</span>
                        <span className="text-lg font-bold text-pink-900">{userBehavior.visitorToBuyerRate.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-pink-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-pink-600 transition-all duration-300"
                          style={{ width: `${Math.min(userBehavior.visitorToBuyerRate, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Registered → Paid</span>
                        <span className="text-lg font-bold text-pink-900">{userBehavior.registeredToPaidRate.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-pink-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-pink-600 transition-all duration-300"
                          style={{ width: `${Math.min(userBehavior.registeredToPaidRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Paying Users */}
              <div className="bg-white/70 rounded-lg p-4 border border-pink-200">
                <div className="text-sm font-semibold text-pink-700 mb-3">Top Paying Users (Хамгийн их орлого оруулсан хэрэглэгчид)</div>
                {userBehavior.topPayingUsers.length > 0 ? (
                  <div className="space-y-2">
                    {userBehavior.topPayingUsers.map((user, index) => (
                      <div key={user.userId} className="flex items-center justify-between p-2 bg-white/50 rounded">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-pink-700 font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.username}</div>
                            <div className="text-xs text-gray-500">{user.orderCount} захиалга</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-pink-900">{formatPrice(user.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Мэдээлэл байхгүй байна
                  </div>
                )}
              </div>

              {/* Guest vs Registered Purchase */}
              <div className="bg-white/70 rounded-lg p-4 border border-pink-200">
                <div className="text-sm font-semibold text-pink-700 mb-3">Guest vs Registered Purchase</div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Guest худалдан авалт</span>
                      <span className="text-lg font-bold text-pink-900">{userBehavior.guestPurchasePercentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 transition-all duration-300"
                        style={{ width: `${Math.min(userBehavior.guestPurchasePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Бүртгэлтэй хэрэглэгч</span>
                      <span className="text-lg font-bold text-pink-900">{userBehavior.registeredPurchasePercentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${Math.min(userBehavior.registeredPurchasePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content and Product Performance Section */}
      <Card className="bg-gradient-to-br from-pink-50 to-rose-100 border-rose-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <span className="text-2xl">❤️</span>
            Контент ба бүтээгдэхүүний гүйцэтгэл
            <span className="text-lg font-normal text-rose-700">Танай платформын гол зүрх</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {performanceLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Selling Content */}
              <div>
                <h3 className="text-xl font-bold text-rose-900 mb-4">Top Selling Content / Course</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {productPerformance.topSelling.length > 0 ? (
                    productPerformance.topSelling.slice(0, 6).map((product: any, index: number) => (
                      <div key={product.id} className="bg-white/70 rounded-lg p-4 border border-rose-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg font-bold text-rose-600">#{index + 1}</span>
                              <h4 className="font-semibold text-gray-900 line-clamp-1">{product.title}</h4>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {product.category?.name || 'Unknown Category'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Борлуулалт:</span>
                            <span className="font-bold text-rose-700 ml-1">{product.salesCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Орлого:</span>
                            <span className="font-bold text-rose-700 ml-1">{formatPrice(product.revenue)}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">Үзсэн:</span>
                            <span className="font-semibold text-gray-700 ml-1">{product.views || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-4 text-gray-500">
                      Борлуулалт хийгдсэн контент олдсонгүй
                    </div>
                  )}
                </div>
              </div>

              {/* Low Performance Content */}
              <div>
                <h3 className="text-xl font-bold text-rose-900 mb-4">Low Performance Content</h3>
                <p className="text-sm text-rose-700 mb-4">Олон үзэлттэй ч борлуулалт муу контент</p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {productPerformance.lowPerformance.length > 0 ? (
                    productPerformance.lowPerformance.slice(0, 6).map((product: any) => (
                      <div key={product.id} className="bg-white/70 rounded-lg p-4 border border-yellow-200">
                        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.title}</h4>
                        <p className="text-xs text-gray-600 mb-3">{product.category?.name || 'Unknown'}</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Үзсэн:</span>
                            <span className="font-bold text-yellow-700">{product.views || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Борлуулалт:</span>
                            <span className="font-bold text-red-600">{product.salesCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Conversion:</span>
                            <span className="font-semibold text-gray-700">{product.conversionRate.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-4 text-gray-500">
                      Low performance контент олдсонгүй
                    </div>
                  )}
                </div>
              </div>

              {/* Conversion Rate and Category Revenue */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Content Conversion Rate */}
                <Card className="bg-white/70 border-rose-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-rose-900">Content Conversion Rate</CardTitle>
                    <p className="text-sm text-rose-700">Үзсэн → худалдаж авсан %</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <div className="text-5xl font-bold text-rose-600 mb-2">
                        {productPerformance.conversionRate.toFixed(2)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        Нийт контент дахь conversion rate
                      </div>
                      <div className="mt-4 h-3 bg-rose-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-600 transition-all duration-500"
                          style={{ width: `${Math.min(productPerformance.conversionRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Category Revenue */}
                <Card className="bg-white/70 border-rose-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-rose-900">Content Category Revenue</CardTitle>
                    <p className="text-sm text-rose-700">Аль төрлийн контент хамгийн ашигтай вэ</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {productPerformance.categoryRevenue.length > 0 ? (
                        productPerformance.categoryRevenue.map((cat: any, index: number) => {
                          const maxRevenue = productPerformance.categoryRevenue[0]?.revenue || 1;
                          const percentage = (cat.revenue / maxRevenue) * 100;
                          
                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-gray-900">{cat.name}</span>
                                <span className="font-bold text-rose-700">{formatPrice(cat.revenue)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-rose-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-rose-600 transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-600 w-12 text-right">{cat.count} борлуулалт</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          Категори дахь орлого олдсонгүй
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order and Payment Monitoring */}
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Захиалга ба төлбөрийн мониторинг
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">Санхүү, алдаа эрсдэлийг хурдан барихад</p>
        </CardHeader>
        <CardContent>
          {paymentMonitoringLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-red-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Payment Success Rate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/70 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Төлбөрийн амжилтын хувь</span>
                    <span className={`text-lg font-bold ${
                      paymentMonitoring.qpaySuccessRate >= 90 ? 'text-green-600' :
                      paymentMonitoring.qpaySuccessRate >= 70 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {paymentMonitoring.qpaySuccessRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">QPay Success Rate</div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        paymentMonitoring.qpaySuccessRate >= 90 ? 'bg-green-500' :
                        paymentMonitoring.qpaySuccessRate >= 70 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(paymentMonitoring.qpaySuccessRate, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Амжилттай: {paymentMonitoring.qpaySuccess} / Нийт: {paymentMonitoring.qpayTotal}
                  </div>
                </div>

                <div className="bg-white/70 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Алдаатай төлбөр</span>
                    <span className="text-lg font-bold text-red-600">
                      {paymentMonitoring.failedPayments}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">Failed Payment</div>
                  {paymentMonitoring.qpayFailed > 0 && (
                    <div className="text-xs text-red-600 mt-2">
                      QPay алдаа: {paymentMonitoring.qpayFailed}
                    </div>
                  )}
                </div>
              </div>

              {/* Pending / Failed Orders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/70 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Хүлээгдэж байгаа захиалга</span>
                    <span className="text-lg font-bold text-yellow-600">
                      {paymentMonitoring.pendingOrders}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">Pending / Failed Orders</div>
                </div>

                <div className="bg-white/70 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Шийдвэрлээгүй захиалга</span>
                    <span className="text-lg font-bold text-orange-600">
                      {paymentMonitoring.unresolvedOrders}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">Unresolved Orders</div>
                  <div className="text-xs text-gray-500 mt-2">
                    (Pending: {paymentMonitoring.pendingOrders} + Failed: {paymentMonitoring.failedPayments})
                  </div>
                </div>
              </div>

              {/* Refund / Cancellation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/70 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Буцаалт</span>
                    <span className="text-lg font-bold text-purple-600">
                      {paymentMonitoring.refunds}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">Refund / Cancellation</div>
                </div>

                <div className="bg-white/70 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Цуцлалт</span>
                    <span className="text-lg font-bold text-red-600">
                      {paymentMonitoring.cancellations}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">Cancellations</div>
                </div>
              </div>

              {/* Cancellation Reasons */}
              {paymentMonitoring.cancellationReasons.length > 0 && (
                <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Цуцлалтын шалтгаан</div>
                  <div className="space-y-2">
                    {paymentMonitoring.cancellationReasons.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex-1 truncate mr-2">{item.reason}</span>
                        <span className="font-semibold text-red-600">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Actions Log & System Health */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Admin Actions Log */}
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-indigo-600" />
              Admin Actions Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {actionsLogLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : adminActionsLog.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {adminActionsLog.map((action: any) => (
                  <div key={action.id} className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-indigo-900">{action.action}</div>
                      <div className="text-xs text-indigo-700 mt-1">
                        {action.target}
                      </div>
                      <div className="text-xs text-indigo-600 mt-1">
                        {action.admin} • {new Date(action.timestamp).toLocaleString('mn-MN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-indigo-600">
                Үйлдлүүд олдсонгүй
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Payment API Status */}
                <div className="p-4 bg-white/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-emerald-900">Payment API Status</div>
                    {systemHealth.paymentApi.status === 'healthy' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {systemHealth.paymentApi.status === 'warning' && (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    {systemHealth.paymentApi.status === 'error' && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    {systemHealth.paymentApi.status === 'unknown' && (
                      <Clock className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className={`text-sm ${
                    systemHealth.paymentApi.status === 'healthy' ? 'text-green-700' :
                    systemHealth.paymentApi.status === 'warning' ? 'text-yellow-700' :
                    systemHealth.paymentApi.status === 'error' ? 'text-red-700' :
                    'text-gray-700'
                  }`}>
                    {systemHealth.paymentApi.message || 'Checking...'}
                  </div>
                </div>

                {/* Download Error Count */}
                <div className="p-4 bg-white/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-emerald-900">Download Error Count</div>
                    {systemHealth.downloadErrors.count === 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : systemHealth.downloadErrors.count < 10 ? (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className={`text-2xl font-bold ${
                    systemHealth.downloadErrors.count === 0 ? 'text-green-700' :
                    systemHealth.downloadErrors.count < 10 ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {systemHealth.downloadErrors.count}
                  </div>
                  <div className="text-xs text-emerald-700 mt-1">
                    Last {systemHealth.downloadErrors.period}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Executive View */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-slate-700" />
            Executive View - CEO / Founder Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {executiveLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Monthly Revenue */}
                <div className="bg-white p-6 rounded-lg shadow-md border-2 border-slate-200">
                  <div className="text-sm font-semibold text-slate-600 mb-2">Нийт орлого (сар)</div>
                  <div className="text-3xl font-bold text-slate-900">{formatPrice(executiveView.monthlyRevenue)}</div>
                </div>

                {/* Subscription Growth */}
                <div className="bg-white p-6 rounded-lg shadow-md border-2 border-slate-200">
                  <div className="text-sm font-semibold text-slate-600 mb-2">Subscription-ийн өсөлт %</div>
                  <div className={`text-3xl font-bold flex items-center gap-2 ${
                    executiveView.subscriptionGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {executiveView.subscriptionGrowth >= 0 ? (
                      <TrendingUp className="h-6 w-6" />
                    ) : (
                      <TrendingDown className="h-6 w-6" />
                    )}
                    {executiveView.subscriptionGrowth.toFixed(1)}%
                  </div>
                </div>

                {/* Active Subscribers */}
                <div className="bg-white p-6 rounded-lg shadow-md border-2 border-slate-200">
                  <div className="text-sm font-semibold text-slate-600 mb-2">Active subscribers</div>
                  <div className="text-3xl font-bold text-slate-900">{executiveView.activeSubscribers}</div>
                </div>
              </div>

              {/* ARPU and Conversion Rate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-md border-2 border-slate-200">
                  <div className="text-sm font-semibold text-slate-600 mb-2">ARPU (Average Revenue Per User)</div>
                  <div className="text-3xl font-bold text-slate-900">{formatPrice(executiveView.arpu)}</div>
                  <div className="text-xs text-slate-500 mt-2">Нийт орлого / Идэвхтэй хэрэглэгч</div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-2 border-slate-200">
                  <div className="text-sm font-semibold text-slate-600 mb-2">Conversion Rate</div>
                  <div className="text-3xl font-bold text-slate-900">{executiveView.conversionRate.toFixed(2)}%</div>
                  <div className="text-xs text-slate-500 mt-2">Захиалга / Үзсэн тоо</div>
                </div>
              </div>

              {/* Top 10 Content */}
              <div className="bg-white p-6 rounded-lg shadow-md border-2 border-slate-200">
                <div className="text-lg font-bold text-slate-900 mb-4">Top 10 контент</div>
                {executiveView.topContent.length > 0 ? (
                  <div className="space-y-3">
                    {executiveView.topContent.map((content, index) => (
                      <div 
                        key={content.id || index} 
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-full font-bold text-slate-700">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 truncate">{content.title || 'N/A'}</div>
                            <div className="text-xs text-slate-600">
                              {content.category?.name || 'Category N/A'} • {content.sales || 0} захиалга
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">{formatPrice(content.revenue || 0)}</div>
                          <div className="text-xs text-slate-500">{content.views || 0} үзсэн</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    Контент олдсонгүй
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}