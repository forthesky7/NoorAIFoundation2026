import { useEffect, useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetVideo, getGetVideoQueryKey,
  useGetVideoCheckpoints, getGetVideoCheckpointsQueryKey,
  useSendChatMessage,
  useRecordProgress
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Brain, Play, CheckCircle2, Send, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function PaywallBanner({ lang }: { lang: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Lock className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-2">
        {lang === "ar" ? "ميزة مميزة" : "Premium Feature"}
      </h3>
      <p className="text-muted-foreground text-sm mb-4 max-w-xs">
        {lang === "ar"
          ? "معلم الذكاء الاصطناعي نُور متاح فقط للمشتركين. اشترك بـ 5$ فقط شهرياً لفتح هذه الميزة."
          : "Noor AI Tutor is available for subscribers only. Subscribe for just $5/month to unlock."}
      </p>
      <Button asChild>
        <Link href="/subscribe">
          {lang === "ar" ? "اشترك الآن" : "Subscribe Now"}
        </Link>
      </Button>
    </div>
  );
}

export default function VideoPlayer() {
  const [, params] = useRoute("/videos/:id");
  const videoId = parseInt(params?.id || "0");
  const { toast } = useToast();
  const { user } = useAuth();
  const { lang } = useLang();

  const isSubscribed = user?.subscribed || user?.role === "admin";

  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const [currentCheckpoint, setCurrentCheckpoint] = useState<any>(null);
  const [showCheckpointDialog, setShowCheckpointDialog] = useState(false);
  const [passedCheckpoints, setPassedCheckpoints] = useState<number[]>([]);

  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [isUnderstanding, setIsUnderstanding] = useState(false);

  const { data: video, isLoading: videoLoading } = useGetVideo(videoId, {
    query: { enabled: !!videoId, queryKey: getGetVideoQueryKey(videoId) }
  });

  const { data: checkpoints } = useGetVideoCheckpoints(videoId, {
    query: { enabled: !!videoId, queryKey: getGetVideoCheckpointsQueryKey(videoId) }
  });

  const sendMessageMutation = useSendChatMessage();
  const recordProgressMutation = useRecordProgress();

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => {
        setPlayerReady(true);
      };
    } else {
      setPlayerReady(true);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (playerReady && video?.youtubeId && !playerRef.current) {
      playerRef.current = new window.YT.Player(`youtube-player-${videoId}`, {
        height: '100%',
        width: '100%',
        videoId: video.youtubeId,
        playerVars: { 'playsinline': 1, 'rel': 0, 'modestbranding': 1 },
        events: { 'onStateChange': onPlayerStateChange }
      });
    }
  }, [playerReady, video]);

  const onPlayerStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      if (!timerRef.current) {
        timerRef.current = setInterval(checkTime, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (event.data === window.YT.PlayerState.ENDED) {
        recordProgressMutation.mutate({
          data: { videoId, watchedSeconds: Math.floor(video?.duration || 0), completed: true }
        });
      }
    }
  };

  const checkTime = () => {
    if (!playerRef.current || !checkpoints || !playerRef.current.getCurrentTime) return;
    const currentTime = playerRef.current.getCurrentTime();

    if (Math.floor(currentTime) % 30 === 0 && Math.floor(currentTime) > 0) {
      recordProgressMutation.mutate({ data: { videoId, watchedSeconds: Math.floor(currentTime) } });
    }

    if (!isSubscribed) return;

    const upcomingCheckpoint = checkpoints.find(cp =>
      !passedCheckpoints.includes(cp.id) &&
      Math.abs(currentTime - cp.timestampSeconds) < 1.5
    );

    if (upcomingCheckpoint && !showCheckpointDialog) {
      playerRef.current.pauseVideo();
      setCurrentCheckpoint(upcomingCheckpoint);
      setShowCheckpointDialog(true);
      setChatHistory([
        {
          role: "assistant",
          content: lang === "ar"
            ? `**نقطة تحقق.** دعنا نتأكد من فهمك.\n\n${upcomingCheckpoint.question}`
            : `**Checkpoint Reached.** Let's pause to check understanding.\n\n${upcomingCheckpoint.question}`
        }
      ]);
      setIsUnderstanding(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !currentCheckpoint) return;
    const userMsg = chatMessage;
    setChatMessage("");
    const updatedHistory = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(updatedHistory);

    sendMessageMutation.mutate({
      data: { message: userMsg, videoId, checkpointId: currentCheckpoint.id, history: updatedHistory }
    }, {
      onSuccess: (res) => {
        setChatHistory([...updatedHistory, { role: "assistant", content: res.reply }]);
        if (res.understood) {
          setIsUnderstanding(true);
          toast({
            title: lang === "ar" ? "ممتاز!" : "Great job!",
            description: lang === "ar" ? "أثبتت فهمك. يمكنك متابعة الفيديو." : "You've demonstrated understanding.",
          });
        }
      },
      onError: () => {
        setChatHistory([...updatedHistory, {
          role: "assistant",
          content: lang === "ar" ? "عذراً، لم أستطع معالجة ذلك. هل يمكنك إعادة الصياغة؟" : "I'm sorry, I couldn't process that. Can you try rephrasing?"
        }]);
      }
    });
  };

  const handleResume = () => {
    if (currentCheckpoint) {
      setPassedCheckpoints([...passedCheckpoints, currentCheckpoint.id]);
    }
    setShowCheckpointDialog(false);
    setCurrentCheckpoint(null);
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  };

  if (videoLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="w-full aspect-video rounded-xl mb-8" />
          <Skeleton className="h-10 w-2/3 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </AppLayout>
    );
  }

  if (!video) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">{lang === "ar" ? "الفيديو غير موجود" : "Video not found"}</h1>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="w-full bg-black rounded-xl overflow-hidden shadow-lg border relative aspect-video">
              <div id={`youtube-player-${videoId}`} className="w-full h-full border-0"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 pointer-events-none">
                {checkpoints?.map(cp => (
                  <div
                    key={cp.id}
                    className={cn(
                      "absolute top-0 h-full w-1 -ml-0.5",
                      passedCheckpoints.includes(cp.id) ? "bg-green-500" : "bg-primary"
                    )}
                    style={{ left: `${(cp.timestampSeconds / video.duration) * 100}%` }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {video.subject}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{video.title}</h1>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                <p>{video.description}</p>
              </div>
            </div>

            {/* AI Tutor section below video - paywall for non-subscribers */}
            {!isSubscribed && (
              <PaywallBanner lang={lang} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {lang === "ar" ? "نقاط التحقق" : "Lesson Checkpoints"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isSubscribed ? (
                  <div className="text-center py-4">
                    <Lock className="h-8 w-8 text-primary/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {lang === "ar" ? "مخصص للمشتركين فقط" : "Subscribers only"}
                    </p>
                    <Button size="sm" variant="outline" asChild className="mt-3">
                      <Link href="/subscribe">{lang === "ar" ? "اشترك" : "Subscribe"}</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {checkpoints?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {lang === "ar" ? "لا توجد نقاط تحقق لهذا الدرس." : "No checkpoints set for this lesson."}
                      </p>
                    ) : (
                      checkpoints?.sort((a, b) => a.timestampSeconds - b.timestampSeconds).map((cp, idx) => {
                        const isPassed = passedCheckpoints.includes(cp.id);
                        return (
                          <div key={cp.id} className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border",
                            isPassed ? "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900" : "bg-card"
                          )}>
                            <div className={cn(
                              "mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
                              isPassed ? "bg-green-500 text-white" : "bg-primary/10 text-primary"
                            )}>
                              {isPassed ? "✓" : idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-1">
                                {Math.floor(cp.timestampSeconds / 60)}:{(cp.timestampSeconds % 60).toString().padStart(2, '0')}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{cp.question}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Interactive AI Tutor Dialog — subscribers only */}
      {isSubscribed && (
        <Dialog open={showCheckpointDialog} onOpenChange={(open) => !open && handleResume()}>
          <DialogContent className="sm:max-w-[500px] h-[80vh] sm:h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b bg-card">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Brain className="h-6 w-6 text-primary" />
                {lang === "ar" ? "نقطة تحقق - نُور AI" : "Tutor Checkpoint"}
              </DialogTitle>
              <DialogDescription>
                {lang === "ar"
                  ? "توقف الفيديو. دعنا نتأكد من فهمك قبل المتابعة."
                  : "Video paused. Let's make sure you understand the concept before moving on."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/20">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto rounded-tr-sm"
                      : "bg-card border shadow-sm text-card-foreground mr-auto rounded-tl-sm whitespace-pre-wrap"
                  )}
                >
                  {msg.content}
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="bg-card border shadow-sm text-card-foreground mr-auto rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] text-sm flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>●</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-card">
              {isUnderstanding ? (
                <Button onClick={handleResume} className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white">
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  {lang === "ar" ? "متابعة الفيديو" : "Resume Video"}
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={lang === "ar" ? "اكتب إجابتك هنا..." : "Type your answer here..."}
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      className="h-auto aspect-square p-0 shrink-0"
                      onClick={handleSendMessage}
                      disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center mt-2 px-1">
                    <span className="text-xs text-muted-foreground">
                      {lang === "ar" ? "اضغط Enter للإرسال" : "Press Enter to send"}
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleResume} className="text-xs h-7 text-muted-foreground hover:text-foreground">
                      {lang === "ar" ? "تخطي الآن" : "Skip for now"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
