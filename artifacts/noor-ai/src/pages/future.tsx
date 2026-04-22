import { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { useLang } from "@/lib/language";
import { useGenerateCareerRoadmap } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, GraduationCap, Briefcase, Trophy, Lock, Download, BanknoteIcon, TrendingUp } from "lucide-react";

const arabicInterests = [
  { value: "تكنولوجيا", label: "💻 التكنولوجيا والبرمجة" },
  { value: "ذكاء", label: "🤖 الذكاء الاصطناعي" },
  { value: "طب", label: "🏥 الطب والصحة" },
  { value: "رياضيات", label: "📐 الرياضيات والإحصاء" },
  { value: "علوم", label: "🔬 العلوم والبحث" },
  { value: "أعمال", label: "💼 الأعمال وريادة الأعمال" },
  { value: "تصميم", label: "🎨 التصميم والإبداع" },
  { value: "قانون", label: "⚖️ القانون والعدالة" },
  { value: "أخرى", label: "✏️ أخرى..." },
];

const englishInterests = [
  { value: "تكنولوجيا", label: "💻 Technology & Programming" },
  { value: "ذكاء", label: "🤖 Artificial Intelligence" },
  { value: "طب", label: "🏥 Medicine & Healthcare" },
  { value: "رياضيات", label: "📐 Math & Statistics" },
  { value: "علوم", label: "🔬 Science & Research" },
  { value: "أعمال", label: "💼 Business & Entrepreneurship" },
  { value: "تصميم", label: "🎨 Design & Creativity" },
  { value: "قانون", label: "⚖️ Law & Justice" },
  { value: "أخرى", label: "✏️ Other..." },
];

const gradeLevels = [
  { value: "الصف التاسع", label: "الصف التاسع (متوسط 3)" },
  { value: "الصف العاشر", label: "الصف العاشر (أول ثانوي)" },
  { value: "الصف الحادي عشر", label: "الصف الحادي عشر (ثاني ثانوي)" },
  { value: "الصف الثاني عشر", label: "الصف الثاني عشر (ثالث ثانوي)" },
  { value: "طالب جامعي", label: "طالب جامعي" },
  { value: "خريج", label: "خريج جامعي" },
];

const approxGrades = [
  { value: "ممتاز (90-100%)", label: "ممتاز (90-100%)" },
  { value: "جيد جداً (80-89%)", label: "جيد جداً (80-89%)" },
  { value: "جيد (70-79%)", label: "جيد (70-79%)" },
  { value: "مقبول (60-69%)", label: "مقبول (60-69%)" },
  { value: "أقل من المتوسط", label: "أقل من المتوسط" },
];

const livingStandards = [
  { value: "راحة مادية عالية جداً", label: "💎 راحة مادية عالية جداً" },
  { value: "حياة مريحة ومستقرة", label: "✅ حياة مريحة ومستقرة" },
  { value: "اكتفاء وأمان أساسي", label: "🏠 اكتفاء وأمان أساسي" },
  { value: "التركيز على التأثير لا المال", label: "🌱 التركيز على التأثير لا المال" },
];

const phaseIcons = [
  <GraduationCap key="g" className="h-6 w-6" />,
  <Sparkles key="s" className="h-6 w-6" />,
  <Briefcase key="b" className="h-6 w-6" />,
  <Trophy key="t" className="h-6 w-6" />,
];

const phaseColors = [
  "border-blue-400/50 bg-blue-50 dark:bg-blue-950/20",
  "border-violet-400/50 bg-violet-50 dark:bg-violet-950/20",
  "border-amber-400/50 bg-amber-50 dark:bg-amber-950/20",
  "border-green-400/50 bg-green-50 dark:bg-green-950/20",
];

const phaseAccents = [
  "bg-blue-500 text-white",
  "bg-violet-500 text-white",
  "bg-amber-500 text-white",
  "bg-green-500 text-white",
];

