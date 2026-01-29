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

interface IncomeSummary {
  subscriptionTotal: number;
  purchaseTotal: number;
  grandTotal: number;
  subscriptionCount: number;
  purchaseCount: number;
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Нийт орлого</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.summary.grandTotal)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.summary.subscriptionCount + data.summary.purchaseCount} захиалга
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

      {/* Data Tables */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : data ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Бүгд</TabsTrigger>
            <TabsTrigger value="subscription">Захиалга</TabsTrigger>
            <TabsTrigger value="purchase">Худалдан авалт</TabsTrigger>
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

            {(!data.subscriptions || data.subscriptions.length === 0) && 
             (!data.purchases || data.purchases.length === 0) && (
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

