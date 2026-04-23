import { useEffect, useRef, useState, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Brain, Play, Send, Lock, AlertTriangle, CheckCircle2, Circle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language";
import { apiClient } from "@/lib/api";

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

const CHECKPOINT_SIMPLIFICATIONS: Record<string, { ar: string; en: string }> = {
  "-1": {
    ar: "ببساطة، المعلم يقصد هنا أن الأساس الأول للموضوع قد وُضع — هذه اللبنات الجوهرية التي سيُبنى عليها كل شيء لاحقاً. فهمها جيداً يجعل ما يأتي أسهل بكثير.",
    en: "Simply put, the teacher means here that the first foundation of the topic has been laid — these core building blocks that everything later builds upon. Understanding them well makes what follows much easier.",
  },
  "-2": {
    ar: "ببساطة، المعلم يقصد هنا أننا وصلنا منتصف الرحلة. الأفكار الجديدة لا تأتي من فراغ — بل تبني على ما مضى مثل طوابق بناء متصاعد. الربط بين ما سبق وما يأتي هو جوهر الفهم.",
    en: "Simply put, the teacher means here that we've reached the midpoint. New ideas don't come from nowhere — they build on what came before like ascending floors of a building. Connecting past and present is the core of understanding.",
  },
  "-3": {
    ar: "ببساطة، المعلم يقصد هنا أننا في المرحلة الأعمق من الدرس. كل ما تعلمته سابقاً يتجمع الآن ليكشف الصورة الكاملة — هذا الجزء يربط الخيوط ويوضح 'لماذا' وليس فقط 'ماذا'.",
    en: "Simply put, the teacher means here that we're in the deepest phase of the lesson. Everything learned before now gathers to reveal the full picture — this part connects the threads and clarifies 'why' not just 'what'.",
  },
  "-4": {
    ar: "ببساطة، المعلم يقصد هنا أن الدرس اكتمل! الآن هو وقت الترسيخ — تحويل المعلومات من ذاكرة مؤقتة إلى فهم دائم. كيف ستوظف ما تعلمته في حياتك؟",
    en: "Simply put, the teacher means here that the lesson is complete! Now is the time for consolidation — converting information from temporary memory to lasting understanding. How will you apply what you've learned?",
  },
};

const CHECKPOINT_LABELS: Record<string, { ar: string; en: string }> = {
  "-1": { ar: "المحطة الأولى — ربع الدرس", en: "Stop 1 — Quarter Point" },
  "-2": { ar: "المحطة الثانية — منتصف الدرس", en: "Stop 2 — Midpoint" },
  "-3": { ar: "المحطة الثالثة — ثلاثة أرباع", en: "Stop 3 — Three Quarters" },
  "-4": { ar: "المحطة الرابعة — نهاية الدرس", en: "Stop 4 — End of Lesson" },
};

export default function VideoPlayer() {
  const [, params] = useRoute("/videos/:id");
  const videoId = parseInt(params?.id || "0");
  const { toast } = useToast();
  const { user } = useAuth();
  const { lang } = useLang();

  const isSubscribed = user?.subscribed || user?.role === "admin";

  const [playerReady, setPlayerReady] = useState(false);
  const [realDuration, setRealDuration] = useState(0);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const freeChatBottomRef = useRef<HTMLDivElement>(null);
  const activeCheckpointsRef = useRef<any[]>([]);
  const checkpointResultsRef = useRef<Record<number, CheckpointResult>>({});
  const showCheckpointPopupRef = useRef(false);

  const [currentCheckpoint, setCurrentCheckpoint] = useState<any>(null);
  const [showCheckpointPopup, setShowCheckpointPopup] = useState(false);
  const [popupPhase, setPopupPhase] = useState<"simplify" | "question">("simplify");
  const [checkpointResults, setCheckpointResults] = useState<Record<number, CheckpointResult>>({});

  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isUnderstanding, setIsUnderstanding] = useState(false);

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

  // Use real duration fetched from YouTube player; fall back to DB value while player loads
  const duration = realDuration || video?.duration || 0;

  // Checkpoints calculated as exact % of total duration — P4 fires on ENDED event only
  const autoCheckpoints = [
    { id: -1, timestampSeconds: duration > 0 ? Math.floor(duration * 0.25) : 0, question: lang === "ar" ? "ما الفكرة الرئيسية التي استوعبتها حتى الآن؟ اشرحها بكلماتك أنت — كأنك تشرحها لصديق." : "What is the main idea you've understood so far? Explain it in your own words — as if explaining to a friend." },
    { id: -2, timestampSeconds: duration > 0 ? Math.floor(duration * 0.50) : 0, question: lang === "ar" ? "كيف ترتبط هذه المعلومات الجديدة بما شاهدته في بداية الدرس؟ هل ترى تطوراً في الفكرة؟" : "How does this new information connect to what you saw at the beginning? Do you see an evolution in the idea?" },
    { id: -3, timestampSeconds: duration > 0 ? Math.floor(duration * 0.75) : 0, question: lang === "ar" ? "ما أبرز نقطة أثارت تفكيرك في هذا الجزء من الدرس؟ لماذا استوقفتك تحديداً؟" : "What key point made you think the most in this section? Why did it stand out to you specifically?" },
    { id: -4, timestampSeconds: duration > 0 ? duration : 0, question: lang === "ar" ? "ما أهم درس واحد تأخذه من هذا الفيديو كاملاً؟ وكيف ستوظفه في حياتك أو دراستك؟" : "What is the single most important lesson from this entire video? How will you apply it in your life or studies?" },
  ];
  // P1–P3 polled by interval; P4 fires exclusively on ENDED event
  const pollingCheckpoints = autoCheckpoints.slice(0, 3);

  const activeCheckpoints = (checkpoints && checkpoints.length > 0) ? checkpoints : autoCheckpoints;

  const pollingCheckpointsRef = useRef<any[]>([]);

  // Keep refs in sync to avoid stale closures in the interval
  useEffect(() => { activeCheckpointsRef.current = activeCheckpoints; }, [activeCheckpoints]);
  useEffect(() => { pollingCheckpointsRef.current = pollingCheckpoints; }, [pollingCheckpoints]);
  useEffect(() => { checkpointResultsRef.current = checkpointResults; }, [checkpointResults]);
  useEffect(() => { showCheckpointPopupRef.current = showCheckpointPopup; }, [showCheckpointPopup]);

  useEffect(() => {
    if (!isSubscribed) return;
    const loadAPI = () => {
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = () => setPlayerReady(true);
      } else if (window.YT?.Player) {
        setPlayerReady(true);
      } else {
        window.onYouTubeIframeAPIReady = () => setPlayerReady(true);
      }
    };
    loadAPI();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isSubscribed]);

  useEffect(() => {
    if (!isSubscribed || !playerReady || !video?.youtubeId || playerRef.current) return;
    playerRef.current = new window.YT.Player(`yt-player-${videoId}`, {
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
      events: {
        onReady: (e: any) => {
          const d = e.target.getDuration();
          if (d && d > 0) {
            const secs = Math.floor(d);
            setRealDuration(secs);
            // Persist real duration to DB so list views show it correctly
            apiClient.patch(`/videos/${videoId}/duration`, { duration: secs }).catch(() => {});
          }
        },
        onStateChange: onPlayerStateChange,
      },
    });
  }, [playerReady, video, isSubscribed]);

  useEffect(() => {
    if (freeChatHistory.length === 0 && video?.title) {
      setFreeChatHistory([{
        role: "assistant",
        content: lang === "ar"
          ? `مرحباً! أنا نُور 🌟 معلمك الذكي.\n\nأنا هنا لمساعدتك على فهم درس **"${video.title}"** بعمق.\n\nاسألني أي شيء — أو أخبرني: ما الذي لفت انتباهك حتى الآن؟`
          : `Hello! I'm Noor 🌟 your AI tutor.\n\nI'm here to help you deeply understand **"${video.title}"**.\n\nAsk me anything — or tell me: what caught your attention so far?`,
      }]);
    }
  }, [video?.title, lang]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    freeChatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [freeChatHistory]);

  const triggerCheckpoint = useCallback((cp: typeof autoCheckpoints[0]) => {
    setCurrentCheckpoint(cp);
    setPopupPhase("simplify");
    setShowCheckpointPopup(true);
    setChatHistory([]);
    setIsUnderstanding(false);
    setChatMessage("");
  }, []);

  const onPlayerStateChange = useCallback((event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          if (!playerRef.current?.getCurrentTime) return;
          const t = playerRef.current.getCurrentTime();
          if (Math.floor(t) % 30 === 0 && Math.floor(t) > 0) {
            recordProgressMutation.mutate({ data: { videoId, watchedSeconds: Math.floor(t) } });
          }
          // Only poll P1–P3 here; P4 fires exclusively on ENDED
          const cps = pollingCheckpointsRef.current;
          const results = checkpointResultsRef.current;
          const popupOpen = showCheckpointPopupRef.current;
          if (popupOpen) return;
          const upcoming = cps.find(cp => !results[cp.id] && Math.abs(t - cp.timestampSeconds) < 1.5);
          if (upcoming) {
            playerRef.current.pauseVideo();
            triggerCheckpoint(upcoming);
          }
        }, 1000);
      }
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (event.data === window.YT.PlayerState.ENDED) {
        recordProgressMutation.mutate({ data: { videoId, watchedSeconds: Math.floor(duration), completed: true } });
        if (!checkpointResultsRef.current[-4]) {
          triggerCheckpoint(autoCheckpoints[3]);
        }
      }
    }
  }, [triggerCheckpoint, duration, videoId]);

  const handleProceedToQuestion = () => {
    setPopupPhase("question");
    setChatHistory([{
      role: "assistant",
      content: lang === "ar"
        ? `🔔 **سؤال نُور لك:**\n\n${currentCheckpoint?.question}`
        : `🔔 **Noor's question for you:**\n\n${currentCheckpoint?.question}`,
    }]);
  };

  const handleSendAnswer = () => {
    if (!chatMessage.trim() || !currentCheckpoint) return;
    const userMsg = chatMessage.trim();
    setChatMessage("");
    const updated = [...chatHistory, { role: "user" as const, content: userMsg }];
    setChatHistory(updated);
    sendMessageMutation.mutate(
      { data: { message: userMsg, videoId, checkpointId: currentCheckpoint.id > 0 ? currentCheckpoint.id : undefined, history: updated } },
      {
        onSuccess: (res) => {
          setChatHistory([...updated, { role: "assistant", content: res.reply }]);
          if (res.understood) {
            setIsUnderstanding(true);
            setCheckpointResults(prev => ({ ...prev, [currentCheckpoint.id]: "correct" }));
            toast({ title: lang === "ar" ? "ممتاز! 🌟" : "Excellent! 🌟", description: lang === "ar" ? "أثبتت فهمك. المحطة أصبحت خضراء!" : "You demonstrated understanding!" });
          }
        },
        onError: () => setChatHistory([...updated, { role: "assistant", content: lang === "ar" ? "عذراً، حدث خطأ. أعد المحاولة." : "Sorry, an error occurred." }]),
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
    toast({ title: lang === "ar" ? "⚠️ تخطيت المحطة" : "⚠️ Stop skipped", description: lang === "ar" ? "المحطة تحولت رمادية. التعلم الحقيقي يأتي من المحاولة!" : "Stop turned grey. Real learning comes from trying!" });
  };

  const handleSendFreeMessage = () => {
    if (!freeChatMessage.trim()) return;
    const userMsg = freeChatMessage.trim();
    setFreeChatMessage("");
    const updated = [...freeChatHistory, { role: "user" as const, content: userMsg }];
    setFreeChatHistory(updated);
    freeChatMutation.mutate(
      { data: { message: userMsg, videoId, history: updated } },
      {
        onSuccess: (res) => setFreeChatHistory([...updated, { role: "assistant", content: res.reply }]),
        onError: () => setFreeChatHistory([...updated, { role: "assistant", content: lang === "ar" ? "عذراً، حدث خطأ." : "Sorry, an error occurred." }]),
      }
    );
  };

  if (videoLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex gap-5">
            <div className="flex-1 space-y-4">
              <Skeleton className="w-full aspect-video rounded-xl" />
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="hidden lg:block w-[300px] shrink-0">
              <Skeleton className="h-full min-h-[400px] rounded-xl" />
            </div>
          </div>
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
    return <AppLayout><FullPaywall lang={lang} /></AppLayout>;
  }

  const cpSimplification = currentCheckpoint
    ? (CHECKPOINT_SIMPLIFICATIONS[String(currentCheckpoint.id)]?.[lang === "ar" ? "ar" : "en"] || (lang === "ar" ? "ببساطة، المعلم يقصد هنا أن هذه لحظة مهمة في الدرس تستحق التوقف والتأمل." : "Simply put, the teacher means here that this is an important moment in the lesson worth pausing and reflecting on."))
    : "";

  return (
    <AppLayout>
      {/* Checkpoint Modal — centered overlay over entire page */}
      {showCheckpointPopup && currentCheckpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-primary/20 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary/15 via-primary/8 to-transparent border-b px-5 py-4 flex items-center gap-3">
              <NoorAvatar size={46} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base leading-tight">
                  {lang === "ar" ? "نُور AI — وقفة ذكية" : "Noor AI — Smart Pause"}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                  {lang === "ar" ? "متصل ومستعد للمساعدة" : "Online & ready to help"}
                </div>
              </div>
              <div className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0">
                {CHECKPOINT_LABELS[String(currentCheckpoint.id)]?.[lang === "ar" ? "ar" : "en"] || (lang === "ar" ? "وقفة تعليمية" : "Learning stop")}
              </div>
            </div>

            {popupPhase === "simplify" ? (
              /* Phase 1 — Simplification */
              <div className="p-5 space-y-4">
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                    {lang === "ar" ? "🎯 تبسيط من نُور" : "🎯 Noor's Simplification"}
                  </p>
                  <p className="text-sm leading-relaxed text-foreground">{cpSimplification}</p>
                </div>
                <Button onClick={handleProceedToQuestion} className="w-full h-12 gap-2 text-base font-semibold">
                  <Brain className="h-5 w-5" />
                  {lang === "ar" ? "مستعد! ابدأ السؤال →" : "Ready! Start Question →"}
                </Button>
              </div>
            ) : (
              /* Phase 2 — Socratic Chat */
              <div className="flex flex-col">
                <div className="max-h-64 overflow-y-auto p-4 space-y-3 bg-muted/10">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                      {msg.role === "assistant" && <NoorAvatar size={26} />}
                      <div className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm max-w-[88%] whitespace-pre-wrap leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-card border shadow-sm rounded-tl-sm"
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

                <div className="p-4 border-t bg-card/50">
                  {isUnderstanding ? (
                    <Button onClick={handleResumeAfterCorrect} className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white gap-2 font-semibold">
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
                          className="min-h-[56px] max-h-[120px] resize-none text-sm"
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
                        <span className="text-xs text-muted-foreground">Enter {lang === "ar" ? "للإرسال" : "to send"}</span>
                        <button
                          onClick={handleSkip}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          {lang === "ar" ? "تخطي المحطة (تتحول رمادية)" : "Skip stop (turns grey)"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-5 max-w-7xl">
        {/* dir="ltr" forces video-left / sidebar-right on all locales */}
        <div className="flex flex-col lg:flex-row gap-5" dir="ltr">

          {/* ─── LEFT: Video + Meta ─── */}
          <div className="flex-1 min-w-0 space-y-4" dir="auto">

            {/* 16:9 Video container — clean, no black bars */}
            <div
              className="relative w-full rounded-xl overflow-hidden shadow-xl border border-border/50"
              style={{ aspectRatio: "16/9", background: "transparent" }}
            >
              {/* YouTube IFrame target */}
              <div id={`yt-player-${videoId}`} className="absolute inset-0 w-full h-full" />

              {/*
                YouTube Brand Suppression — pointer-events:none approach:
                These divs visually obscure YouTube branding areas without
                blocking any player interaction (play/pause/seek/volume).
                All elements use pointer-events:none so the player beneath remains fully interactive.
              */}

              {/* Top gradient — hides channel name & title that appear on hover */}
              <div
                className="absolute top-0 left-0 right-0 z-20"
                style={{
                  height: "56px",
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Top-right corner — masks YouTube watermark logo */}
              <div
                className="absolute top-0 right-0 z-30"
                style={{
                  width: "100px",
                  height: "40px",
                  background: "linear-gradient(to bottom-left, rgba(0,0,0,0.6) 0%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Bottom-right corner — masks "Watch on YouTube" link
                  Uses a dark gradient that blends with YouTube's control bar colour */}
              <div
                className="absolute bottom-0 right-0 z-30"
                style={{
                  width: "200px",
                  height: "46px",
                  background: "linear-gradient(to top-left, rgba(0,0,0,0.72) 0%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Progress checkpoint dots — above the player, below nothing */}
              <div className="absolute bottom-[46px] left-0 right-0 h-[4px] z-40 pointer-events-none">
                {duration > 0 && activeCheckpoints.map(cp => {
                  if (!cp.timestampSeconds) return null;
                  const result = checkpointResults[cp.id];
                  const pct = Math.min((cp.timestampSeconds / duration) * 100, 100);
                  return (
                    <div
                      key={cp.id}
                      className={cn(
                        "absolute top-0 w-[6px] h-full -translate-x-1/2 rounded-full",
                        result === "correct"
                          ? "bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.9)]"
                          : result === "skipped"
                          ? "bg-gray-400"
                          : "bg-primary"
                      )}
                      style={{ left: `${pct}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Video meta */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">{video.subject}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                  <Brain className="h-3 w-3" />
                  {lang === "ar" ? `${activeCheckpoints.length} محطات تفاعلية` : `${activeCheckpoints.length} interactive stops`}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold">{video.title}</h1>
              {video.description && <p className="text-muted-foreground text-sm leading-relaxed">{video.description}</p>}
            </div>
          </div>

          {/* ─── RIGHT: Smart Sidebar ─── */}
          <div className="lg:w-[300px] xl:w-[320px] shrink-0 flex flex-col gap-4">

            {/* Checkpoint Progress Panel */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-transparent border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary shrink-0" />
                  <h2 className="font-bold text-sm text-foreground leading-tight">
                    {lang === "ar" ? "محطات الفهم وتأكيد الاستيعاب" : "Comprehension & Understanding Stops"}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ms-6">
                  {lang === "ar" ? "تتوقف تلقائياً عند المحطات" : "Pauses automatically at each stop"}
                </p>
              </div>
              <div className="p-3 space-y-2">
                {activeCheckpoints.map((cp, idx) => {
                  const result = checkpointResults[cp.id];
                  const label = CHECKPOINT_LABELS[String(cp.id)]?.[lang === "ar" ? "ar" : "en"] || `Stop ${idx + 1}`;
                  const timeLabel = `${Math.floor(cp.timestampSeconds / 60)}:${(cp.timestampSeconds % 60).toString().padStart(2, "0")}`;
                  return (
                    <div
                      key={cp.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                        result === "correct" ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800" :
                        result === "skipped" ? "bg-muted/50 border border-border/50" :
                        "bg-muted/30 border border-border/30"
                      )}
                    >
                      {result === "correct" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                      ) : result === "skipped" ? (
                        <Circle className="h-4 w-4 text-gray-400 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-primary/50 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-xs font-medium truncate",
                          result === "correct" ? "text-green-700 dark:text-green-400" :
                          result === "skipped" ? "text-muted-foreground" : "text-foreground"
                        )}>
                          {label}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        <span className="font-mono">{timeLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 pb-3 pt-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {lang === "ar" ? "مكتمل:" : "Completed:"}
                    {" "}<span className="font-semibold text-green-600">{Object.values(checkpointResults).filter(r => r === "correct").length}</span>
                    /{activeCheckpoints.length}
                  </span>
                  <span>
                    {lang === "ar" ? "متخطي:" : "Skipped:"}
                    {" "}<span className="font-semibold text-gray-500">{Object.values(checkpointResults).filter(r => r === "skipped").length}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Noor AI Chat Panel */}
            <div className="flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden" style={{ height: "calc(100vh - 440px)", minHeight: "300px" }}>
              <div className="flex items-center gap-3 px-4 py-3 border-b bg-gradient-to-r from-primary/8 to-transparent shrink-0">
                <NoorAvatar size={30} />
                <div>
                  <div className="font-semibold text-sm">{lang === "ar" ? "نُور AI — معلمك الذكي" : "Noor AI — Smart Tutor"}</div>
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {lang === "ar" ? "متصل ومستعد" : "Online"}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/5">
                {freeChatHistory.map((msg, i) => (
                  <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    {msg.role === "assistant" && <NoorAvatar size={22} />}
                    <div className={cn(
                      "rounded-2xl px-3 py-2 text-xs max-w-[90%] whitespace-pre-wrap leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border shadow-sm rounded-tl-sm"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {freeChatMutation.isPending && (
                  <div className="flex gap-2">
                    <NoorAvatar size={22} />
                    <div className="bg-card border shadow-sm rounded-2xl rounded-tl-sm px-3 py-2 text-xs flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>●</span>
                    </div>
                  </div>
                )}
                <div ref={freeChatBottomRef} />
              </div>

              <div className="p-2.5 border-t bg-card/50 shrink-0">
                <div className="flex gap-2">
                  <Textarea
                    placeholder={lang === "ar" ? "اسأل نُور أي سؤال..." : "Ask Noor anything..."}
                    value={freeChatMessage}
                    onChange={e => setFreeChatMessage(e.target.value)}
                    className="min-h-[44px] max-h-[88px] resize-none text-xs leading-snug"
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendFreeMessage(); } }}
                  />
                  <Button
                    size="sm"
                    className="h-auto aspect-square p-0 shrink-0 self-end"
                    onClick={handleSendFreeMessage}
                    disabled={!freeChatMessage.trim() || freeChatMutation.isPending}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 text-center leading-tight">
                  {lang === "ar" ? "أسلوب سقراطي — نُور يرشدك ولا يعطيك الإجابة مباشرة" : "Socratic style — Noor guides, doesn't give direct answers"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
