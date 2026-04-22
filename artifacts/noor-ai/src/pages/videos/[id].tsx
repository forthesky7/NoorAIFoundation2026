import { useEffect, useRef, useState } from "react";
import { useRoute, Link, useSearch } from "wouter";
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
import { Brain, Play, CheckCircle2, Send, Lock, MessageCircle, X, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type Message = { role: "user" | "assistant"; content: string };

function PaywallBanner({ lang }: { lang: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Lock className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-2">
        {lang === "ar" ? "ميزة حصرية للمشتركين" : "Subscribers Only"}
      </h3>
      <p className="text-muted-foreground text-sm mb-4 max-w-xs">
        {lang === "ar"
          ? "معلم الذكاء الاصطناعي نُور متاح فقط للمشتركين. اشترك بـ 5$ فقط شهرياً."
          : "Noor AI Tutor is available for subscribers only. Subscribe for just $5/month."}
      </p>
      <Button asChild>
        <Link href="/subscribe">
          {lang === "ar" ? "اشترك الآن" : "Subscribe Now"}
        </Link>
      </Button>
    </div>
  );
}

function NoorAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold shrink-0 shadow-sm"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      ن
    </div>
  );
}

export default function VideoPlayer() {
  const [, params] = useRoute("/videos/:id");
  const search = useSearch();
  const videoId = parseInt(params?.id || "0");
  const { toast } = useToast();
  const { user } = useAuth();
  const { lang } = useLang();

  const isSubscribed = user?.subscribed || user?.role === "admin";

  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const freeChatBottomRef = useRef<HTMLDivElement>(null);

  const [currentCheckpoint, setCurrentCheckpoint] = useState<any>(null);
  const [showCheckpointDialog, setShowCheckpointDialog] = useState(false);
  const [passedCheckpoints, setPassedCheckpoints] = useState<number[]>([]);

  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isUnderstanding, setIsUnderstanding] = useState(false);

  const [showChatSidebar, setShowChatSidebar] = useState(() => {
    return new URLSearchParams(search).get("chat") === "1";
  });
  const [freeChatMessage, setFreeChatMessage] = useState("");
  const [freeChatHistory, setFreeChatHistory] = useState<Message[]>([]);

  const { data: video, isLoading: videoLoading } = useGetVideo(videoId, {
    query: { enabled: !!videoId, queryKey: getGetVideoQueryKey(videoId) }
  });

  const { data: checkpoints } = useGetVideoCheckpoints(videoId, {
    query: { enabled: !!videoId, queryKey: getGetVideoCheckpointsQueryKey(videoId) }
  });

  const sendMessageMutation = useSendChatMessage();
  const freeChatMutation = useSendChatMessage();
  const recordProgressMutation = useRecordProgress();

  const duration = video?.duration || 300;

  const autoCheckpoints = [
    { id: -1, timestampSeconds: Math.floor(duration * 0.25), question: lang === "ar" ? "ما الفكرة الرئيسية التي فهمتها حتى الآن من هذا الدرس؟ اشرحها بكلماتك." : "What is the main idea you've understood so far? Explain in your own words." },
    { id: -2, timestampSeconds: Math.floor(duration * 0.5), question: lang === "ar" ? "كيف ترتبط المعلومات التي تعلمتها للتو بما شاهدته في بداية الدرس؟" : "How does what you just learned connect to what you saw at the beginning?" },
    { id: -3, timestampSeconds: Math.floor(duration * 0.75), question: lang === "ar" ? "ما السؤال الواحد الذي لا يزال يدور في ذهنك حول هذا الدرس؟" : "What is the one question still on your mind about this lesson?" },
  ];

  const activeCheckpoints = (checkpoints && checkpoints.length > 0) ? checkpoints : autoCheckpoints;

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.getElementsByTagName("script")[0]?.parentNode?.insertBefore(tag, document.getElementsByTagName("script")[0]);
      window.onYouTubeIframeAPIReady = () => setPlayerReady(true);
    } else {
      setPlayerReady(true);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (playerReady && video?.youtubeId && !playerRef.current) {
      playerRef.current = new window.YT.Player(`youtube-player-${videoId}`, {
        height: "100%",
        width: "100%",
        videoId: video.youtubeId,
        playerVars: {
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          showinfo: 0,
          fs: 1,
          cc_load_policy: 0,
          disablekb: 0,
          origin: window.location.origin,
        },
        events: { onStateChange: onPlayerStateChange },
      });
    }
  }, [playerReady, video]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    freeChatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [freeChatHistory]);

  useEffect(() => {
    if (showChatSidebar && freeChatHistory.length === 0) {
      setFreeChatHistory([{
        role: "assistant",
        content: lang === "ar"
          ? `مرحباً! أنا نُور 🌟 معلمك الذكي.\n\nأنا هنا لأساعدك على فهم درس "${video?.title || "هذا الدرس"}" بعمق.\n\n**ما الذي لفت انتباهك حتى الآن؟** أو اسألني أي سؤال يدور في ذهنك.`
          : `Hello! I'm Noor 🌟 your AI tutor.\n\nI'm here to help you deeply understand "${video?.title || "this lesson"}".\n\n**What caught your attention so far?** Or ask me anything on your mind.`,
      }]);
    }
  }, [showChatSidebar, video?.title]);

  const onPlayerStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      if (!timerRef.current) timerRef.current = setInterval(checkTime, 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (event.data === window.YT.PlayerState.ENDED) {
        recordProgressMutation.mutate({ data: { videoId, watchedSeconds: Math.floor(duration), completed: true } });
      }
    }
  };

  const checkTime = () => {
    if (!playerRef.current?.getCurrentTime) return;
    const currentTime = playerRef.current.getCurrentTime();

    if (Math.floor(currentTime) % 30 === 0 && Math.floor(currentTime) > 0) {
      recordProgressMutation.mutate({ data: { videoId, watchedSeconds: Math.floor(currentTime) } });
    }

    if (!isSubscribed) return;

    const upcomingCheckpoint = activeCheckpoints.find(cp =>
      !passedCheckpoints.includes(cp.id) &&
      Math.abs(currentTime - cp.timestampSeconds) < 1.5
    );

    if (upcomingCheckpoint && !showCheckpointDialog) {
      playerRef.current.pauseVideo();
      setCurrentCheckpoint(upcomingCheckpoint);
      setShowCheckpointDialog(true);
      setChatHistory([{
        role: "assistant",
        content: lang === "ar"
          ? `🔔 **توقفنا هنا للتحقق من فهمك.**\n\n${upcomingCheckpoint.question}`
          : `🔔 **Checkpoint!** Let's check your understanding.\n\n${upcomingCheckpoint.question}`
      }]);
      setIsUnderstanding(false);
    }
  };

  const handleSendCheckpointMessage = () => {
    if (!chatMessage.trim() || !currentCheckpoint) return;
    const userMsg = chatMessage;
    setChatMessage("");
    const updatedHistory = [...chatHistory, { role: "user" as const, content: userMsg }];
    setChatHistory(updatedHistory);

    sendMessageMutation.mutate(
      { data: { message: userMsg, videoId, checkpointId: currentCheckpoint.id > 0 ? currentCheckpoint.id : undefined, history: updatedHistory } },
      {
        onSuccess: (res) => {
          setChatHistory([...updatedHistory, { role: "assistant", content: res.reply }]);
          if (res.understood) {
            setIsUnderstanding(true);
            toast({ title: lang === "ar" ? "ممتاز! 🌟" : "Excellent! 🌟", description: lang === "ar" ? "أثبتت فهمك. يمكنك متابعة الفيديو." : "You've demonstrated understanding. Resume the video!" });
          }
        },
        onError: () => {
          setChatHistory([...updatedHistory, { role: "assistant", content: lang === "ar" ? "عذراً، حدث خطأ. أعد المحاولة." : "Sorry, an error occurred. Please try again." }]);
        }
      }
    );
  };

  const handleSendFreeMessage = () => {
    if (!freeChatMessage.trim()) return;
    const userMsg = freeChatMessage;
    setFreeChatMessage("");
    const updatedHistory = [...freeChatHistory, { role: "user" as const, content: userMsg }];
    setFreeChatHistory(updatedHistory);

    freeChatMutation.mutate(
      { data: { message: userMsg, videoId, history: updatedHistory } },
      {
        onSuccess: (res) => {
          setFreeChatHistory([...updatedHistory, { role: "assistant", content: res.reply }]);
        },
        onError: () => {
          setFreeChatHistory([...updatedHistory, { role: "assistant", content: lang === "ar" ? "عذراً، حدث خطأ." : "Sorry, an error occurred." }]);
        }
      }
    );
  };

  const handleResume = () => {
    if (currentCheckpoint) setPassedCheckpoints(prev => [...prev, currentCheckpoint.id]);
    setShowCheckpointDialog(false);
    setCurrentCheckpoint(null);
    playerRef.current?.playVideo();
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
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className={cn("grid gap-6 transition-all", showChatSidebar ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1 lg:grid-cols-3")}>

          {/* Main content */}
          <div className={cn("space-y-5", showChatSidebar ? "lg:col-span-3" : "lg:col-span-2")}>

            {/* YouTube Player with Security Overlay */}
            <div className="w-full bg-black rounded-xl overflow-hidden shadow-lg border relative aspect-video group">
              <div id={`youtube-player-${videoId}`} className="w-full h-full border-0" />

              {/* Security overlays — blocks YouTube branding links */}
              {/* Top bar: covers channel name + video title on hover */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-transparent z-10 pointer-events-none" aria-hidden="true" />
              {/* Top-right corner: covers YouTube logo (top-right on some embeds) */}
              <div className="absolute top-0 right-0 w-28 h-12 bg-black/0 z-10" aria-hidden="true" />
              {/* Bottom-right corner: covers "Watch on YouTube" button */}
              <div className="absolute bottom-8 right-0 w-32 h-10 bg-black z-10 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              {/* Bottom-left: covers YouTube logo watermark */}
              <div className="absolute bottom-8 left-0 w-20 h-10 bg-black z-10 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />

              {/* Checkpoint progress markers */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 pointer-events-none z-20">
                {activeCheckpoints.map(cp => (
                  <div
                    key={cp.id}
                    className={cn(
                      "absolute top-0 h-full w-1 -ml-0.5",
                      passedCheckpoints.includes(cp.id) ? "bg-green-400" : "bg-primary"
                    )}
                    style={{ left: `${(cp.timestampSeconds / duration) * 100}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Video info */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">{video.subject}</span>
                {isSubscribed && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    {activeCheckpoints.length} {lang === "ar" ? "نقاط تحقق ذكية" : "AI checkpoints"}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-3">{video.title}</h1>
              <p className="text-muted-foreground text-sm">{video.description}</p>
            </div>

            {/* Paywall banner for non-subscribers */}
            {!isSubscribed && <PaywallBanner lang={lang} />}

            {/* Chat with Noor button — subscribers only */}
            {isSubscribed && (
              <Button
                variant={showChatSidebar ? "default" : "outline"}
                className="w-full h-12 gap-3 font-medium"
                onClick={() => setShowChatSidebar(v => !v)}
              >
                <MessageCircle className="h-5 w-5 shrink-0" />
                <span>{lang === "ar" ? "ناقش الدرس مع نُور AI — المعلم الذكي" : "Discuss with NOOR AI — Smart Tutor"}</span>
                <ChevronRight className={cn("h-4 w-4 ms-auto transition-transform", showChatSidebar && "rotate-180")} />
              </Button>
            )}
          </div>

          {/* Right Sidebar — Checkpoints or Chat */}
          <div className={cn("space-y-4", showChatSidebar ? "lg:col-span-2" : "lg:col-span-1")}>

            {/* Persistent Chat Sidebar */}
            {showChatSidebar && isSubscribed ? (
              <Card className="flex flex-col h-[calc(100vh-160px)] min-h-[480px] border-primary/20">
                <CardHeader className="pb-3 border-b shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <NoorAvatar size={36} />
                      <div>
                        <CardTitle className="text-base">{lang === "ar" ? "نُور AI — معلمك الذكي" : "Noor AI — Smart Tutor"}</CardTitle>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          {lang === "ar" ? "متصل ومستعد" : "Online & ready"}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowChatSidebar(false)} className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                  {freeChatHistory.map((msg, i) => (
                    <div key={i} className={cn("flex gap-2 max-w-full", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                      {msg.role === "assistant" && <NoorAvatar size={28} />}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-card border shadow-sm text-card-foreground rounded-tl-sm"
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {freeChatMutation.isPending && (
                    <div className="flex gap-2">
                      <NoorAvatar size={28} />
                      <div className="bg-card border shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex gap-1">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                        <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>●</span>
                      </div>
                    </div>
                  )}
                  <div ref={freeChatBottomRef} />
                </div>

                <div className="p-3 border-t bg-card shrink-0">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={lang === "ar" ? "اسأل نُور أي سؤال عن الدرس..." : "Ask Noor anything about the lesson..."}
                      value={freeChatMessage}
                      onChange={e => setFreeChatMessage(e.target.value)}
                      className="min-h-[60px] max-h-[120px] resize-none text-sm"
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendFreeMessage(); } }}
                    />
                    <Button
                      className="h-auto aspect-square p-0 shrink-0 self-end"
                      size="sm"
                      onClick={handleSendFreeMessage}
                      disabled={!freeChatMessage.trim() || freeChatMutation.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 text-center">
                    {lang === "ar" ? "نُور يسألك بأسلوب سقراطي ويرشدك دون أن يعطيك الإجابة مباشرة" : "Noor guides you with questions — Socratic method"}
                  </p>
                </div>
              </Card>
            ) : (
              /* Checkpoints Panel */
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    {lang === "ar" ? "نقاط التحقق الذكية" : "Smart Checkpoints"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!isSubscribed ? (
                    <div className="text-center py-4">
                      <Lock className="h-8 w-8 text-primary/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">{lang === "ar" ? "مخصص للمشتركين فقط" : "Subscribers only"}</p>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/subscribe">{lang === "ar" ? "اشترك" : "Subscribe"}</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeCheckpoints.sort((a, b) => a.timestampSeconds - b.timestampSeconds).map((cp, idx) => {
                        const isPassed = passedCheckpoints.includes(cp.id);
                        return (
                          <div key={cp.id} className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                            isPassed ? "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900" : "bg-card"
                          )}>
                            <div className={cn(
                              "mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
                              isPassed ? "bg-green-500 text-white" : "bg-primary/10 text-primary"
                            )}>
                              {isPassed ? "✓" : idx + 1}
                            </div>
                            <div>
                              <p className="text-xs font-mono text-muted-foreground mb-1">
                                {Math.floor(cp.timestampSeconds / 60)}:{(cp.timestampSeconds % 60).toString().padStart(2, "0")}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{cp.question}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Interactive AI Checkpoint Dialog */}
      {isSubscribed && (
        <Dialog open={showCheckpointDialog} onOpenChange={open => !open && handleResume()}>
          <DialogContent className="sm:max-w-[520px] h-[82vh] sm:h-[620px] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-5 pb-4 border-b bg-gradient-to-r from-primary/5 to-background shrink-0">
              <div className="flex items-center gap-3">
                <NoorAvatar size={40} />
                <div>
                  <DialogTitle className="text-lg flex items-center gap-2">
                    {lang === "ar" ? "نقطة تحقق — نُور AI" : "Checkpoint — Noor AI"}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {lang === "ar"
                      ? "توقف الفيديو. أجب على سؤال نُور لتثبيت فهمك."
                      : "Video paused. Answer Noor's question to prove understanding."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/20">
              {chatHistory.map((msg, i) => (
                <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  {msg.role === "assistant" && <NoorAvatar size={28} />}
                  <div className={cn(
                    "rounded-2xl px-4 py-3 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border shadow-sm text-card-foreground rounded-tl-sm"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex gap-2">
                  <NoorAvatar size={28} />
                  <div className="bg-card border shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>●</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className="p-4 border-t bg-card shrink-0">
              {isUnderstanding ? (
                <Button onClick={handleResume} className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white gap-2">
                  <Play className="h-5 w-5 fill-current" />
                  {lang === "ar" ? "متابعة الفيديو ▶" : "Resume Video ▶"}
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={lang === "ar" ? "اكتب إجابتك هنا..." : "Type your answer here..."}
                      value={chatMessage}
                      onChange={e => setChatMessage(e.target.value)}
                      className="min-h-[64px] resize-none text-sm"
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendCheckpointMessage(); } }}
                      autoFocus
                    />
                    <Button
                      className="h-auto aspect-square p-0 shrink-0 self-end"
                      onClick={handleSendCheckpointMessage}
                      disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs text-muted-foreground">{lang === "ar" ? "Enter للإرسال" : "Enter to send"}</span>
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
