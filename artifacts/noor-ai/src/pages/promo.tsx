import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, BookOpen, Compass, Lightbulb,
  CheckCircle2, Star, Zap, Shield, PlayCircle,
  GraduationCap, Brain, Trophy, MessageCircle, PauseCircle,
} from "lucide-react";
import { useLang } from "@/lib/language";

export default function Promo() {
  const { t } = useLang();

  const STATS = [
    { number: "مئات+", label: t.promoStatLessons, sublabel: t.promoStatLessonsSub },
    { number: "4+",    label: t.promoStatTracks,  sublabel: t.promoStatTracksSub },
    { number: "5$",    label: t.promoStatPrice,   sublabel: t.promoStatPriceSub },
  ];

  const CATEGORIES = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: t.promoCatQuduratTitle,
      titleEn: "Qudurat",
      desc: t.promoCatQuduratDesc,
      icon_bg: "bg-sky-100 text-sky-600",
      count: t.promoCatCountGrowing,
    },
    {
      icon: <GraduationCap className="h-8 w-8" />,
      title: t.promoCatTahsiliTitle,
      titleEn: "Tahsili",
      desc: t.promoCatTahsiliDesc,
      icon_bg: "bg-cyan-100 text-cyan-600",
      count: t.promoCatCountGrowing,
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: t.promoCatSecondaryTitle,
      titleEn: "Secondary Tracks",
      desc: t.promoCatSecondaryDesc,
      icon_bg: "bg-blue-100 text-blue-600",
      count: t.promoCatCountGrowing,
    },
    {
      icon: <Lightbulb className="h-8 w-8" />,
      title: t.promoCatGeneralTitle,
      titleEn: "General / Tips",
      desc: t.promoCatGeneralDesc,
      icon_bg: "bg-sky-100 text-sky-500",
      count: t.promoCatCountRenewing,
    },
  ];

  const TIPS = [
    t.promoTip1,
    t.promoTip2,
    t.promoTip3,
    t.promoTip4,
    t.promoTip5,
    t.promoTip6,
  ];

  const SIMULATOR_FEATURES = [
    { icon: <Star className="h-4 w-4" />,   text: t.promoSimFeat1 },
    { icon: <Zap className="h-4 w-4" />,    text: t.promoSimFeat2 },
    { icon: <Trophy className="h-4 w-4" />, text: t.promoSimFeat3 },
    { icon: <Shield className="h-4 w-4" />, text: t.promoSimFeat4 },
  ];

  return (
    <AppLayout>
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section id="promo-hero" className="relative w-full overflow-hidden bg-sky-50">
        <div aria-hidden className="pointer-events-none absolute -top-32 -end-32 h-[420px] w-[420px] rounded-full bg-sky-200/50 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -start-24 h-[300px] w-[300px] rounded-full bg-cyan-200/40 blur-2xl" />

        <div className="container mx-auto px-4 py-24 md:py-36 text-center max-w-4xl relative">
          <div className="inline-flex items-center gap-2 bg-white border border-sky-200 text-sky-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-8 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
            {t.promoBadge}
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-800 mb-6 leading-tight text-balance">
            <span className="text-sky-600">{t.promoH1}</span>
            <br className="hidden sm:block" />
            {t.promoH1Sub}
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.promoHeroDesc}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-13 px-10 text-base font-semibold rounded-full shadow-md bg-sky-600 hover:bg-sky-700 text-white" asChild>
              <Link href="/register">
                {t.promoCtaStart} <ArrowLeft className="ms-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-13 px-10 text-base rounded-full border-sky-300 text-sky-700 hover:bg-sky-100 bg-white" asChild>
              <Link href="/subscribe">{t.promoCtaPricing}</Link>
            </Button>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {STATS.map((s, i) => (
              <div key={i} className="bg-white border border-sky-100 rounded-2xl px-4 py-5 text-center shadow-sm">
                <div className="text-3xl font-extrabold text-sky-600 leading-none mb-1">{s.number}</div>
                <div className="text-sm font-semibold text-slate-700 mb-0.5">{s.label}</div>
                <div className="text-xs text-slate-500">{s.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION A: Courses Library ───────────────────────── */}
      <section id="promo-courses" className="w-full py-20 bg-sky-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-sky-200 text-sky-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4 shadow-sm">
              <PlayCircle className="h-4 w-4" />
              {t.promoCoursesBadge}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-slate-800">
              {t.promoCoursesH2}
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              {t.promoCoursesDesc}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {CATEGORIES.map((cat, i) => (
              <div
                key={i}
                className="relative rounded-2xl border border-sky-100 bg-white p-7 flex flex-col gap-4 group hover:shadow-md hover:border-sky-200 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${cat.icon_bg} shrink-0`}>
                    {cat.icon}
                  </div>
                  <span className="text-3xl font-extrabold text-slate-200">{cat.count}</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1 tracking-wide uppercase">{cat.titleEn}</div>
                  <h3 className="text-xl font-bold mb-2 text-slate-800">{cat.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="outline" className="rounded-full px-8 border-sky-300 text-sky-700 hover:bg-sky-100 bg-white" asChild>
              <Link href="/register">{t.promoCoursesCta}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── SECTION: Socratic Teacher ────────────────────────── */}
      <section id="promo-socratic" className="w-full py-20 bg-sky-50 border-t border-sky-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white border border-sky-200 text-sky-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-5 shadow-sm">
                <Brain className="h-4 w-4" />
                {t.promoSocraticBadge}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5 leading-snug text-slate-800">
                {t.promoSocraticH2}{" "}
                <span className="text-sky-600">{t.promoSocraticH2Span}</span>{" "}
                {t.promoSocraticH2End}
              </h2>
              <p className="text-slate-600 text-lg mb-7 leading-relaxed">
                {t.promoSocraticDesc}
              </p>
              <ul className="space-y-3 mb-8">
                {[t.promoSocraticFeat1, t.promoSocraticFeat2, t.promoSocraticFeat3].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <div className="h-7 w-7 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="rounded-full px-8 h-11 bg-sky-600 hover:bg-sky-700 text-white" asChild>
                <Link href="/register">{t.promoSocraticCta}</Link>
              </Button>
            </div>

            {/* Visual — dialogue bubbles */}
            <div className="flex items-center justify-center order-first md:order-last">
              <div className="relative w-full max-w-xs space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-sky-600 flex items-center justify-center shrink-0 shadow">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white border border-sky-200 rounded-2xl rounded-ss-none px-4 py-3 text-sm font-medium text-slate-700 shadow-sm max-w-[220px]">
                    {t.promoSocraticQ1}
                  </div>
                </div>
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-se-none px-4 py-3 text-sm text-slate-500 shadow-sm max-w-[200px]">
                    {t.promoSocraticA1}
                  </div>
                  <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                    <span className="text-base">👨‍🎓</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-sky-600 flex items-center justify-center shrink-0 shadow">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white border border-sky-200 rounded-2xl rounded-ss-none px-4 py-3 text-sm font-medium text-slate-700 shadow-sm max-w-[220px]">
                    {t.promoSocraticQ2}
                  </div>
                </div>
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-white border border-cyan-200 rounded-2xl rounded-se-none px-4 py-3 text-sm font-medium text-slate-700 shadow-sm max-w-[200px]">
                    {t.promoSocraticA2}
                  </div>
                  <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                    <span className="text-base">👨‍🎓</span>
                  </div>
                </div>
                <div className="mt-4 bg-white border border-sky-200 rounded-2xl px-4 py-3 text-center shadow-sm">
                  <p className="text-xs font-semibold text-sky-700 leading-relaxed">
                    "{t.promoSocraticQuote}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION: Smart Pause ─────────────────────────────── */}
      <section id="promo-smartpause" className="w-full py-20 bg-sky-50 border-t border-sky-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Visual — video player mockup */}
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-xs">
                <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-lg">
                  <div className="relative bg-gradient-to-br from-sky-100 to-sky-50 h-40 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full bg-sky-600 flex items-center justify-center shadow-xl">
                        <PauseCircle className="h-9 w-9 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 start-4 end-4">
                      <div className="h-1.5 bg-sky-200 rounded-full overflow-hidden">
                        <div className="h-full w-3/5 bg-sky-500 rounded-full" />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-sky-500 text-xs">2:34</span>
                        <span className="text-sky-400 text-xs">4:12</span>
                      </div>
                    </div>
                    <div className="absolute top-3 end-3 bg-sky-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {t.promoPauseBadgeText}
                    </div>
                  </div>
                  <div className="p-4 border-t border-sky-100">
                    <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wide">{t.promoPauseLabel}</p>
                    <p className="text-sm font-semibold mb-3 leading-relaxed text-slate-700">
                      {t.promoPauseQuestion}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[t.promoPauseOpt1, t.promoPauseOpt2].map((opt, i) => (
                        <div key={i} className={`text-xs font-medium px-3 py-2 rounded-xl border text-center cursor-default ${i === 1 ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-400"}`}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -end-4 bg-sky-600 text-white text-xs font-bold px-3 py-2 rounded-2xl shadow-lg">
                  {t.promoPauseCheck}
                </div>
              </div>
            </div>

            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white border border-sky-200 text-sky-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-5 shadow-sm">
                <PauseCircle className="h-4 w-4" />
                {t.promoPauseBadge}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5 leading-snug text-slate-800">
                {t.promoPauseH2}{" "}
                <span className="text-sky-600">{t.promoPauseH2Span}</span>
              </h2>
              <p className="text-slate-600 text-lg mb-5 leading-relaxed">
                {t.promoPauseDesc}
              </p>
              <ul className="space-y-3 mb-8">
                {[t.promoPauseFeat1, t.promoPauseFeat2, t.promoPauseFeat3].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <div className="h-7 w-7 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="rounded-full px-8 h-11 bg-sky-600 hover:bg-sky-700 text-white" asChild>
                <Link href="/register">{t.promoPauseCta}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION: Career Simulator ────────────────────────── */}
      <section id="promo-simulator" className="w-full py-20 bg-sky-50 border-t border-sky-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Visual */}
            <div className="relative flex items-center justify-center order-2 md:order-1">
              <div className="relative h-64 w-64">
                <div className="absolute inset-0 rounded-full bg-sky-100 animate-pulse" />
                <div className="absolute inset-6 rounded-full bg-sky-200/60 flex items-center justify-center">
                  <div className="absolute inset-4 rounded-full bg-sky-200/80 flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full bg-sky-600 flex items-center justify-center shadow-xl">
                      <Compass className="h-12 w-12 text-white" />
                    </div>
                  </div>
                </div>
                {["🎓","💼","🏆","⭐"].map((emoji, i) => (
                  <div
                    key={i}
                    className="absolute h-10 w-10 rounded-full bg-white border border-sky-200 shadow-sm flex items-center justify-center text-lg"
                    style={{
                      top: `${50 - 44 * Math.cos((i * Math.PI) / 2)}%`,
                      left: `${50 + 44 * Math.sin((i * Math.PI) / 2)}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>

            {/* Text */}
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 bg-white border border-sky-200 text-sky-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-5 shadow-sm">
                <Compass className="h-4 w-4" />
                {t.promoSimBadge}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-slate-800">
                {t.promoSimH2}
              </h2>
              <p className="text-slate-600 text-lg mb-7 leading-relaxed">
                {t.promoSimDesc}
              </p>
              <ul className="space-y-3 mb-8">
                {SIMULATOR_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <div className="h-7 w-7 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                      {f.icon}
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>
              <Button className="rounded-full px-8 h-11 bg-sky-600 hover:bg-sky-700 text-white" asChild>
                <Link href="/register">{t.promoSimCta}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION: Golden Tips ─────────────────────────────── */}
      <section id="promo-tips" className="w-full py-20 bg-sky-50 border-t border-sky-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white border border-sky-200 text-sky-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4 shadow-sm">
              <Lightbulb className="h-4 w-4" />
              {t.promoTipsBadge}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-slate-800">
              {t.promoTipsH2}
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              {t.promoTipsDesc}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {TIPS.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white border border-sky-100 rounded-2xl p-5 hover:border-sky-200 hover:shadow-sm transition-all"
              >
                <div className="h-7 w-7 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 font-bold text-sm mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed font-medium text-slate-700">{tip}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-white border border-sky-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="h-6 w-6 text-sky-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-800">{t.promoTipsBoxTitle}</h3>
            <p className="text-slate-500 mb-5 text-sm">{t.promoTipsBoxDesc}</p>
            <Button className="rounded-full px-8 bg-sky-600 hover:bg-sky-700 text-white" asChild>
              <Link href="/register">{t.promoTipsCta}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────── */}
      <section id="promo-cta" className="w-full py-20 bg-sky-50 border-t border-gray-200">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-sky-200 text-sky-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-6 shadow-sm">
            <CheckCircle2 className="h-4 w-4" />
            {t.promoFooterBadge}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5 text-slate-800">
            {t.promoFooterH2}
          </h2>
          <p className="text-slate-600 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            {t.promoFooterDesc}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="rounded-full px-10 h-13 text-base font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-md" asChild>
              <Link href="/register">
                {t.promoFooterPrimary} <ArrowLeft className="ms-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-10 h-13 text-base border-sky-300 text-sky-700 hover:bg-sky-100 bg-white" asChild>
              <Link href="/subscribe">{t.promoFooterSecondary}</Link>
            </Button>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
