import { useState } from "react";
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
import { PlayCircle, Users, CreditCard, Plus, Trash2, Link2, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  { value: "Bac-Algeria", labelAr: "بكالوريا - الجزائر", labelEn: "Bac - Algeria" },
  { value: "General", labelAr: "عام", labelEn: "General" },
];

type BulkStatus = { url: string; status: "pending" | "success" | "error"; message?: string };

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

  const { data: stats, isLoading: statsLoading } = useGetAdminDashboard({
    query: { queryKey: getGetAdminDashboardQueryKey() },
  });

  const { data: videos, isLoading: videosLoading } = useListVideos(undefined, {
    query: { queryKey: getListVideosQueryKey() },
  });

  const createVideoMutation = useCreateVideo();
  const deleteVideoMutation = useDeleteVideo();

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const youtubeId = extractYouTubeId(youtubeUrl.trim());

    createVideoMutation.mutate(
      {
        data: {
          title,
          youtubeId,
          description: "",
          subject: category,
          grade: "General",
          duration: 300,
          thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVideosQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
          toast({ title: lang === "ar" ? "تم إضافة الفيديو بنجاح" : "Video added successfully" });
          setTitle("");
          setYoutubeUrl("");
          setCategory("General");
          setShowForm(false);
        },
        onError: () => {
          toast({ title: lang === "ar" ? "فشل الإضافة" : "Failed to add video", variant: "destructive" });
        },
      }
    );
  };

  const handleBulkUpload = async () => {
    const lines = bulkUrls
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 0);

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
            {
              data: {
                title: customTitle,
                youtubeId,
                description: "",
                subject: bulkCategory,
                grade: "General",
                duration: 300,
                thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
              },
            },
            {
              onSuccess: () => resolve(),
              onError: (e: any) => reject(e),
            }
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
    toast({
      title: lang === "ar"
        ? `تم رفع ${successCount} من ${lines.length} فيديو`
        : `Uploaded ${successCount} of ${lines.length} videos`,
    });
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

  const catLabel = (val: string) => {
    const cat = CATEGORIES.find(c => c.value === val);
    return cat ? (lang === "ar" ? cat.labelAr : cat.labelEn) : val;
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 flex items-center gap-4">
          <img src="/logo.jpg" alt="نُور AI" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.adminNoor}</h1>
            <p className="text-muted-foreground mt-1">
              {lang === "ar" ? "لوحة تحكم المالك - إدارة محتوى المنصة" : "Owner Control Panel - Platform Content Management"}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {statsLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t.totalUsers}</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t.subscribers}</CardTitle>
                  <CreditCard className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalSubscribers || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t.totalVideos}</CardTitle>
                  <PlayCircle className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalVideos || 0}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Video Management */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
            <h2 className="text-xl font-semibold">{t.videoManagement}</h2>
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
                      <Input
                        required
                        placeholder={lang === "ar" ? "مثال: مقدمة في الجبر" : "e.g. Introduction to Algebra"}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t.category} *</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder={t.allCategories} />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>
                              {lang === "ar" ? c.labelAr : c.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      {t.youtubeUrl} *
                    </label>
                    <Input
                      required
                      placeholder="https://www.youtube.com/watch?v=... أو youtu.be/..."
                      value={youtubeUrl}
                      onChange={e => setYoutubeUrl(e.target.value)}
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {lang === "ar"
                        ? "يقبل روابط يوتيوب الكاملة أو المختصرة أو معرف الفيديو مباشرة"
                        : "Accepts full YouTube URLs, short youtu.be links, or direct video IDs"}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={createVideoMutation.isPending}>
                      {createVideoMutation.isPending ? t.saving : t.save}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      {lang === "ar" ? "إلغاء" : "Cancel"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Bulk Upload Form */}
          {showBulk && (
            <Card className="mb-6 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  {lang === "ar" ? "رفع مجمّع للفيديوهات" : "Bulk Video Upload"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground border">
                  {lang === "ar" ? (
                    <>
                      <p className="font-medium mb-1">كيفية الاستخدام:</p>
                      <p>• أدرج رابط يوتيوب في كل سطر</p>
                      <p>• يمكن إضافة عنوان مخصص بعد "|" — مثال: <code className="text-primary">https://youtu.be/abc | اسم الفيديو</code></p>
                      <p>• بدون عنوان سيُستخدم معرف يوتيوب تلقائياً</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium mb-1">How to use:</p>
                      <p>• One YouTube URL per line</p>
                      <p>• Add custom title after "|" — e.g. <code className="text-primary">https://youtu.be/abc | Video Title</code></p>
                      <p>• Without title, YouTube ID will be used automatically</p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Textarea
                      placeholder={lang === "ar"
                        ? "https://youtu.be/abc123\nhttps://www.youtube.com/watch?v=xyz456 | عنوان الفيديو\n..."
                        : "https://youtu.be/abc123\nhttps://www.youtube.com/watch?v=xyz456 | Video Title\n..."}
                      value={bulkUrls}
                      onChange={e => setBulkUrls(e.target.value)}
                      className="min-h-[160px] font-mono text-sm resize-y"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium block mb-2">{t.category}</label>
                      <Select value={bulkCategory} onValueChange={setBulkCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>
                              {lang === "ar" ? c.labelAr : c.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {bulkUrls.split("\n").filter(l => l.trim()).length}{" "}
                      {lang === "ar" ? "فيديو جاهز للرفع" : "videos ready to upload"}
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleBulkUpload}
                      disabled={isBulkLoading || bulkUrls.trim() === ""}
                    >
                      {isBulkLoading
                        ? (lang === "ar" ? "جارٍ الرفع..." : "Uploading...")
                        : (lang === "ar" ? "رفع الكل" : "Upload All")}
                    </Button>
                  </div>
                </div>

                {/* Bulk status results */}
                {bulkStatuses.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {bulkStatuses.map((s, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded-md ${
                        s.status === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" :
                        s.status === "error" ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {s.status === "success" ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> :
                         s.status === "error" ? <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> :
                         <div className="h-3.5 w-3.5 rounded-full border border-current animate-pulse flex-shrink-0" />}
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
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center">
                        <Skeleton className="h-8 w-full max-w-md mx-auto" />
                      </td>
                    </tr>
                  ) : videos && videos.length > 0 ? (
                    videos.map(video => (
                      <tr key={video.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium max-w-[200px] truncate">{video.title}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-primary bg-primary/10 border-0">
                            {catLabel(video.subject)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          <a
                            href={`https://youtu.be/${video.youtubeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary hover:underline"
                          >
                            {video.youtubeId}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(video.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                        {lang === "ar" ? "لا توجد فيديوهات بعد. أضف أول فيديو!" : "No videos yet. Add your first video!"}
                      </td>
                    </tr>
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
