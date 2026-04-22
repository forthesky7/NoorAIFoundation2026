import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListVideos, getListVideosQueryKey,
  useCreateVideo, useDeleteVideo,
  useGetAdminDashboard, getGetAdminDashboardQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  PlayCircle, Users, CreditCard, Plus, Trash2, Link2, Upload,
  CheckCircle2, AlertCircle, Search, UserCheck, Send, Settings
} from "lucide-react";
import { apiClient } from "@/lib/api";

function extractYouTubeId(input: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return input.trim();
}

const CATEGORIES = [
  { value: "Qudurat", labelAr: "قدرات", labelEn: "Qudurat" },
  { value: "Tahsili", labelAr: "تحصيلي", labelEn: "Tahsili" },
  { value: "Secondary", labelAr: "ثانوي - مسارات", labelEn: "Secondary - Tracks" },
  { value: "General", labelAr: "عام", labelEn: "General" },
];

type BulkStatus = { url: string; status: "pending" | "success" | "error"; message?: string };
type AdminUser = { id: number; name: string; email: string; role: string; subscribed: boolean; createdAt: string };

export default function AdminNoor() {
  const { t, lang } = useLang();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [category, setCategory] = useState("General");
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkCategory, setBulkCategory] = useState("General");
  const [bulkStatuses, setBulkStatuses] = useState<BulkStatus[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // User management
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [activatingId, setActivatingId] = useState<number | null>(null);

  // Telegram link
  const [telegramLink, setTelegramLink] = useState(() => localStorage.getItem("noor_telegram_link") || "");
  const [telegramSaved, setTelegramSaved] = useState(false);

  // Payment settings (Lemon Squeezy + NOWPayments TRC20)
  const [lsApiKey, setLsApiKey] = useState("");
  const [lsStoreId, setLsStoreId] = useState("");
  const [lsVariantId, setLsVariantId] = useState("");
  const [lsWebhookSecret, setLsWebhookSecret] = useState("");
  const [trc20Wallet, setTrc20Wallet] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<{ isLemonSqueezyConfigured?: boolean } | null>(null);

  const { data: stats, isLoading: statsLoading } = useGetAdminDashboard({
    query: { queryKey: getGetAdminDashboardQueryKey() },
  });

  const { data: videos, isLoading: videosLoading } = useListVideos(undefined, {
    query: { queryKey: getListVideosQueryKey() },
  });

  const createVideoMutation = useCreateVideo();
  const deleteVideoMutation = useDeleteVideo();

  const fetchUsers = async (search = "") => {
    setUsersLoading(true);
    try {
      const res = await apiClient.get(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      if (res.ok) setUsers(await res.json());
    } catch { /* ignore */ }
    setUsersLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    apiClient.get("/admin/settings").then(async r => {
      if (r.ok) {
        const data = await r.json();
        setSettingsStatus(data);
        setLsStoreId(data.LEMONSQUEEZY_STORE_ID || "");
        setLsVariantId(data.LEMONSQUEEZY_VARIANT_ID || "");
        setTrc20Wallet(data.NOWPAYMENTS_WALLET_TRC20 || "");
      }
    }).catch(() => {});
  }, []);

  const handleSavePaymentSettings = async () => {
    setSettingsSaving(true);
    const payload: Record<string, string> = {};
    if (lsApiKey.trim()) payload.LEMONSQUEEZY_API_KEY = lsApiKey.trim();
    if (lsStoreId.trim()) payload.LEMONSQUEEZY_STORE_ID = lsStoreId.trim();
    if (lsVariantId.trim()) payload.LEMONSQUEEZY_VARIANT_ID = lsVariantId.trim();
    if (lsWebhookSecret.trim()) payload.LEMONSQUEEZY_WEBHOOK_SECRET = lsWebhookSecret.trim();
    if (trc20Wallet.trim()) payload.NOWPAYMENTS_WALLET_TRC20 = trc20Wallet.trim();
    const res = await apiClient.post("/admin/settings", payload);
    setSettingsSaving(false);
    if (res.ok) {
      const data = await res.json();
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      toast({ title: lang === "ar" ? "تم حفظ الإعدادات ✓" : "Settings saved ✓" });
      setSettingsStatus(prev => ({ ...prev, isLemonSqueezyConfigured: !!(payload.LEMONSQUEEZY_API_KEY || lsApiKey) && !!(payload.LEMONSQUEEZY_STORE_ID || lsStoreId) && !!(payload.LEMONSQUEEZY_VARIANT_ID || lsVariantId) }));
      setLsApiKey(""); setLsWebhookSecret("");
    } else {
      toast({ title: lang === "ar" ? "فشل الحفظ" : "Save failed", variant: "destructive" });
    }
  };

  const handleActivate = async (userId: number) => {
    setActivatingId(userId);
    try {
      const res = await apiClient.post(`/admin/users/${userId}/activate`, {});
      if (res.ok) {
        toast({ title: lang === "ar" ? "تم تفعيل الاشتراك بنجاح ✓" : "Subscription activated ✓" });
        fetchUsers(userSearch);
        queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
      } else {
        toast({ title: lang === "ar" ? "فشل التفعيل" : "Activation failed", variant: "destructive" });
      }
    } catch {
      toast({ title: lang === "ar" ? "خطأ في الاتصال" : "Connection error", variant: "destructive" });
    }
    setActivatingId(null);
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const youtubeId = extractYouTubeId(youtubeUrl.trim());
    createVideoMutation.mutate(
      { data: { title, youtubeId, description: "", subject: category, grade: "General", duration: 300, thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVideosQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
          toast({ title: lang === "ar" ? "تم إضافة الفيديو بنجاح" : "Video added successfully" });
          setTitle(""); setYoutubeUrl(""); setCategory("General"); setShowForm(false);
        },
        onError: () => {
          toast({ title: lang === "ar" ? "فشل الإضافة" : "Failed to add video", variant: "destructive" });
        },
      }
    );
  };

  const handleBulkUpload = async () => {
    const lines = bulkUrls.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;
    const statuses: BulkStatus[] = lines.map(url => ({ url, status: "pending" }));
    setBulkStatuses([...statuses]);
    setIsBulkLoading(true);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const youtubeId = extractYouTubeId(line);
      const parts = line.split("|").map(p => p.trim());
      const customTitle = parts[1] || `فيديو ${youtubeId}`;
      try {
        await new Promise<void>((resolve, reject) => {
          createVideoMutation.mutate(
            { data: { title: customTitle, youtubeId, description: "", subject: bulkCategory, grade: "General", duration: 300, thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` } },
            { onSuccess: () => resolve(), onError: (e: any) => reject(e) }
          );
        });
        statuses[i] = { url: line, status: "success", message: youtubeId };
      } catch {
        statuses[i] = { url: line, status: "error", message: lang === "ar" ? "فشل الرفع" : "Upload failed" };
      }
      setBulkStatuses([...statuses]);
    }
    setIsBulkLoading(false);
    queryClient.invalidateQueries({ queryKey: getListVideosQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
    const successCount = statuses.filter(s => s.status === "success").length;
    toast({ title: lang === "ar" ? `تم رفع ${successCount} من ${lines.length} فيديو` : `Uploaded ${successCount} of ${lines.length} videos` });
  };

  const handleDelete = (id: number) => {
    if (confirm(t.confirmDelete)) {
      deleteVideoMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListVideosQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
            toast({ title: lang === "ar" ? "تم حذف الفيديو" : "Video deleted" });
          },
        }
      );
    }
  };

  const handleSaveTelegram = () => {
    localStorage.setItem("noor_telegram_link", telegramLink);
    setTelegramSaved(true);
    setTimeout(() => setTelegramSaved(false), 2000);
    toast({ title: lang === "ar" ? "تم حفظ رابط التيليغرام ✓" : "Telegram link saved ✓" });
  };

  const catLabel = (val: string) => {
    const cat = CATEGORIES.find(c => c.value === val);
    return cat ? (lang === "ar" ? cat.labelAr : cat.labelEn) : val;
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <img src="/logo.jpg" alt="نُور AI" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.adminNoor}</h1>
            <p className="text-muted-foreground mt-1">
              {lang === "ar" ? "لوحة تحكم المالك - إدارة المنصة" : "Owner Control Panel - Platform Management"}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : (
            <>
              <Card><CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"><CardTitle className="text-sm font-medium text-muted-foreground">{t.totalUsers}</CardTitle><Users className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-3xl font-bold">{stats?.totalUsers || 0}</div></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"><CardTitle className="text-sm font-medium text-muted-foreground">{t.subscribers}</CardTitle><CreditCard className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-3xl font-bold">{stats?.totalSubscribers || 0}</div></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"><CardTitle className="text-sm font-medium text-muted-foreground">{t.totalVideos}</CardTitle><PlayCircle className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-3xl font-bold">{stats?.totalVideos || 0}</div></CardContent></Card>
            </>
          )}
        </div>

        {/* User Management */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {lang === "ar" ? "إدارة المستخدمين" : "User Management"}
          </h2>
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className={`absolute ${lang === "ar" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    placeholder={lang === "ar" ? "ابحث باسم المستخدم أو البريد..." : "Search by name or email..."}
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className={lang === "ar" ? "pr-9" : "pl-9"}
                    onKeyDown={e => e.key === "Enter" && fetchUsers(userSearch)}
                  />
                </div>
                <Button onClick={() => fetchUsers(userSearch)} disabled={usersLoading}>
                  <Search className="h-4 w-4 me-2" />
                  {lang === "ar" ? "بحث" : "Search"}
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium text-start">{lang === "ar" ? "الاسم" : "Name"}</th>
                      <th className="px-4 py-3 font-medium text-start">{lang === "ar" ? "البريد" : "Email"}</th>
                      <th className="px-4 py-3 font-medium text-start">{lang === "ar" ? "الحالة" : "Status"}</th>
                      <th className="px-4 py-3 font-medium text-end">{lang === "ar" ? "تفعيل" : "Activate"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">{lang === "ar" ? "جارٍ التحميل..." : "Loading..."}</td></tr>
                    ) : users.length > 0 ? users.map(user => (
                      <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{user.email}</td>
                        <td className="px-4 py-3">
                          {user.subscribed ? (
                            <Badge className="bg-green-100 text-green-700 border-0 dark:bg-green-950/40 dark:text-green-400">
                              {lang === "ar" ? "مشترك" : "Subscribed"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{lang === "ar" ? "مجاني" : "Free"}</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-end">
                          {!user.subscribed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActivate(user.id)}
                              disabled={activatingId === user.id}
                            >
                              <UserCheck className="h-3.5 w-3.5 me-1.5" />
                              {activatingId === user.id
                                ? (lang === "ar" ? "..." : "...")
                                : (lang === "ar" ? "تفعيل" : "Activate")}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">{lang === "ar" ? "لا يوجد مستخدمون" : "No users found"}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Telegram Link */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            {lang === "ar" ? "رابط قناة التيليغرام" : "Telegram Channel Link"}
          </h2>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground mb-3">
                {lang === "ar"
                  ? "هذا الرابط سيظهر في موقع الطلاب للانضمام إلى مجموعة نُور AI على تيليغرام."
                  : "This link will appear on the platform for students to join the NOOR AI Telegram group."}
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="https://t.me/your_channel"
                  value={telegramLink}
                  onChange={e => setTelegramLink(e.target.value)}
                  dir="ltr"
                  className="font-mono"
                />
                <Button onClick={handleSaveTelegram}>
                  {telegramSaved ? <CheckCircle2 className="h-4 w-4 me-2" /> : <Settings className="h-4 w-4 me-2" />}
                  {lang === "ar" ? "حفظ" : "Save"}
                </Button>
              </div>
              {telegramLink && (
                <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-2 inline-block">
                  {lang === "ar" ? "معاينة الرابط ←" : "Preview link →"}
                </a>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Settings */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {lang === "ar" ? "إعدادات الدفع" : "Payment Settings"}
          </h2>
          <Card>
            <CardContent className="pt-5 space-y-5">
              {settingsStatus?.isLemonSqueezyConfigured && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {lang === "ar" ? "Lemon Squeezy مُفعَّل — الدفع بالبطاقة يعمل" : "Lemon Squeezy configured — Card payments active"}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3">
                  {lang === "ar" ? "🍋 Lemon Squeezy — بطاقة ائتمان" : "🍋 Lemon Squeezy — Credit Card"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">API Key</label>
                    <Input
                      type="password"
                      placeholder={lang === "ar" ? "أدخل مفتاح API (يبدأ بـ eyJ...)" : "Enter API Key (starts with eyJ...)"}
                      value={lsApiKey}
                      onChange={e => setLsApiKey(e.target.value)}
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Webhook Secret</label>
                    <Input
                      type="password"
                      placeholder={lang === "ar" ? "Webhook Secret (اختياري)" : "Webhook Secret (optional)"}
                      value={lsWebhookSecret}
                      onChange={e => setLsWebhookSecret(e.target.value)}
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Store ID</label>
                    <Input
                      placeholder={lang === "ar" ? "رقم متجرك في Lemon Squeezy" : "Your Lemon Squeezy Store ID"}
                      value={lsStoreId}
                      onChange={e => setLsStoreId(e.target.value)}
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Variant ID (Product)</label>
                    <Input
                      placeholder={lang === "ar" ? "رقم المنتج / الـ Variant" : "Product Variant ID"}
                      value={lsVariantId}
                      onChange={e => setLsVariantId(e.target.value)}
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-muted-foreground mb-3">
                  {lang === "ar" ? "₮ NOWPayments — USDT TRC20" : "₮ NOWPayments — USDT TRC20"}
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {lang === "ar" ? "عنوان محفظة TRC20 (يبدأ بـ T)" : "TRC20 Wallet Address (starts with T)"}
                  </label>
                  <Input
                    placeholder="TXxx...xxxx (Tron TRC20 address)"
                    value={trc20Wallet}
                    onChange={e => setTrc20Wallet(e.target.value)}
                    dir="ltr"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handleSavePaymentSettings} disabled={settingsSaving}>
                  {settingsSaving ? (
                    <>{lang === "ar" ? "جارٍ الحفظ..." : "Saving..."}</>
                  ) : settingsSaved ? (
                    <><CheckCircle2 className="h-4 w-4 me-2" />{lang === "ar" ? "تم الحفظ ✓" : "Saved ✓"}</>
                  ) : (
                    <><Settings className="h-4 w-4 me-2" />{lang === "ar" ? "حفظ الإعدادات" : "Save Settings"}</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {lang === "ar" ? "تُحفظ مباشرة على الخادم وتعمل فوراً." : "Saved to server and applied immediately."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Video Management */}
        <div>
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              {t.videoManagement}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowBulk(v => !v); setShowForm(false); }}>
                <Upload className="h-4 w-4 me-2" />
                {lang === "ar" ? "رفع مجمّع" : "Bulk Upload"}
              </Button>
              <Button onClick={() => { setShowForm(v => !v); setShowBulk(false); }}>
                <Plus className="h-4 w-4 me-2" />
                {t.addVideo}
              </Button>
            </div>
          </div>

          {/* Single Add Form */}
          {showForm && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <form onSubmit={handleAddVideo} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t.videoTitle} *</label>
                      <Input required placeholder={lang === "ar" ? "مثال: مقدمة في الجبر" : "e.g. Introduction to Algebra"} value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t.category} *</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue placeholder={t.allCategories} /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>{lang === "ar" ? c.labelAr : c.labelEn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><Link2 className="h-4 w-4" />{t.youtubeUrl} *</label>
                    <Input required placeholder="https://www.youtube.com/watch?v=... أو youtu.be/..." value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} dir="ltr" className="font-mono text-sm" />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={createVideoMutation.isPending}>{createVideoMutation.isPending ? t.saving : t.save}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Bulk Upload */}
          {showBulk && (
            <Card className="mb-6 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Upload className="h-5 w-5 text-primary" />{lang === "ar" ? "رفع مجمّع للفيديوهات" : "Bulk Video Upload"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground border">
                  {lang === "ar" ? (
                    <><p className="font-medium mb-1">كيفية الاستخدام:</p><p>• رابط يوتيوب في كل سطر</p><p>• عنوان اختياري بعد "|" — مثال: <code className="text-primary">https://youtu.be/abc | اسم الفيديو</code></p></>
                  ) : (
                    <><p className="font-medium mb-1">How to use:</p><p>• One YouTube URL per line</p><p>• Optional title after "|" — e.g. <code className="text-primary">https://youtu.be/abc | Video Title</code></p></>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Textarea placeholder={"https://youtu.be/abc123\nhttps://www.youtube.com/watch?v=xyz456 | Title\n..."} value={bulkUrls} onChange={e => setBulkUrls(e.target.value)} className="min-h-[160px] font-mono text-sm resize-y" dir="ltr" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium block mb-2">{t.category}</label>
                      <Select value={bulkCategory} onValueChange={setBulkCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => (<SelectItem key={c.value} value={c.value}>{lang === "ar" ? c.labelAr : c.labelEn}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {bulkUrls.split("\n").filter(l => l.trim()).length} {lang === "ar" ? "فيديو جاهز" : "videos ready"}
                    </div>
                    <Button className="w-full" onClick={handleBulkUpload} disabled={isBulkLoading || bulkUrls.trim() === ""}>
                      {isBulkLoading ? (lang === "ar" ? "جارٍ الرفع..." : "Uploading...") : (lang === "ar" ? "رفع الكل" : "Upload All")}
                    </Button>
                  </div>
                </div>
                {bulkStatuses.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {bulkStatuses.map((s, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded-md ${s.status === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : s.status === "error" ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
                        {s.status === "success" ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> : s.status === "error" ? <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> : <div className="h-3.5 w-3.5 rounded-full border border-current animate-pulse flex-shrink-0" />}
                        <span className="truncate font-mono">{s.url.slice(0, 50)}</span>
                        {s.message && <span className="ms-auto flex-shrink-0">{s.message}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Video Table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium text-start">{t.videoTitle}</th>
                    <th className="px-4 py-3 font-medium text-start">{t.category}</th>
                    <th className="px-4 py-3 font-medium text-start">YouTube ID</th>
                    <th className="px-4 py-3 font-medium text-end">{lang === "ar" ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {videosLoading ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center"><Skeleton className="h-8 w-full max-w-md mx-auto" /></td></tr>
                  ) : videos && videos.length > 0 ? videos.map(video => (
                    <tr key={video.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium max-w-[200px] truncate">{video.title}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-primary bg-primary/10 border-0">{catLabel(video.subject)}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        <a href={`https://youtu.be/${video.youtubeId}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">{video.youtubeId}</a>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(video.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">{lang === "ar" ? "لا توجد فيديوهات بعد. أضف أول فيديو!" : "No videos yet. Add your first video!"}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
