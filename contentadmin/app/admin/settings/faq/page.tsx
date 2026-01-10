"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, Trash2, Plus, Loader2, Search, HelpCircle, ArrowUp, ArrowDown } from "lucide-react";
import { faqsApi } from "@/lib/api";

// FAQ type based on your API
export interface FAQData {
  id: number;
  question: {
    mn: string;
    en: string;
  };
  answer: {
    mn: string;
    en: string;
  };
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// FAQ Form Component
function FAQForm({
  faq,
  onSubmit,
  onCancel,
  isLoading
}: {
  faq?: FAQData;
  onSubmit: (faqData: Omit<FAQData, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<Omit<FAQData, "id" | "createdAt" | "updatedAt">>({
    question: {
      mn: faq?.question.mn || "",
      en: faq?.question.en || "",
    },
    answer: {
      mn: faq?.answer.mn || "",
      en: faq?.answer.en || "",
    },
    order: faq?.order || 0,
    isActive: faq?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mongolian Question */}
        <div>
          <Label htmlFor="questionMn">Асуулт (Монгол) *</Label>
          <Input
            id="questionMn"
            value={form.question.mn}
            onChange={(e) => setForm({
              ...form,
              question: { ...form.question, mn: e.target.value }
            })}
            placeholder="Монгол асуулт оруулна уу"
            required
          />
        </div>

        {/* English Question */}
        <div>
          <Label htmlFor="questionEn">Question (English)</Label>
          <Input
            id="questionEn"
            value={form.question.en}
            onChange={(e) => setForm({
              ...form,
              question: { ...form.question, en: e.target.value }
            })}
            placeholder="Enter question in English (optional)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mongolian Answer */}
        <div>
          <Label htmlFor="answerMn">Хариулт (Монгол) *</Label>
          <Textarea
            id="answerMn"
            value={form.answer.mn}
            onChange={(e) => setForm({
              ...form,
              answer: { ...form.answer, mn: e.target.value }
            })}
            placeholder="Монгол хариулт оруулна уу"
            rows={6}
            required
            className="resize-none"
          />
        </div>

        {/* English Answer */}
        <div>
          <Label htmlFor="answerEn">Answer (English)</Label>
          <Textarea
            id="answerEn"
            value={form.answer.en}
            onChange={(e) => setForm({
              ...form,
              answer: { ...form.answer, en: e.target.value }
            })}
            placeholder="Enter answer in English (optional)"
            rows={6}
            className="resize-none"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="order">Дараалал</Label>
        <Input
          id="order"
          type="number"
          value={form.order}
          onChange={(e) => setForm({...form, order: parseInt(e.target.value) || 0})}
          placeholder="0"
        />
        <p className="text-xs text-gray-500 mt-1">Бага тоо эхэнд харагдана</p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={form.isActive}
          onChange={(e) => setForm({...form, isActive: e.target.checked})}
          className="rounded border-gray-300"
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          Идэвхтэй
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Цуцлах
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            faq ? "Хадгалах" : "Үүсгэх"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function FAQManagePage() {
  const [faqs, setFaqs] = useState<FAQData[]>([]);
  const [editingFAQ, setEditingFAQ] = useState<FAQData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, faqId?: number}>({open: false});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch FAQs from API
  const fetchFAQs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await faqsApi.getAll();
      
      if (result.faqs && Array.isArray(result.faqs)) {
        setFaqs(result.faqs);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch FAQs');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch FAQs on component mount
  useEffect(() => {
    fetchFAQs();
  }, []);

  // Create FAQ via API
  const createFAQ = async (faqData: Omit<FAQData, "id" | "createdAt" | "updatedAt">) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await faqsApi.create({
        question: faqData.question,
        answer: faqData.answer,
        order: faqData.order,
        isActive: faqData.isActive,
      });

      setSuccess('Асуулт-хариулт амжилттай үүслээ');
      setShowForm(false);
      fetchFAQs();
    } catch (err) {
      console.error('Error creating FAQ:', err);
      setError(err instanceof Error ? err.message : 'Failed to create FAQ');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Update FAQ via API
  const updateFAQ = async (faqData: Omit<FAQData, "id" | "createdAt" | "updatedAt">) => {
    if (!editingFAQ) return;

    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await faqsApi.update(editingFAQ.id, {
        question: faqData.question,
        answer: faqData.answer,
        order: faqData.order,
        isActive: faqData.isActive,
      });

      setSuccess('Асуулт-хариулт амжилттай шинэчлэгдлээ');
      setEditingFAQ(null);
      fetchFAQs();
    } catch (err) {
      console.error('Error updating FAQ:', err);
      setError(err instanceof Error ? err.message : 'Failed to update FAQ');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Delete FAQ via API
  const deleteFAQ = async (id: number) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      await faqsApi.delete(id);
      
      setSuccess('Асуулт-хариулт амжилттай устгагдлаа');
      setDeleteDialog({open: false});
      fetchFAQs();
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete FAQ');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Update FAQ order
  const updateFAQOrder = async (id: number, newOrder: number) => {
    try {
      const faq = faqs.find(f => f.id === id);
      if (!faq) return;

      await faqsApi.update(id, { order: newOrder });
      fetchFAQs();
    } catch (err) {
      console.error('Error updating FAQ order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update FAQ order');
    }
  };

  // Filter FAQs
  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.mn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.question.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.mn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.en.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && faq.isActive) ||
                         (statusFilter === "inactive" && !faq.isActive);
    return matchesSearch && matchesStatus;
  });

  // Sort by order
  const sortedFAQs = [...filteredFAQs].sort((a, b) => a.order - b.order);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Асуулт-хариулт удирдах</h1>
          <p className="text-gray-500 mt-1">Вэбсайтын FAQ хэсгийн асуулт-хариултуудыг удирдах</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Шинэ асуулт-хариулт
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <p className="text-green-800">{success}</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Асуулт эсвэл хариултаар хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">Бүх статус</option>
              <option value="active">Идэвхтэй</option>
              <option value="inactive">Идэвхгүй</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* FAQs List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </CardContent>
        </Card>
      ) : sortedFAQs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Асуулт-хариулт олдсонгүй</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedFAQs.map((faq, index) => (
            <Card key={faq.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-500">#{faq.order}</span>
                      <CardTitle className="text-lg">{faq.question.mn}</CardTitle>
                    </div>
                    <p className="text-sm text-gray-600 italic">{faq.question.en}</p>
                  </div>
                  <Badge variant={faq.isActive ? "default" : "secondary"}>
                    {faq.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Хариулт (Монгол):</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{faq.answer.mn}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Answer (English):</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{faq.answer.en}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (index > 0) {
                        const prevFAQ = sortedFAQs[index - 1];
                        updateFAQOrder(faq.id, prevFAQ.order);
                        updateFAQOrder(prevFAQ.id, faq.order);
                      }
                    }}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Дээш
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (index < sortedFAQs.length - 1) {
                        const nextFAQ = sortedFAQs[index + 1];
                        updateFAQOrder(faq.id, nextFAQ.order);
                        updateFAQOrder(nextFAQ.id, faq.order);
                      }
                    }}
                    disabled={index === sortedFAQs.length - 1}
                  >
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Доош
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingFAQ(faq);
                      setShowForm(false);
                    }}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Засах
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteDialog({open: true, faqId: faq.id})}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Устгах
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm || editingFAQ !== null} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditingFAQ(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFAQ ? "Асуулт-хариулт засах" : "Шинэ асуулт-хариулт үүсгэх"}
            </DialogTitle>
          </DialogHeader>
          <FAQForm
            faq={editingFAQ || undefined}
            onSubmit={editingFAQ ? updateFAQ : createFAQ}
            onCancel={() => {
              setShowForm(false);
              setEditingFAQ(null);
            }}
            isLoading={isFormLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Асуулт-хариулт устгах</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Та энэ асуулт-хариултыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({open: false})}
              disabled={isFormLoading}
            >
              Цуцлах
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialog.faqId) {
                  deleteFAQ(deleteDialog.faqId);
                }
              }}
              disabled={isFormLoading}
            >
              {isFormLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Устгаж байна...
                </>
              ) : (
                "Устгах"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

