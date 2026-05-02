import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, BookOpen, Compass, Lightbulb,
  CheckCircle2, Star, Zap, Shield, PlayCircle,
  GraduationCap, Brain, Trophy,
} from "lucide-react";

const STATS = [
  { number: "318", label: "درساً مكثفاً", sublabel: "في المكتبة" },
  { number: "4", label: "مسارات تعليمية", sublabel: "قدرات · تحصيلي · مسارات · عام" },
  { number: "5$", label: "فقط شهرياً", sublabel: "وصول كامل غير محدود" },
];

const CATEGORIES = [
  {
    icon: <Brain className="h-8 w-8" />,
    title: "قدرات",
    titleEn: "Qudurat",
    desc: "دروس شاملة لاختبار القدرات العامة — لفظي وكمي — مع نقاط تحقق بالذكاء الاصطناعي تضمن الفهم الفعلي.",
    color: "from-blue-500/10 to-blue-500/5",
    border: "border-blue-200 dark:border-blue-800",
    icon_bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    count: "+120",
  },
  {
    icon: <GraduationCap className="h-8 w-8" />,
    title: "تجميعات تحصيلي",
    titleEn: "Tahsili",
    desc: "تجميعات وشرح معمّق لاختبار التحصيل الدراسي — علوم وأدبيات — بأسلوب الطريقة السقراطية.",
    color: "from-violet-500/10 to-violet-500/5",
    border: "border-violet-200 dark:border-violet-800",
    icon_bg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    count: "+130",
  },
  {
    icon: <BookOpen className="h-8 w-8" />,
    title: "دروس مسارات ثانوي",
    titleEn: "Secondary Tracks",
    desc: "مادة الثانوية بمساراتها المختلفة — علمي وأدبي — معبّأة في دروس مركّزة وفعّالة.",
    color: "from-amber-500/10 to-amber-500/5",
    border: "border-amber-200 dark:border-amber-800",
    icon_bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    count: "+50",
  },
  {
    icon: <Lightbulb className="h-8 w-8" />,
    title: "عام — نصائح ذهبية",
    titleEn: "General / Tips",
    desc: "نصائح ما قبل الاختبار وأسرار الأداء العالي — محتوى يُعدّك نفسياً وذهنياً لتتفوق يوم الامتحان.",
    color: "from-green-500/10 to-green-500/5",
    border: "border-green-200 dark:border-green-800",
    icon_bg: "bg-green-500/10 text-green-600 dark:text-green-400",
    count: "+18",
  },
];

const TIPS = [
  "ابدأ المراجعة قبل الامتحان بأسبوعين على الأقل",
  "حلّ نماذج حقيقية من أسئلة السنوات الماضية",
  "خصّص 20 دقيقة يومياً للمراجعة السريعة",
  "استخدم تقنية بومودورو: 25 دقيقة تركيز + 5 راحة",
  "نَم 8 ساعات قبل يوم الامتحان — الدماغ يحتاجها",
  "اكتب ما تعلّمته بأسلوبك الخاص — يُرسّخه في الذاكرة",
];

const SIMULATOR_FEATURES = [
  { icon: <Star className="h-4 w-4" />, text: "4 أسئلة فقط — نتيجة فورية ودقيقة" },
  { icon: <Zap className="h-4 w-4" />, text: "توقعات مالية حقيقية للمهن المُوصى بها" },
  { icon: <Trophy className="h-4 w-4" />, text: "خارطة طريق مفصّلة بمراحل واضحة" },
  { icon: <Shield className="h-4 w-4" />, text: "تجربة مجانية مرة واحدة بدون اشتراك" },
];

