import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, ArrowRight, Brain, Compass, Lock, PlayCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/language";

export default function Home() {
  const { lang } = useLang();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  const ArrowIcon = lang === "ar" ? ArrowLeft : ArrowRight;

  const content = {
    ar: {
      badge: "الأكاديمية الخاصة في السحابة",
      hero: <>أتقن أي مادة بـ <span className="text-primary">ذكاء اصطناعي موجَّه</span></>,
      heroDesc: "نُور AI تجمع بين تعلم الفيديو العالمي المستوى ومدرس ذكاء اصطناعي نشط يضمن الفهم الحقيقي. شكّل مستقبلك بخرائط مسيرة مهنية مخصصة.",
      cta: "ابدأ التعلم الآن",
      install: "تثبيت التطبيق",
      featuresTitle: "مدروس. دقيق. فعّال.",
      featuresDesc: "نحوّل المشاهدة السلبية إلى فهم حقيقي.",
      f1Title: "توقف ذكي",
      f1Desc: "تتوقف الفيديوهات عند نقاط تحقق محورية. يطرح عليك المدرس الذكي أسئلة للتحقق من الفهم قبل المتابعة.",
      f2Title: "محاكي المستقبل",
      f2Desc: "أدخل اهتماماتك ودرجاتك وأهدافك، وسنولّد خريطة مسيرة مهنية مرئية بخطوات عملية واضحة.",
      f3Title: "الطريقة السقراطية",
      f3Desc: "الذكاء الاصطناعي لا يعطيك الإجابة مباشرة، بل يقودك إليها عبر حوار يحاكي أفضل المعلمين الخاصين.",
      pricingTitle: "استثمر في مستقبلك",
      pricingDesc: "وصول كامل للمكتبة، تدريس لا محدود بالذكاء الاصطناعي، وخرائط مسيرة مهنية غير محدودة — بأقل من تكلفة قهوة.",
      price: "5$",
      perMonth: "/ شهر",
      f_unlimited: "تدريس غير محدود بالذكاء الاصطناعي",
      f_checkpoints: "نقاط تحقق ذكية في الفيديو",
      f_roadmap: "مولّد خريطة المسيرة المهنية",
      f_pay: "دفع بالبطاقة أو العملات المشفرة",
      startTrial: "ابدأ التجربة المجانية",
      privacyTitle: "الخصوصية أولاً",
      privacyDesc: "بياناتك التعليمية ملكك. تعتمد نُور AI على المعالجة المحلية قدر الإمكان. أهدافك المهنية وتقدمك الشخصي محمي ولن يُباع أبداً.",
    },
    en: {
      badge: "The Private Academy in the Cloud",
      hero: <>Master any subject with <span className="text-primary">guided intelligence</span></>,
      heroDesc: "NOOR AI combines world-class video learning with an active AI tutor that ensures comprehension. Shape your future with personalized career roadmaps and guided study.",
      cta: "Start Learning Now",
      install: "Install App",
      featuresTitle: "Thoughtful. Precise. Effective.",
      featuresDesc: "We replace passive watching with active understanding.",
      f1Title: "Smart Interruption",
      f1Desc: "Videos pause at critical checkpoints. Our AI tutor asks comprehension questions before you can proceed, ensuring you actually understand the material.",
      f2Title: "Future Simulator",
      f2Desc: "Input your interests, grades, and goals. We generate a visual career roadmap with actionable milestones to get you from where you are to where you want to be.",
      f3Title: "Socratic Method",
      f3Desc: "The AI doesn't just give you the answer. It guides you to find it yourself through dialogue, mimicking the world's best private tutors.",
      pricingTitle: "Invest in your future",
      pricingDesc: "Access to the complete library, unlimited AI tutoring, and unlimited career roadmaps for less than the cost of a coffee.",
      price: "$5",
      perMonth: "/ month",
      f_unlimited: "Unlimited AI tutoring",
      f_checkpoints: "Smart video checkpoints",
      f_roadmap: "Career roadmap generator",
      f_pay: "Pay with Card or Crypto",
      startTrial: "Start Free Trial",
      privacyTitle: "Privacy First",
      privacyDesc: "We believe your educational data belongs to you. NOOR AI employs local processing where possible to minimize data transmission. Your career goals and personal progress are secured and never sold.",
    }
  };

  const c = content[lang];

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background border-b border-border/50">
        <div className="container px-4 md:px-6 mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary mb-8 gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary"></span>
            {c.badge}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
            {c.hero}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            {c.heroDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 w-full sm:w-auto text-base" asChild>
              <Link href="/register">
                {c.cta} <ArrowIcon className="ms-2 h-4 w-4" />
              </Link>
            </Button>
            {deferredPrompt && (
              <Button size="lg" variant="outline" className="h-12 px-8 w-full sm:w-auto text-base" onClick={handleInstallClick}>
                {c.install}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20 bg-background">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">{c.featuresTitle}</h2>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">{c.featuresDesc}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <PlayCircle className="h-7 w-7" />, title: c.f1Title, desc: c.f1Desc },
              { icon: <Compass className="h-7 w-7" />, title: c.f2Title, desc: c.f2Desc },
              { icon: <Brain className="h-7 w-7" />, title: c.f3Title, desc: c.f3Desc },
            ].map((feature, i) => (
              <div key={i} className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
                <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing & Privacy */}
      <section className="w-full py-20 bg-secondary">
        <div className="container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">{c.pricingTitle}</h2>
              <p className="text-lg text-muted-foreground mb-8">{c.pricingDesc}</p>
              <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold tracking-tight">{c.price}</span>
                  <span className="text-muted-foreground font-medium">{c.perMonth}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {[c.f_unlimited, c.f_checkpoints, c.f_roadmap, c.f_pay].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full h-12" asChild>
                  <Link href="/register">{c.startTrial}</Link>
                </Button>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-background p-8 rounded-2xl border border-border">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <Lock className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{c.privacyTitle}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">{c.privacyDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
