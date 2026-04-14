import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, PlayCircle, Clock, Flame, Crown, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading, error } = useGetDashboardSummary({
    query: {
      queryKey: getGetDashboardSummaryQueryKey()
    }
  });

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name?.split(" ")[0] || "Student"}</h1>
            <p className="text-muted-foreground mt-1">Here is your learning progress.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-full border border-border">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Local Processing Active</span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : error ? (
          <div className="p-6 border border-destructive/20 bg-destructive/10 rounded-xl text-destructive">
            Failed to load dashboard data.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Videos Watched</CardTitle>
                  <PlayCircle className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalVideos || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">{summary?.completedVideos || 0} completed fully</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Time Learned</CardTitle>
                  <Clock className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.minutesLearned || 0} <span className="text-sm font-normal text-muted-foreground">min</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Total study time</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
                  <Flame className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.streakDays || 0} <span className="text-sm font-normal text-muted-foreground">days</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
                </CardContent>
              </Card>
              
              <Card className={summary?.subscribed ? "bg-primary/5 border-primary/20" : ""}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Subscription</CardTitle>
                  <Crown className={`h-4 w-4 ${summary?.subscribed ? "text-primary" : "text-muted-foreground"}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{summary?.subscribed ? "Active" : "Free Tier"}</div>
                  {!summary?.subscribed && (
                    <Button variant="link" className="h-auto p-0 text-xs mt-1 text-primary" asChild>
                      <Link href="/subscribe">Upgrade to Premium</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Recent Videos</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/videos">View Library</Link>
                </Button>
              </div>
              
              {summary?.recentVideos && summary.recentVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {summary.recentVideos.map(video => (
                    <Card key={video.id} className="overflow-hidden flex flex-col hover-elevate transition-all border-border/50">
                      <div className="aspect-video bg-muted relative">
                        {video.thumbnailUrl ? (
                          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground">
                            <PlayCircle className="h-10 w-10 opacity-50" />
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {video.subject}
                          </span>
                          <span className="text-xs text-muted-foreground">Grade {video.grade}</span>
                        </div>
                        <h3 className="font-semibold line-clamp-2 mb-2">{video.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">{video.description}</p>
                      </CardContent>
                      <div className="p-4 pt-0 mt-auto">
                        <Button className="w-full" variant="secondary" asChild>
                          <Link href={`/videos/${video.id}`}>Continue Watching</Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No videos watched yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Start your learning journey by exploring our video library. We'll track your progress here.
                    </p>
                    <Button asChild>
                      <Link href="/videos">Explore Library</Link>
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