export default function FutureSimulator() {
  const { user } = useAuth();
  const { lang } = useLang();
  const isSubscribed = user?.subscribed || user?.role === "admin";
  const roadmapMutation = useGenerateCareerRoadmap();
  const [roadmap, setRoadmap] = useState<any>(null);

  const [selectedInterest, setSelectedInterest] = useState<string>("");
  const [customInterest, setCustomInterest] = useState<string>("");
  const [currentGrade, setCurrentGrade] = useState<string>("");
  const [approxGrade, setApproxGrade] = useState<string>("");
  const [livingStandard, setLivingStandard] = useState<string>("");
  const [goals, setGoals] = useState<string>("");

  const interests = lang === "ar" ? arabicInterests : englishInterests;

  const handleGenerate = () => {
    if (!selectedInterest || !currentGrade) return;
    const finalInterest = selectedInterest === "أخرى" ? (customInterest.trim() || "أخرى") : selectedInterest;
    const enrichedGoals = [
      goals,
      approxGrade ? `مستوى الدراسة: ${approxGrade}` : "",
      livingStandard ? `المستوى المعيشي المرغوب: ${livingStandard}` : "",
    ].filter(Boolean).join(". ");

    roadmapMutation.mutate(
      { data: { interests: [finalInterest], currentGrade, goals: enrichedGoals } },
      { onSuccess: (data) => setRoadmap(data) }
    );
  };

  const handlePrint = () => window.print();

  if (!isSubscribed) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-12">
            <Lock className="h-16 w-16 text-primary mx-auto mb-6 opacity-70" />
            <h1 className="text-3xl font-bold mb-4">
              {lang === "ar" ? "محاكي المستقبل" : "Future Simulator"}
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              {lang === "ar"
                ? "اكتشف مسارك المهني وتوقعات راتبك وخارطة طريقك نحو النجاح — حصرياً للمشتركين."
                : "Discover your career path, salary projections, and roadmap to success — subscribers only."}
            </p>
            <Button size="lg" asChild>
              <Link href="/subscribe">
                {lang === "ar" ? "اشترك وافتح المحاكي" : "Subscribe to Unlock"}
              </Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            {lang === "ar" ? "مدعوم بالذكاء الاصطناعي" : "Powered by AI"}
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            {lang === "ar" ? "محاكي المستقبل" : "Future Simulator"}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {lang === "ar"
              ? "أجب على أربعة أسئلة وسيرسم لك نُور AI خارطة طريق مخصصة لمستقبلك المهني مع توقعات مالية حقيقية."
              : "Answer four questions and NOOR AI will draw your personalized career roadmap with real financial projections."}
          </p>
        </div>

        {!roadmap ? (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>
                {lang === "ar" ? "أخبرنا عنك" : "Tell us about yourself"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-7">
              {/* Q1 — Interest */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  {lang === "ar" ? "١. ما المجال الذي يشعل شغفك؟" : "1. What field excites you most?"}
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {interests.map(interest => (
                    <button
                      key={interest.value}
                      onClick={() => setSelectedInterest(interest.value)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all text-center ${
                        selectedInterest === interest.value
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40 hover:bg-muted"
                      }`}
                    >
                      {interest.label}
                    </button>
                  ))}
                </div>
                {selectedInterest === "أخرى" && (
                  <Input
                    placeholder={lang === "ar" ? "اكتب مجالك المخصص هنا..." : "Type your custom field here..."}
                    value={customInterest}
                    onChange={e => setCustomInterest(e.target.value)}
                    className="mt-2 h-11"
                    autoFocus
                  />
                )}
              </div>

              {/* Q2 — Grade Level */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  {lang === "ar" ? "٢. ما مرحلتك الدراسية الحالية؟" : "2. What is your current academic level?"}
                </Label>
                <Select value={currentGrade} onValueChange={setCurrentGrade}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={lang === "ar" ? "اختر مرحلتك..." : "Select level..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map(g => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Q3 — Approximate Grades */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  {lang === "ar" ? "٣. كيف تصف مستوى درجاتك التقريبي؟" : "3. How would you describe your approximate grades?"}
                </Label>
                <Select value={approxGrade} onValueChange={setApproxGrade}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={lang === "ar" ? "اختر مستوى درجاتك..." : "Select grade level..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {approxGrades.map(g => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Q4 — Living Standard */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  {lang === "ar" ? "٤. ما المستوى المعيشي الذي تطمح إليه؟" : "4. What living standard do you aspire to?"}
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {livingStandards.map(ls => (
                    <button
                      key={ls.value}
                      onClick={() => setLivingStandard(ls.value)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all text-start ${
                        livingStandard === ls.value
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40 hover:bg-muted"
                      }`}
                    >
                      {ls.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Goals */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  {lang === "ar" ? "هل لديك هدف محدد؟ (اختياري)" : "Do you have a specific goal? (optional)"}
                </Label>
                <Textarea
                  placeholder={lang === "ar"
                    ? "مثال: أريد أن أكون مهندس ذكاء اصطناعي وأعمل في شركة عالمية بحلول 2030..."
                    : "E.g. I want to be an AI engineer working at a global company by 2030..."}
                  value={goals}
                  onChange={e => setGoals(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={!selectedInterest || !currentGrade || roadmapMutation.isPending}
              >
                {roadmapMutation.isPending ? (
                  <><Loader2 className="h-5 w-5 animate-spin me-2" />{lang === "ar" ? "نُور يحلل مسارك..." : "NOOR is analyzing..."}</>
                ) : (
                  <><Sparkles className="h-5 w-5 me-2" />{lang === "ar" ? "ارسم لي مستقبلي" : "Generate My Roadmap"}</>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Roadmap Header */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="text-5xl mb-4">✨</div>
                <h2 className="text-3xl font-extrabold tracking-tight mb-3">{roadmap.title}</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">{roadmap.summary}</p>
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  {roadmap.topCareers?.map((career: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-sm px-3 py-1">{career}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Financial Projection */}
            {roadmap.financialProjection && (
              <Card className="border-green-500/30 bg-green-50 dark:bg-green-950/20 shadow-sm">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                  <div className="bg-green-500 text-white rounded-full p-4 shrink-0">
                    <BanknoteIcon className="h-8 w-8" />
                  </div>
                  <div className="text-center sm:text-start flex-1">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                      {lang === "ar" ? "التوقع المالي خلال 5 سنوات" : "Financial Projection in 5 Years"}
                    </p>
                    <p className="text-2xl font-extrabold text-green-900 dark:text-green-200 mb-1">
                      {roadmap.financialProjection.estimatedSalary}
                    </p>
                    <p className="text-base font-semibold text-green-800 dark:text-green-300">
                      {roadmap.financialProjection.jobTitle}
                    </p>
                  </div>
                  <TrendingUp className="h-12 w-12 text-green-400 shrink-0" />
                </CardContent>
              </Card>
            )}

            {/* 4-Stage Visual Roadmap */}
            <div>
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {lang === "ar" ? "خارطة الطريق المرحلية" : "Phased Roadmap"}
              </h3>
              <div className="space-y-5">
                {roadmap.steps?.map((step: any, i: number) => (
                  <Card key={i} className={`border-2 ${phaseColors[i] || ""} shadow-sm`}>
                    <CardContent className="p-5 sm:p-6 flex gap-4 sm:gap-6">
                      <div className={`${phaseAccents[i] || ""} rounded-full h-12 w-12 flex items-center justify-center shrink-0 shadow`}>
                        {phaseIcons[i]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h4 className="font-bold text-lg">{step.title}</h4>
                          <Badge variant="outline" className="text-xs">{step.duration}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{step.description}</p>
                        <ul className="space-y-2">
                          {step.milestones?.map((m: string, j: number) => (
                            <li key={j} className="flex items-start gap-2 text-sm">
                              <span className={`rounded-full h-5 w-5 flex items-center justify-center text-xs shrink-0 mt-0.5 ${phaseAccents[i] || ""}`}>
                                {j + 1}
                              </span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recommended Subjects */}
            {roadmap.recommendedSubjects?.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {lang === "ar" ? "📚 المواد المُوصى بها" : "📚 Recommended Subjects"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {roadmap.recommendedSubjects.map((s: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-sm px-3 py-1.5">{s}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pb-8">
              <Button variant="outline" onClick={() => setRoadmap(null)} className="flex-1">
                {lang === "ar" ? "↩ جرب مساراً آخر" : "↩ Try another path"}
              </Button>
              <Button onClick={handlePrint} className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                {lang === "ar" ? "حفظ / طباعة الخارطة" : "Save / Print Roadmap"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
