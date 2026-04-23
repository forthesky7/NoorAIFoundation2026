import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, PlayCircle, Clock, Flame, Crown, Lock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLang, getCategoryLabel } from "@/lib/language";

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "--:--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const { data: summary, isLoading, error } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const firstName = user?.name?.split(" ")[0] || (lang === "ar" ? "الطالب" : "Student");

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t.dashboardWelcome}، {firstName}
            </h1>
            <p className="text-muted-foreground mt-1">
              {lang === "ar" ? "هنا ملخص تقدمك التعليمي." : "Here is your learning progress."}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : error ? (
          <div className="p-6 border border-destructive/20 bg-destructive/10 rounded-xl text-destructive">
            {lang === "ar" ? "فشل تحميل بيانات لوحة التحكم." : "Failed to load dashboard data."}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t.videosWatched}</CardTitle>
                  <PlayCircle className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalVideos || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">{summary?.completedVideos || 0} {t.completedFully}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t.timeLearned}</CardTitle>
                  <Clock className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.minutesLearned || 0} <span className="text-sm font-normal text-muted-foreground">{lang === "ar" ? "دقيقة" : "min"}</span></div>
                  <p className="text-xs text-muted-foreground mt-1">{t.totalStudyTime}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t.currentStreak}</CardTitle>
                  <Flame className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.streakDays || 0} <span className="text-sm font-normal text-muted-foreground">{t.days}</span></div>
                  <p className="text-xs text-muted-foreground mt-1">{t.keepItUp}</p>
                </CardContent>
              </Card>

              <Card className={summary?.subscribed ? "bg-primary/5 border-primary/20" : ""}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t.subscription}</CardTitle>
                  <Crown className={`h-4 w-4 ${summary?.subscribed ? "text-primary" : "text-muted-foreground"}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{summary?.subscribed ? t.active : t.freeTier}</div>
                  {!summary?.subscribed && (
                    <Button variant="link" className="h-auto p-0 text-xs mt-1 text-primary" asChild>
                      <Link href="/subscribe">{t.upgradePremium}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">{t.recentVideos}</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/videos">{t.viewLibrary}</Link>
                </Button>
              </div>

              {summary?.recentVideos && summary.recentVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {summary.recentVideos.map(video => {
                    const locked = !summary?.subscribed && user?.role !== "admin";
                    const href = locked ? "/subscribe" : `/videos/${video.id}`;
                    return (
                      <Link key={video.id} href={href}>
                        <Card className={`overflow-hidden flex flex-col transition-all border-border/50 cursor-pointer hover:shadow-md ${locked ? "hover:border-primary/50" : "hover-elevate hover:border-primary/30"}`}>
                          <div className="aspect-video bg-muted relative overflow-hidden">
                            {video.thumbnailUrl ? (
                              <img src={video.thumbnailUrl} alt={video.title} className={`w-full h-full object-cover transition-opacity ${locked ? "opacity-55" : "hover:scale-105 transition-transform duration-300"}`} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground">
                                <PlayCircle className="h-10 w-10 opacity-50" />
                              </div>
                            )}
                            {locked ? (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/30 to-transparent flex flex-col items-center justify-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                                  <Lock className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-white text-xs font-semibold bg-primary/80 px-2.5 py-0.5 rounded-full">
                                  {lang === "ar" ? "اشترك للتشغيل" : "Subscribe to Play"}
                                </span>
                              </div>
                            ) : (
                              <div className="absolute bottom-2 end-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                                {formatDuration(video.duration)}
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {getCategoryLabel(video.subject, lang)}
                              </span>
                            </div>
                            <h3 className={`font-semibold line-clamp-2 mb-2 ${locked ? "text-muted-foreground" : ""}`}>{video.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">{video.description}</p>
                          </CardContent>
                          <div className="p-4 pt-0 mt-auto">
                            {locked ? (
                              <div className="w-full h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-xs font-semibold">
                                {lang === "ar" ? "فعّل الاشتراك — 5$/شهر" : "Unlock Premium — $5/mo"}
                              </div>
                            ) : (
                              <Button className="w-full" variant="secondary">
                                {t.continueBtn}
                              </Button>
                            )}
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">{t.noVideosWatched}</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">{t.startJourney}</p>
                    <Button asChild>
                      <Link href="/videos">{t.exploreLibrary}</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
