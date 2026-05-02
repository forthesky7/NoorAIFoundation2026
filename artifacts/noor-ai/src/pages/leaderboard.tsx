import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Star, Flame, TrendingUp, Users } from "lucide-react";
import { useLang } from "@/lib/language";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

type LeaderEntry = {
  rank: number;
  userId: number;
  name: string;
  completedVideos: number;
  totalMinutes: number;
};

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-slate-400" />;
  if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
  return (
    <span className="h-6 w-6 flex items-center justify-center text-sm font-bold text-muted-foreground">
      {rank}
    </span>
  );
}

function rankBadge(completedVideos: number, lang: string): { label: string; color: string } {
  const isAr = lang === "ar";
  if (completedVideos >= 20) return { label: isAr ? "🏆 خبير" : "🏆 Expert", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" };
  if (completedVideos >= 10) return { label: isAr ? "🔥 مفكر" : "🔥 Thinker", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" };
  if (completedVideos >= 5) return { label: isAr ? "⭐ متحمس" : "⭐ Enthusiast", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" };
  return { label: isAr ? "📚 مجتهد" : "📚 Diligent", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
}

export default function Leaderboard() {
  const { lang } = useLang();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/leaderboard").then(async r => {
      if (r.ok) setEntries(await r.json());
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-yellow-200 dark:border-yellow-800">
            <Flame className="h-4 w-4" />
            {isAr ? "تحدي الأسبوع" : "Weekly Challenge"}
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            {isAr ? "لوحة المتصدرين" : "Leaderboard"}
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {isAr
              ? "أكثر الطلاب نشاطاً في إتمام الدروس والتحديات السقراطية"
              : "Most active students in completing lessons and Socratic challenges"}
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-primary/10 rounded-full p-2.5 shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{entries.length}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "طالب نشط" : "Active students"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2.5 shrink-0">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {entries.reduce((s, e) => s + e.completedVideos, 0)}
                </p>
                <p className="text-xs text-muted-foreground">{isAr ? "درس مكتمل" : "Lessons completed"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {isAr ? "المتصدرون" : "Top Students"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{isAr ? "لا يوجد طلاب بعد" : "No students yet"}</p>
                <p className="text-sm mt-1">{isAr ? "أتمم أول درس لتظهر هنا!" : "Complete your first lesson to appear here!"}</p>
              </div>
            ) : (
              <div className="divide-y">
                {entries.map((entry) => {
                  const badge = rankBadge(entry.completedVideos, lang);
                  const isMe = user && entry.userId === (user as any).id;
                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-4 px-5 py-4 transition-colors ${isMe ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"} ${entry.rank <= 3 ? "bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-950/10" : ""}`}
                    >
                      <div className="w-8 flex items-center justify-center shrink-0">
                        <RankIcon rank={entry.rank} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">
                            {entry.name}
                            {isMe && <span className="ms-1 text-primary text-xs">{isAr ? "(أنت)" : "(You)"}</span>}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isAr
                            ? `${entry.completedVideos} درس مكتمل · ${entry.totalMinutes} دقيقة تعلم`
                            : `${entry.completedVideos} lessons · ${entry.totalMinutes} min learned`}
                        </p>
                      </div>
                      <div className="text-end shrink-0">
                        <p className="text-xl font-bold text-primary">{entry.completedVideos}</p>
                        <p className="text-xs text-muted-foreground">{isAr ? "درس" : "lessons"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {isAr
            ? "تتحدث الأرقام بنفسها — كل درس تتمه يقربك من القمة 🚀"
            : "Numbers speak for themselves — every lesson brings you closer to the top 🚀"}
        </p>
      </div>
    </AppLayout>
  );
}
