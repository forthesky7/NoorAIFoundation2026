import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Users, Crown, Check, Sparkles, Gift, TrendingUp, Zap } from "lucide-react";
import { useLang } from "@/lib/language";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const PLATFORMS = [
  { value: "tiktok", label: "TikTok" },
  { value: "snapchat", label: "Snapchat" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "X / Twitter" },
  { value: "other", label: "أخرى / Other" },
];

const perks = [
  { icon: <Crown className="h-5 w-5 text-yellow-500" />, ar: "اشتراك VIP مجاني مدى الحياة", en: "Free lifetime VIP subscription" },
  { icon: <Gift className="h-5 w-5 text-pink-500" />, ar: "كود خاص 30% خصم لجمهورك", en: "Exclusive 30% discount code for your audience" },
  { icon: <TrendingUp className="h-5 w-5 text-green-500" />, ar: "عمولة 15% عن كل اشتراك من كودك", en: "15% commission on every subscription via your code" },
  { icon: <Zap className="h-5 w-5 text-blue-500" />, ar: "شهادة شراكة رسمية من نُور AI", en: "Official Noor AI partnership certificate" },
];

export default function Influencers() {
  const { lang } = useLang();
  const { toast } = useToast();
  const isAr = lang === "ar";

  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [handle, setHandle] = useState("");
  const [followers, setFollowers] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const f = parseInt(followers);
    if (!name || !platform || !handle || !email || isNaN(f)) {
      toast({ title: isAr ? "يرجى تعبئة جميع الحقول" : "Please fill all fields", variant: "destructive" });
      return;
    }
    if (f < 5000) {
      toast({ title: isAr ? "يجب أن يكون لديك 5000 متابع على الأقل" : "You need at least 5000 followers", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post("/influencer/apply", { name, platform, followers: f, handle, email, message });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const err = await res.json();
        toast({ title: err.error || (isAr ? "حدث خطأ" : "Something went wrong"), variant: "destructive" });
      }
    } catch {
      toast({ title: isAr ? "خطأ في الاتصال" : "Connection error", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Star className="h-4 w-4" />
            {isAr ? "برنامج المؤثرين" : "Influencer Program"}
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {isAr ? "اشترك كمؤثر VIP في نُور AI" : "Join Noor AI as a VIP Influencer"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {isAr
              ? "إذا كان لديك +5000 متابع وتهتم بالتعليم والمحتوى الهادف، انضم لعائلة نُور AI كشريك رسمي."
              : "If you have +5000 followers and care about education & meaningful content, join Noor AI as an official partner."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* Perks */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-5">
              <Gift className="h-5 w-5 text-primary" />
              {isAr ? "ما الذي تحصل عليه؟" : "What you get"}
            </h2>
            {perks.map((perk, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl border bg-card shadow-sm">
                <div className="shrink-0 mt-0.5">{perk.icon}</div>
                <p className="text-sm font-medium">{isAr ? perk.ar : perk.en}</p>
              </div>
            ))}
            <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground bg-muted/50 rounded-xl p-4">
              <Users className="h-5 w-5 shrink-0" />
              <span>{isAr ? "يشترط الحد الأدنى 5000 متابع على أي منصة" : "Minimum 5000 followers on any platform required"}</span>
            </div>
          </div>

          {/* Form */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {isAr ? "تقديم الطلب" : "Apply Now"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold">{isAr ? "تم إرسال طلبك! 🎉" : "Request Sent! 🎉"}</h3>
                  <p className="text-muted-foreground text-sm">
                    {isAr
                      ? "سيراجع فريقنا طلبك ويتواصل معك خلال 48 ساعة على بريدك الإلكتروني."
                      : "Our team will review your application and reach out within 48 hours via email."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>{isAr ? "الاسم الكامل" : "Full Name"}</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder={isAr ? "محمد العلي" : "John Doe"} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{isAr ? "المنصة الرئيسية" : "Main Platform"}</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder={isAr ? "اختر المنصة" : "Select platform"} />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{isAr ? "اسم المستخدم / الحساب" : "Username / Handle"}</Label>
                    <Input value={handle} onChange={e => setHandle(e.target.value)} placeholder="@your_handle" dir="ltr" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{isAr ? "عدد المتابعين" : "Followers Count"}</Label>
                    <Input
                      type="number"
                      min="5000"
                      value={followers}
                      onChange={e => setFollowers(e.target.value)}
                      placeholder="5000"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" dir="ltr" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{isAr ? "رسالة إضافية (اختياري)" : "Additional Message (optional)"}</Label>
                    <Textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder={isAr ? "أخبرنا عن محتواك وكيف تخطط للترويج لنُور AI..." : "Tell us about your content and how you plan to promote Noor AI..."}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading
                      ? (isAr ? "جارٍ الإرسال..." : "Sending...")
                      : (isAr ? "إرسال الطلب ✨" : "Submit Application ✨")}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
