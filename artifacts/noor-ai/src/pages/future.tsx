import { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { useLang } from "@/lib/language";
import { useGenerateCareerRoadmap } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, ArrowRight, Compass, CheckCircle2, ChevronRight, Briefcase, Lock } from "lucide-react";

function FuturePaywall({ lang }: { lang: string }) {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-20 max-w-xl text-center">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
          <Lock className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          {lang === "ar" ? "محاكي المستقبل" : "Future Simulator"}
        </h1>
        <p className="text-muted-foreground mb-2 text-lg">
          {lang === "ar" ? "ميزة مميزة حصرية للمشتركين" : "Premium Feature — Subscribers Only"}
        </p>
        <p className="text-muted-foreground mb-8 text-sm">
          {lang === "ar"
            ? "اشترك بـ 5 دولار شهرياً فقط للوصول إلى محاكي المستقبل ومعلم الذكاء الاصطناعي وجميع مميزات المنصة."
            : "Subscribe for just $5/month to access the Future Simulator, AI Tutor, and all platform features."}
        </p>
        <Button size="lg" asChild className="px-10">
          <Link href="/subscribe">
            {lang === "ar" ? "اشترك الآن بـ 5$/شهر" : "Subscribe Now — $5/month"}
          </Link>
        </Button>
        <div className="mt-6">
          <Button variant="ghost" asChild>
            <Link href="/videos">
              {lang === "ar" ? "تصفح الدروس المجانية" : "Browse Free Lessons"}
            </Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

export default function FutureSimulator() {
  const { user } = useAuth();
  const { lang } = useLang();
  const isSubscribed = user?.subscribed || user?.role === "admin";

  const [step, setStep] = useState(1);
  const [interests, setInterests] = useState("");
  const [grade, setGrade] = useState("");
  const [goals, setGoals] = useState("");

  const generateRoadmap = useGenerateCareerRoadmap();
  const roadmap = generateRoadmap.data;

  if (!isSubscribed) {
    return <FuturePaywall lang={lang} />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      const interestsArray = interests.split(",").map(i => i.trim()).filter(i => i);
      generateRoadmap.mutate({ data: { interests: interestsArray, currentGrade: grade, goals } });
    }
  };

  const isFormComplete = () => {
    if (step === 1) return interests.trim().length > 0;
    if (step === 2) return grade !== "";
    if (step === 3) return goals.trim().length > 0;
    return false;
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">

        {!roadmap && !generateRoadmap.isPending && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                <Compass className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-4">
                {lang === "ar" ? "محاكي المستقبل" : "Future Simulator"}
              </h1>
              <p className="text-xl text-muted-foreground">
                {lang === "ar"
                  ? "أخبرنا باهتماماتك وسنضع لك خارطة طريق دقيقة لتحقيق أهدافك."
                  : "Tell us what you care about. We'll generate a precise roadmap to get you there."}
              </p>
            </div>

            <Card className="border shadow-lg shadow-primary/5">
              <div className="h-2 w-full bg-secondary flex">
                <div className="h-full bg-primary transition-all duration-500 ease-in-out" style={{ width: `${(step / 3) * 100}%` }} />
              </div>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit}>
                  {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-semibold tracking-tight">
                          {lang === "ar" ? "ما الذي يثير اهتمامك؟" : "What are you interested in?"}
                        </h2>
                        <p className="text-muted-foreground">
                          {lang === "ar" ? "أدخل مواضيع أو هوايات أو مجالات تستمتع بها." : "Enter topics, hobbies, or fields you enjoy."}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="interests">
                          {lang === "ar" ? "الاهتمامات (مفصولة بفواصل)" : "Interests (comma separated)"}
                        </Label>
                        <Input
                          id="interests"
                          placeholder={lang === "ar" ? "مثال: الذكاء الاصطناعي، الفضاء، ريادة الأعمال" : "e.g. artificial intelligence, space, business"}
                          value={interests}
                          onChange={(e) => setInterests(e.target.value)}
                          autoFocus
                          className="h-12 text-lg"
                        />
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-semibold tracking-tight">
                          {lang === "ar" ? "من أين تبدأ؟" : "Where are you starting from?"}
                        </h2>
                        <p className="text-muted-foreground">
                          {lang === "ar" ? "حدد مرحلتك الدراسية الحالية." : "Select your current educational stage."}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Label>{lang === "ar" ? "المرحلة الدراسية" : "Current Grade / Level"}</Label>
                        <Select value={grade} onValueChange={setGrade}>
                          <SelectTrigger className="h-12 text-lg">
                            <SelectValue placeholder={lang === "ar" ? "اختر المرحلة" : "Select your grade"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Middle School">{lang === "ar" ? "المتوسطة" : "Middle School"}</SelectItem>
                            <SelectItem value="High School Freshman">{lang === "ar" ? "الأول ثانوي" : "High School Freshman"}</SelectItem>
                            <SelectItem value="High School Sophomore">{lang === "ar" ? "الثاني ثانوي" : "High School Sophomore"}</SelectItem>
                            <SelectItem value="High School Junior">{lang === "ar" ? "الثالث ثانوي" : "High School Junior"}</SelectItem>
                            <SelectItem value="High School Senior">{lang === "ar" ? "الصف الأخير" : "High School Senior"}</SelectItem>
                            <SelectItem value="College Freshman">{lang === "ar" ? "أولى جامعة" : "College Freshman"}</SelectItem>
                            <SelectItem value="College/University">{lang === "ar" ? "الجامعة" : "College/University"}</SelectItem>
                            <SelectItem value="Post-grad/Professional">{lang === "ar" ? "دراسات عليا / محترف" : "Professional / Post-grad"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-semibold tracking-tight">
                          {lang === "ar" ? "ما هو حلمك؟" : "What's the dream?"}
                        </h2>
                        <p className="text-muted-foreground">
                          {lang === "ar" ? "صف هدفك النهائي، حتى لو كان غير واضح تماماً." : "Describe your ultimate goal, even if it's vague."}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="goals">{lang === "ar" ? "أهدافك" : "Your Goals"}</Label>
                        <Textarea
                          id="goals"
                          placeholder={lang === "ar"
                            ? "أريد بناء روبوتات تساعد الناس، أو ربما بدء شركة تقنية..."
                            : "I want to build robots that help people, or maybe start my own tech company..."}
                          value={goals}
                          onChange={(e) => setGoals(e.target.value)}
                          className="min-h-[120px] resize-none text-base p-4"
                          autoFocus
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-10 pt-6 border-t">
                    {step > 1 ? (
                      <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                        {lang === "ar" ? "رجوع" : "Back"}
                      </Button>
                    ) : <div></div>}
                    <Button type="submit" size="lg" disabled={!isFormComplete()} className="px-8">
                      {step < 3 ? (
                        <>{lang === "ar" ? "التالي" : "Next"} <ArrowRight className="ms-2 h-4 w-4" /></>
                      ) : (
                        <>{lang === "ar" ? "توليد خارطة الطريق" : "Generate Roadmap"} <Brain className="ms-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {generateRoadmap.isPending && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
              <Brain className="h-16 w-16 text-primary relative animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                {lang === "ar" ? "جارٍ تحليل مستقبلك..." : "Synthesizing Your Future"}
              </h2>
              <p className="text-muted-foreground mt-2">
                {lang === "ar" ? "تحليل ملايين المسارات المهنية..." : "Analyzing billions of career pathways..."}
              </p>
            </div>
          </div>
        )}

        {roadmap && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight mb-4">{roadmap.title}</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{roadmap.summary}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <Card className="md:col-span-2 border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Compass className="h-5 w-5 text-primary" />
                    {lang === "ar" ? "خارطة الطريق الكاملة" : "The Master Plan"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative space-y-0 pl-4 before:absolute before:inset-y-0 before:left-6 before:w-0.5 before:bg-border">
                    {roadmap.steps.map((step, idx) => (
                      <div key={idx} className="relative pl-8 pb-10 last:pb-0">
                        <div className="absolute left-[-11px] top-1 h-6 w-6 rounded-full border-4 border-background bg-primary" />
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-2">
                          <h3 className="text-xl font-semibold tracking-tight">{step.title}</h3>
                          <span className="text-sm font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md w-fit">
                            {lang === "ar" ? "المرحلة" : "Phase"} {step.phase} • {step.duration}
                          </span>
                        </div>
                        <p className="text-muted-foreground mb-4">{step.description}</p>
                        <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            {lang === "ar" ? "الإنجازات الرئيسية" : "Key Milestones"}
                          </h4>
                          <ul className="space-y-2">
                            {step.milestones.map((milestone, mIdx) => (
                              <li key={mIdx} className="text-sm flex items-start gap-2">
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <span>{milestone}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      {lang === "ar" ? "المسارات المهنية" : "Target Careers"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {roadmap.topCareers.map((career, idx) => (
                        <li key={idx} className="flex items-center justify-between p-3 bg-secondary rounded-lg text-sm font-medium">
                          {career}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm bg-primary/5 border-primary/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      {lang === "ar" ? "المواد الموصى بها" : "Focus Subjects"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {roadmap.recommendedSubjects.map((subject, idx) => (
                        <span key={idx} className="bg-background border px-3 py-1.5 rounded-md text-sm font-medium shadow-sm">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="pt-4 flex gap-4">
                  <Button variant="outline" className="w-full" onClick={() => window.print()}>
                    {lang === "ar" ? "تصدير PDF" : "Export PDF"}
                  </Button>
                  <Button className="w-full" onClick={() => window.location.href = "/videos"}>
                    {lang === "ar" ? "ابدأ التعلم" : "Start Learning"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
