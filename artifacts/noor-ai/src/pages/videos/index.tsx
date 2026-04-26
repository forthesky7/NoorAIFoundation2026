import { useListVideos, getListVideosQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlayCircle, Search, FilterX, Lock, Send, CheckCircle2, MessageSquareDot } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useLang, DEFAULT_CATEGORIES, getCategoryLabel } from "@/lib/language";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api";
import { sortVideos, fuzzyMatch } from "@/lib/videoSort";

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "--:--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SCROLL_KEY = "noor_library_scroll";

export default function Videos() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const isSubscribed = user?.subscribed || user?.role === "admin";
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const [suggestionText, setSuggestionText] = useState("");
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);
  const [submittedTrack, setSubmittedTrack] = useState("");

  const { data: videos, isLoading } = useListVideos(
    {},
    { query: { queryKey: getListVideosQueryKey() } }
  );

  // Restore scroll position when returning from video player
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      const y = parseInt(saved, 10);
      if (!isNaN(y)) {
        requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" }));
      }
      sessionStorage.removeItem(SCROLL_KEY);
    }
  }, []);

  const saveScrollPosition = () => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
  };

  const sorted = videos ? sortVideos(videos) : [];

  const filtered = sorted.filter(v => {
    const target = `${v.title} ${v.description || ""} ${v.subject}`;
    return (
      (!search || fuzzyMatch(search, target)) &&
      (category === "all" || v.subject === category)
    );
  });

  const clearFilters = () => { setSearch(""); setCategory("all"); };
  const hasFilters = !!search || category !== "all";

  const handleSuggestion = async () => {
    if (!suggestionText.trim()) return;
    const text = suggestionText.trim();
    setSubmittedTrack(text);
    setSuggestionText("");
    setSuggestionSubmitted(true);
    setTimeout(() => setSuggestionSubmitted(false), 10000);
    try {
      await apiClient.post("/requests", { text, email: user?.email || "" });
    } catch {
      const stored = JSON.parse(localStorage.getItem("noor_suggestions") || "[]");
      stored.push({ text, date: new Date().toISOString() });
      localStorage.setItem("noor_suggestions", JSON.stringify(stored));
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.videoLibrary}</h1>
            <p className="text-muted-foreground mt-2">{t.videoLibraryDesc}</p>
          </div>
          {!isSubscribed && (
            <Button asChild>
              <Link href="/subscribe">
                {lang === "ar" ? "🔓 فعّل الاشتراك للتشغيل" : "🔓 Subscribe to Play"}
              </Link>
            </Button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-card border rounded-xl p-4 mb-8 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className={`absolute ${lang === "ar" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
            <Input
              placeholder={t.searchLessons}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={lang === "ar" ? "pr-9 text-right" : "pl-9"}
            />
          </div>
          <div className="flex w-full md:w-auto gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-52">
                <SelectValue placeholder={t.allCategories} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allCategories}</SelectItem>
                {DEFAULT_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    {lang === "ar" ? c.labelAr : c.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title={t.clearFilters}>
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Videos Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="w-full aspect-video rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(video =>
              isSubscribed ? (
                <div key={video.id} onClick={saveScrollPosition}>
                  <Link href={`/videos/${video.id}`}>
                    <Card className="overflow-hidden flex flex-col hover-elevate transition-all border-border/50 group cursor-pointer hover:border-primary/40 hover:shadow-md h-full">
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground">
                            <PlayCircle className="h-10 w-10 opacity-50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <PlayCircle className="h-16 w-16 text-white drop-shadow-lg" />
                        </div>
                        <div className="absolute bottom-2 end-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                          {formatDuration(video.duration)}
                        </div>
                      </div>
                      <CardContent className="p-5 flex-1 flex flex-col gap-2">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md self-start">
                          {getCategoryLabel(video.subject, lang)}
                        </span>
                        <h3 className="font-semibold text-base line-clamp-2 flex-1">{video.title}</h3>
                        {video.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                        )}
                        {/* "Ask Noor" styled frame */}
                        <div className="mt-auto border border-primary/25 bg-primary/5 rounded-lg px-3 py-2 flex items-center gap-2 text-primary text-xs font-medium">
                          <MessageSquareDot className="h-3.5 w-3.5 shrink-0" />
                          <span>{lang === "ar" ? "اسأل مساعد الأستاذ الذكي" : "Ask the AI Smart Assistant"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ) : (
                <div key={video.id} onClick={saveScrollPosition}>
                  <Link href="/subscribe">
                    <Card className="overflow-hidden flex flex-col transition-all border-border/50 group cursor-pointer hover:border-primary/60 hover:shadow-md h-full">
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground">
                            <PlayCircle className="h-10 w-10 opacity-30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10 flex flex-col items-center justify-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                            <Lock className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-white text-xs font-semibold bg-primary/80 px-3 py-1 rounded-full">
                            {lang === "ar" ? "اشترك للتشغيل" : "Subscribe to Play"}
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-5 flex-1 flex flex-col gap-2">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md self-start">
                          {getCategoryLabel(video.subject, lang)}
                        </span>
                        <h3 className="font-semibold text-base line-clamp-2 text-muted-foreground flex-1">{video.title}</h3>
                        <div className="mt-auto w-full h-9 bg-primary rounded-lg flex items-center justify-center gap-2 text-primary-foreground text-xs font-semibold group-hover:bg-primary/90 transition-colors">
                          {lang === "ar" ? "فعّل الاشتراك — 5$/شهر" : "Unlock Premium — $5/mo"}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="text-center py-24 bg-card rounded-2xl border border-dashed">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t.noVideos}</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t.noVideosDesc}</p>
            <Button onClick={clearFilters} variant="outline">{t.clearFilters}</Button>
          </div>
        )}

        {/* Lesson Request Form */}
        <div className="mt-16 border rounded-2xl p-8 bg-card shadow-sm">
          <h2 className="text-xl font-bold mb-2">
            {lang === "ar" ? "📬 طلب معلم أو درس" : "📬 Request a Teacher or Lesson"}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {lang === "ar"
              ? "لم تجد ما تبحث عنه؟ أخبرنا باسم المادة أو المسار وسيعمل فريق نُور على توفيره."
              : "Can't find what you're looking for? Tell us the subject or track and the NOOR team will work on providing it."}
          </p>
          {suggestionSubmitted ? (
            <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 dark:text-green-300">
                {`تم تسجيل طلبك لـ "${submittedTrack}" بنجاح. فريق نُور يعمل على توفير المصادر وسيُخطَر عند توفره.`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <Textarea
                placeholder={lang === "ar" ? "مثال: أحتاج دروس قدرات - الاستنتاج اللفظي..." : "e.g. I need lessons on Qudurat - Verbal Reasoning..."}
                value={suggestionText}
                onChange={e => setSuggestionText(e.target.value)}
                className="min-h-[80px] resize-none flex-1"
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSuggestion())}
              />
              <Button className="sm:self-end" onClick={handleSuggestion} disabled={!suggestionText.trim()}>
                <Send className="h-4 w-4 me-2" />
                {lang === "ar" ? "إرسال الطلب" : "Send Request"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
