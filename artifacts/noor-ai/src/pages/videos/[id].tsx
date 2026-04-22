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
import { Textarea } from "@/components/ui/textarea";
import { Brain, Play, Send, Lock, MessageCircle, X, ChevronRight, AlertTriangle } from "lucide-react";
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
type CheckpointResult = "correct" | "skipped";

function NoorAvatar({ size = 36 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center text-white font-bold shrink-0 shadow-md ring-2 ring-primary/20"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      ن
    </div>
  );
}

function FullPaywall({ lang }: { lang: string }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 ring-4 ring-primary/10">
          <Lock className="h-9 w-9 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3">
          {lang === "ar" ? "محتوى حصري للمشتركين" : "Premium Content"}
        </h2>
        <p className="text-muted-foreground mb-2">
          {lang === "ar"
            ? "هذا الفيديو متاح فقط للأعضاء المشتركين في نُور AI."
            : "This video is available to NOOR AI Premium members only."}
        </p>
        <p className="text-muted-foreground text-sm mb-8">
          {lang === "ar"
            ? "اشترك الآن بـ 5$ شهرياً واحصل على وصول كامل لجميع الدروس والمعلم الذكي."
            : "Subscribe now for $5/month and get full access to all lessons and the AI tutor."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <Link href="/subscribe">{lang === "ar" ? "اشترك الآن — 5$/شهر" : "Subscribe Now — $5/mo"}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12">
            <Link href="/videos">{lang === "ar" ? "العودة للمكتبة" : "Back to Library"}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

const CHECKPOINT_SIMPLIFICATIONS: Record<number, { ar: string; en: string }> = {
  "-1": { ar: "ببساطة، المعلم يركز في هذا الجزء على الأسس الأولى للموضوع — اللبنات التي سيُبنى عليها كل شيء لاحقاً.", en: "Simply put, the teacher is focusing here on the foundational concepts — the building blocks for everything that follows." },
  "-2": { ar: "ببساطة، وصلنا منتصف الرحلة. الأفكار الجديدة تبني على ما تعلمته قبلاً، مثل طوابق بناء.", en: "Simply put, we've reached the halfway point. The new ideas are building on what you learned earlier, like floors of a building." },
  "-3": { ar: "ببساطة، نقترب من الخاتمة. هذا الجزء يربط كل الخيوط السابقة معاً ليكتمل الصورة الكاملة.", en: "Simply put, we're nearing the end. This section ties all previous threads together to complete the full picture." },
  "-4": { ar: "ببساطة، انتهى الدرس! الآن حان وقت تثبيت ما تعلمته قبل أن يتبخر من ذاكرتك.", en: "Simply put, the lesson is complete! Now it's time to consolidate what you've learned before it fades." },
};

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
  const [showCheckpointPopup, setShowCheckpointPopup] = useState(false);
  const [popupPhase, setPopupPhase] = useState<"simplify" | "question">("simplify");
  const [checkpointResults, setCheckpointResults] = useState<Record<number, CheckpointResult>>({});

  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isUnderstanding, setIsUnderstanding] = useState(false);

  const [showChatSidebar, setShowChatSidebar] = useState(() => new URLSearchParams(search).get("chat") === "1");
  const [freeChatMessage, setFreeChatMessage] = useState("");
  const [freeChatHistory, setFreeChatHistory] = useState<Message[]>([]);

  const { data: video, isLoading: videoLoading } = useGetVideo(videoId, {
    query: { enabled: !!videoId, queryKey: getGetVideoQueryKey(videoId) }
  });
  const { data: checkpoints } = useGetVideoCheckpoints(videoId, {
    query: { enabled: !!videoId && isSubscribed, queryKey: getGetVideoCheckpointsQueryKey(videoId) }
  });
  const sendMessageMutation = useSendChatMessage();
  const freeChatMutation = useSendChatMessage();
  const recordProgressMutation = useRecordProgress();

  const duration = video?.duration || 300;

  const autoCheckpoints = [
    { id: -1, timestampSeconds: Math.floor(duration * 0.25), question: lang === "ar" ? "ما الفكرة الرئيسية التي استوعبتها حتى الآن؟ اشرحها بكلماتك أنت." : "What is the main idea you've understood so far? Explain it in your own words." },
    { id: -2, timestampSeconds: Math.floor(duration * 0.50), question: lang === "ar" ? "كيف ترتبط هذه المعلومات الجديدة بما شاهدته في بداية الدرس؟" : "How does this new information connect to what you saw at the beginning?" },
    { id: -3, timestampSeconds: Math.floor(duration * 0.75), question: lang === "ar" ? "ما أبرز نقطة أثارت تفكيرك في هذا الجزء؟ لماذا؟" : "What key point made you think the most in this section? Why?" },
    { id: -4, timestampSeconds: Math.floor(duration * 0.95), question: lang === "ar" ? "ما أهم درس واحد تأخذه من هذا الفيديو كاملاً؟ كيف ستوظفه؟" : "What is the single most important lesson from this entire video? How will you use it?" },
  ];

  const activeCheckpoints = (checkpoints && checkpoints.length > 0) ? checkpoints : autoCheckpoints;

  const passedCheckpointIds = Object.keys(checkpointResults).map(Number);

  useEffect(() => {
    if (!isSubscribed) return;
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.getElementsByTagName("script")[0]?.parentNode?.insertBefore(tag, document.getElementsByTagName("script")[0]);
      window.onYouTubeIframeAPIReady = () => setPlayerReady(true);
    } else {
      setPlayerReady(true);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isSubscribed]);

  useEffect(() => {
    if (!isSubscribed || !playerReady || !video?.youtubeId || playerRef.current) return;
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
        origin: window.location.origin,
      },
      events: { onStateChange: onPlayerStateChange },
    });
  }, [playerReady, video, isSubscribed]);

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
          ? `مرحباً! أنا نُور 🌟 معلمك الذكي.\n\nأنا هنا لمساعدتك على فهم درس "${video?.title || "هذا الدرس"}" بعمق.\n\n**ما الذي لفت انتباهك حتى الآن؟** أو اسألني أي سؤال.`
          : `Hello! I'm Noor 🌟 your AI tutor.\n\nI'm here to help you deeply understand "${video?.title || "this lesson"}".\n\n**What caught your attention so far?** Or ask me anything.`,
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
        const endCp = autoCheckpoints[3];
        if (!checkpointResults[-4]) {
          triggerCheckpoint(endCp);
        }
      }
    }
  };

  const checkTime = () => {
    if (!playerRef.current?.getCurrentTime) return;
    const currentTime = playerRef.current.getCurrentTime();

    if (Math.floor(currentTime) % 30 === 0 && Math.floor(currentTime) > 0) {
      recordProgressMutation.mutate({ data: { videoId, watchedSeconds: Math.floor(currentTime) } });
    }

    const upcoming = activeCheckpoints.find(cp =>
      !checkpointResults[cp.id] &&
      Math.abs(currentTime - cp.timestampSeconds) < 1.5
    );

    if (upcoming && !showCheckpointPopup) {
      playerRef.current.pauseVideo();
      triggerCheckpoint(upcoming);
    }
  };

  const triggerCheckpoint = (cp: typeof autoCheckpoints[0]) => {
    setCurrentCheckpoint(cp);
    setPopupPhase("simplify");
    setShowCheckpointPopup(true);
    setChatHistory([]);
    setIsUnderstanding(false);
    setChatMessage("");
  };

  const handleProceedToQuestion = () => {
    setPopupPhase("question");
    setChatHistory([{
      role: "assistant",
      content: lang === "ar"
        ? `🔔 **سؤالك الآن:**\n\n${currentCheckpoint.question}`
        : `🔔 **Your question:**\n\n${currentCheckpoint.question}`
    }]);
  };

  const handleSendAnswer = () => {
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
            setCheckpointResults(prev => ({ ...prev, [currentCheckpoint.id]: "correct" }));
            toast({ title: lang === "ar" ? "ممتاز! 🌟" : "Excellent! 🌟", description: lang === "ar" ? "أثبتت فهمك. المؤشر أصبح أخضر!" : "You demonstrated understanding. Dot is now green!" });
          }
        },
        onError: () => {
          setChatHistory([...updatedHistory, { role: "assistant", content: lang === "ar" ? "عذراً، حدث خطأ. أعد المحاولة." : "Sorry, an error occurred." }]);
        }
      }
    );
  };

  const handleResumeAfterCorrect = () => {
    setShowCheckpointPopup(false);
    setCurrentCheckpoint(null);
    playerRef.current?.playVideo();
  };

  const handleSkip = () => {
    if (currentCheckpoint) {
      setCheckpointResults(prev => ({ ...prev, [currentCheckpoint.id]: "skipped" }));
    }
    setShowCheckpointPopup(false);
    setCurrentCheckpoint(null);
    playerRef.current?.playVideo();
    toast({
      title: lang === "ar" ? "⚠️ تذكر!" : "⚠️ Remember!",
      description: lang === "ar" ? "التعلم الحقيقي يأتي من المحاولة. سيتحول المؤشر رمادياً." : "Real learning comes from trying. The dot turned grey.",
    });
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
        onSuccess: (res) => setFreeChatHistory([...updatedHistory, { role: "assistant", content: res.reply }]),
        onError: () => setFreeChatHistory([...updatedHistory, { role: "assistant", content: lang === "ar" ? "عذراً، حدث خطأ." : "Sorry, an error occurred." }]),
      }
    );
  };

  if (videoLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Skeleton className="w-full aspect-video rounded-xl mb-6" />
          <Skeleton className="h-8 w-2/3 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
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

  if (!isSubscribed) {
    return (
      <AppLayout>
        <FullPaywall lang={lang} />
      </AppLayout>
    );
  }

  const cpSimplification = currentCheckpoint
    ? (CHECKPOINT_SIMPLIFICATIONS[currentCheckpoint.id]?.[lang === "ar" ? "ar" : "en"] || (lang === "ar" ? "ببساطة، دعنا نتوقف لحظة لنتأكد من فهمك." : "Simply put, let's pause for a moment to check your understanding."))
    : "";

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-5 max-w-6xl">
        <div className={cn("flex gap-5", showChatSidebar ? "flex-col lg:flex-row" : "flex-col")}>

          {/* Main column */}
          <div className={cn("space-y-4 min-w-0", showChatSidebar ? "lg:flex-1" : "w-full")}>

            {/* 16:9 Video Player */}
            <div className="relative w-full rounded-xl overflow-hidden shadow-xl border bg-black" style={{ aspectRatio: "16/9" }}>
              <div id={`youtube-player-${videoId}`} className="absolute inset-0 w-full h-full" />

              {/* Security: transparent click-blocking overlays on YouTube branding areas */}
              {/* Top-right: YouTube watermark logo */}
              <div className="absolute top-0 right-0 w-[88px] h-[48px] z-20 cursor-default" onClick={e => e.preventDefault()} />
              {/* Top bar hover title/channel (covers top strip) */}
              <div className="absolute top-0 left-0 right-0 h-[52px] z-20 cursor-default" style={{ pointerEvents: "none" }} />
              {/* Bottom-right: Watch on YouTube button + YouTube logo — rendered as black bar that blends with player bar */}
              <div
                className="absolute bottom-0 right-0 w-[180px] h-[42px] bg-black/90 z-20 cursor-default"
                onClick={e => e.preventDefault()}
              />

              {/* Progress dots on bottom edge */}
              <div className="absolute bottom-0 left-0 right-[180px] h-[3px] bg-white/15 z-30 pointer-events-none">
                {activeCheckpoints.map(cp => {
                  const result = checkpointResults[cp.id];
                  return (
                    <div
                      key={cp.id}
                      className={cn(
                        "absolute top-0 h-full w-[4px] -translate-x-1/2 rounded-full",
                        result === "correct" ? "bg-green-400 shadow-[0_0_6px_1px_rgba(74,222,128,0.8)]" :
                        result === "skipped" ? "bg-gray-400" : "bg-primary"
                      )}
                      style={{ left: `${(cp.timestampSeconds / duration) * 100}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Video meta */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">{video.subject}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  {lang === "ar" ? `${activeCheckpoints.length} محطات تفاعلية` : `${activeCheckpoints.length} interactive stops`}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold mb-2">{video.title}</h1>
              {video.description && <p className="text-muted-foreground text-sm">{video.description}</p>}
            </div>

            {/* Chat toggle button */}
            <Button
              variant={showChatSidebar ? "default" : "outline"}
              className="w-full h-11 gap-3 font-medium"
              onClick={() => setShowChatSidebar(v => !v)}
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span>{lang === "ar" ? "ناقش الدرس مع نُور AI — المعلم الذكي" : "Discuss with NOOR AI — Smart Tutor"}</span>
              <ChevronRight className={cn("h-4 w-4 ms-auto transition-transform", showChatSidebar && "rotate-180")} />
            </Button>

            {/* Noor Avatar Checkpoint Popup */}
            {showCheckpointPopup && currentCheckpoint && (
              <div className="rounded-2xl border border-primary/30 bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b px-5 py-4 flex items-center gap-3">
                  <NoorAvatar size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base">{lang === "ar" ? "نُور AI — توقف ذكي" : "Noor AI — Smart Pause"}</div>
                    <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      {lang === "ar" ? "متصل ومستعد للمساعدة" : "Online & ready to help"}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {lang === "ar" ? "وقفة تعليمية" : "Learning break"}
                  </div>
                </div>

                {popupPhase === "simplify" ? (
                  /* Phase 1: Simplification */
                  <div className="p-5 space-y-4">
                    <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                      <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">
                        {lang === "ar" ? "🎯 تبسيط سريع" : "🎯 Quick Summary"}
                      </p>
                      <p className="text-sm leading-relaxed text-foreground">{cpSimplification}</p>
                    </div>
                    <Button onClick={handleProceedToQuestion} className="w-full h-11 gap-2 text-base">
                      <Brain className="h-5 w-5" />
                      {lang === "ar" ? "أنا مستعد — ابدأ السؤال ←" : "I'm ready — Ask me →"}
                    </Button>
                  </div>
                ) : (
                  /* Phase 2: Question + Chat */
                  <div className="flex flex-col">
                    <div className="max-h-72 overflow-y-auto p-5 space-y-3 bg-muted/10">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                          {msg.role === "assistant" && <NoorAvatar size={26} />}
                          <div className={cn(
                            "rounded-2xl px-4 py-2.5 text-sm max-w-[88%] whitespace-pre-wrap leading-relaxed",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-card border shadow-sm text-foreground rounded-tl-sm"
                          )}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {sendMessageMutation.isPending && (
                        <div className="flex gap-2">
                          <NoorAvatar size={26} />
                          <div className="bg-card border shadow-sm rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm flex gap-1 items-center">
                            <span className="animate-bounce">●</span>
                            <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                            <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>●</span>
                          </div>
                        </div>
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    <div className="p-4 border-t bg-card">
                      {isUnderstanding ? (
                        <Button onClick={handleResumeAfterCorrect} className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white gap-2">
                          <Play className="h-5 w-5 fill-current" />
                          {lang === "ar" ? "ممتاز! 🌟 متابعة الفيديو" : "Excellent! 🌟 Resume Video"}
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Textarea
                              placeholder={lang === "ar" ? "اكتب إجابتك بكلماتك الخاصة..." : "Write your answer in your own words..."}
                              value={chatMessage}
                              onChange={e => setChatMessage(e.target.value)}
                              className="min-h-[56px] resize-none text-sm"
                              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendAnswer(); } }}
                              autoFocus
                            />
                            <Button
                              className="h-auto aspect-square p-0 shrink-0 self-end"
                              onClick={handleSendAnswer}
                              disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex justify-between items-center px-1">
                            <span className="text-xs text-muted-foreground">{lang === "ar" ? "Enter للإرسال" : "Enter to send"}</span>
                            <button
                              onClick={handleSkip}
                              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                            >
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                              {lang === "ar" ? "تخطي (سيتحول رمادياً)" : "Skip (turns grey)"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          {showChatSidebar && (
            <div className="lg:w-[360px] shrink-0">
              <div className="flex flex-col rounded-xl border border-primary/20 bg-card shadow-lg h-[calc(100vh-160px)] min-h-[480px] sticky top-4">
                <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                  <div className="flex items-center gap-3">
                    <NoorAvatar size={34} />
                    <div>
                      <div className="font-semibold text-sm">{lang === "ar" ? "نُور AI — معلمك الذكي" : "Noor AI — Smart Tutor"}</div>
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        {lang === "ar" ? "متصل" : "Online"}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowChatSidebar(false)} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
                  {freeChatHistory.map((msg, i) => (
                    <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                      {msg.role === "assistant" && <NoorAvatar size={26} />}
                      <div className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm max-w-[88%] whitespace-pre-wrap leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-card border shadow-sm text-foreground rounded-tl-sm"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {freeChatMutation.isPending && (
                    <div className="flex gap-2">
                      <NoorAvatar size={26} />
                      <div className="bg-card border shadow-sm rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm flex gap-1">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                        <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>●</span>
                      </div>
                    </div>
                  )}
                  <div ref={freeChatBottomRef} />
                </div>

                <div className="p-3 border-t bg-card/50 shrink-0">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={lang === "ar" ? "اسأل نُور أي سؤال..." : "Ask Noor anything..."}
                      value={freeChatMessage}
                      onChange={e => setFreeChatMessage(e.target.value)}
                      className="min-h-[52px] max-h-[100px] resize-none text-sm"
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
                    {lang === "ar" ? "أسلوب سقراطي — نُور يرشدك ولا يعطيك الإجابة" : "Socratic method — Noor guides, not gives answers"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