export default function Promo() {
  return (
    <AppLayout>
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section id="promo-hero" className="relative w-full overflow-hidden bg-gradient-to-b from-primary/8 via-primary/4 to-background border-b border-border/40">
        {/* decorative circles */}
        <div aria-hidden className="pointer-events-none absolute -top-32 -end-32 h-[420px] w-[420px] rounded-full bg-primary/6 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -start-24 h-[300px] w-[300px] rounded-full bg-primary/5 blur-2xl" />

        <div className="container mx-auto px-4 py-24 md:py-36 text-center max-w-4xl relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-8">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            منصة تعليمية عربية متخصصة
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-tight text-balance">
            منصة{" "}
            <span className="text-primary">نُور AI</span>
            <br className="hidden sm:block" />
            دليلك الشامل للقدرات،{" "}
            <span className="text-primary">التحصيلي</span>
            ، ونظام المسارات
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            318 درساً مكثفاً + مدرّس ذكاء اصطناعي سقراطي + محاكي المستقبل المهني — كل ما تحتاجه في مكان واحد، بـ 5$ شهرياً فقط.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-13 px-10 text-base font-semibold rounded-full shadow-md" asChild>
              <Link href="/register">
                ابدأ مجاناً الآن <ArrowLeft className="ms-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-13 px-10 text-base rounded-full" asChild>
              <Link href="/subscribe">عرض الأسعار</Link>
            </Button>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {STATS.map((s, i) => (
              <div key={i} className="bg-card/80 border border-border rounded-2xl px-4 py-5 text-center shadow-sm">
                <div className="text-3xl font-extrabold text-primary leading-none mb-1">{s.number}</div>
                <div className="text-sm font-semibold text-foreground mb-0.5">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION A: 318 درساً ─────────────────────────────── */}
      <section id="promo-courses" className="w-full py-20 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <PlayCircle className="h-4 w-4" />
              المكتبة التعليمية
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              318 درساً مكثفاً
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              تغطية شاملة لكل ما تحتاجه — من القدرات والتحصيلي إلى مسارات الثانوية والنصائح الذهبية قبل الاختبار.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {CATEGORIES.map((cat, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border ${cat.border} bg-gradient-to-br ${cat.color} p-7 flex flex-col gap-4 group hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${cat.icon_bg} shrink-0`}>
                    {cat.icon}
                  </div>
                  <span className="text-3xl font-extrabold text-muted-foreground/40">{cat.count}</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1 tracking-wide uppercase">{cat.titleEn}</div>
                  <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="outline" className="rounded-full px-8" asChild>
              <Link href="/register">تصفّح المكتبة كاملاً</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── SECTION B: محاكي المستقبل المهني ───────────────── */}
      <section id="promo-simulator" className="w-full py-20 bg-gradient-to-b from-primary/5 to-background border-y border-border/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Visual */}
            <div className="relative flex items-center justify-center order-2 md:order-1">
              <div className="relative h-64 w-64">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
                <div className="absolute inset-6 rounded-full bg-primary/15 flex items-center justify-center">
                  <div className="absolute inset-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center shadow-xl">
                      <Compass className="h-12 w-12 text-white" />
                    </div>
                  </div>
                </div>
                {/* orbit dots */}
                {["🎓","💼","🏆","⭐"].map((emoji, i) => (
                  <div
                    key={i}
                    className="absolute h-10 w-10 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-lg"
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
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-5">
                <Compass className="h-4 w-4" />
                مدعوم بالذكاء الاصطناعي
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                محاكي المستقبل المهني
              </h2>
              <p className="text-muted-foreground text-lg mb-7 leading-relaxed">
                لطلاب الثانوي والجامعة — أجب على 4 أسئلة وسيرسم لك نُور AI خارطة طريق مهنية كاملة مع توقعات مالية حقيقية ومراحل عملية واضحة.
              </p>
              <ul className="space-y-3 mb-8">
                {SIMULATOR_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {f.icon}
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>
              <Button className="rounded-full px-8 h-11" asChild>
                <Link href="/register">جرّب المحاكي مجاناً</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION C: نصائح ذهبية ──────────────────────────── */}
      <section id="promo-tips" className="w-full py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <Lightbulb className="h-4 w-4" />
              فئة عام
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              نصائح ذهبية لما قبل الاختبار
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              في فئة <strong>عام</strong> تجد محتوى يُعدّك نفسياً وذهنياً — ليس فقط دراسياً — لتدخل الامتحان بأعلى مستوى من الاستعداد.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {TIPS.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/70 dark:border-amber-800/40 rounded-2xl p-5"
              >
                <div className="h-7 w-7 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold text-sm mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed font-medium">{tip}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-8 text-center">
            <Lightbulb className="h-10 w-10 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">اشترك للوصول لكل نصائح الـ 18+ فيديو في فئة عام</h3>
            <p className="text-muted-foreground mb-5 text-sm">
              من إدارة الوقت داخل قاعة الاختبار، إلى تقنيات حل الأسئلة المُركّبة — كل شيء موثّق بفيديوهات قصيرة ومركّزة.
            </p>
            <Button className="rounded-full px-8" asChild>
              <Link href="/register">ابدأ التجربة المجانية</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────── */}
      <section id="promo-cta" className="w-full py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <CheckCircle2 className="h-4 w-4" />
            بدون التزام — إلغاء في أي وقت
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
            ابدأ اليوم — تجربة مجانية متاحة
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            انضم إلى آلاف الطلاب الذين يستخدمون نُور AI للاستعداد للقدرات والتحصيلي ومسارات الثانوية.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="rounded-full px-10 h-13 text-base font-semibold" asChild>
              <Link href="/register">
                إنشاء حساب مجاني <ArrowLeft className="ms-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-10 h-13 text-base border-white/30 text-primary-foreground hover:bg-white/10" asChild>
              <Link href="/subscribe">عرض الأسعار — 5$/شهر</Link>
            </Button>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
