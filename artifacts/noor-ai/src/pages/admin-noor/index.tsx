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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayCircle, Users, CreditCard, Plus, Trash2, Link2 } from "lucide-react";

function extractYouTubeId(input: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return input;
}

const CATEGORIES = [
  "Testing", "Math", "Science", "History", "English",
  "Programming", "Physics", "Biology", "Chemistry",
  "Islamic Studies", "Arabic", "Geography", "Economics"
];

export default function AdminNoor() {
  const { t, lang } = useLang();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [category, setCategory] = useState("");
  const [showForm, setShowForm] = useState(false);

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
          setCategory("");
          setShowForm(false);
        },
        onError: () => {
          toast({ title: lang === "ar" ? "فشل الإضافة" : "Failed to add video", variant: "destructive" });
        },
      }
    );
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

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t.adminNoor}</h1>
          <p className="text-muted-foreground mt-1">
            {lang === "ar" ? "إدارة محتوى المنصة" : "Manage platform content"}
          </p>
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

        {/* Add Video Form */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{t.videoManagement}</h2>
            <Button onClick={() => setShowForm(v => !v)}>
              <Plus className="h-4 w-4 me-2" />
              {t.addVideo}
            </Button>
          </div>

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
                      <Select required value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder={t.allCategories} />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
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
                          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-md">
                            {video.subject}
                          </span>
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
