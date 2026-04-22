import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Check, CreditCard, Bitcoin, Copy, ExternalLink, Loader2, Zap, AlertCircle } from "lucide-react";
import { useCreateSubscription } from "@workspace/api-client-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link } from "wouter";
import { useLang } from "@/lib/language";

type PayMethod = "crypto" | "card";

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { lang } = useLang();
  const subscribeMutation = useCreateSubscription();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [activeMethod, setActiveMethod] = useState<PayMethod>("crypto");
  const [copied, setCopied] = useState(false);

  if (user?.subscribed || user?.role === "admin") {
    return <Redirect to="/dashboard" />;
  }

  const handlePayment = (method: PayMethod) => {
    setActiveMethod(method);
    subscribeMutation.mutate(
      { data: { paymentMethod: method, currency: method === "crypto" ? "USDT" : "USD" } },
      {
        onSuccess: data => {
          if (data.paymentUrl && (method === "card" || data.invoiceUrl)) {
            window.open(data.paymentUrl, "_blank", "noopener,noreferrer");
            if (method === "card") return;
          }
          setPaymentInfo(data);
        },
        onError: (err: any) => {
          const errorMsg = err?.error || err?.message || (lang === "ar" ? "فشل تهيئة الدفع." : "Failed to initialize payment.");
          if (method === "card" && err?.configured === false) {
            toast({
              title: lang === "ar" ? "بطاقة الدفع غير متاحة بعد" : "Card payment not yet available",
              description: lang === "ar"
                ? "يرجى استخدام الكريبتو أو كود الترويج حالياً. سيتم تفعيل البطاقة قريباً."
                : "Please use Crypto or Promo Code for now. Card will be enabled soon.",
            });
          } else {
            toast({ title: lang === "ar" ? "خطأ" : "Error", description: errorMsg, variant: "destructive" });
          }
        },
      }
    );
  };

  const handleCopyAddress = async () => {
    const addr = paymentInfo?.paymentAddress;
    if (!addr) return;
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: lang === "ar" ? "تم نسخ العنوان ✓" : "Address copied ✓" });
  };


  const features = lang === "ar" ? [
    "جلسات معلم الذكاء الاصطناعي نُور بالأسلوب السقراطي",
    "نقاط تحقق ذكية تلقائية في كل درس",
    "وصول غير محدود لجميع الدروس",
    "محاكي المستقبل مع توقعات مالية",
    "تتبع التقدم والتحليلات",
  ] : [
    "Noor AI Socratic tutor sessions",
    "Smart auto-checkpoints in every lesson",
    "Unlimited access to all courses",
    "Future Simulator with financial projections",
    "Progress tracking & analytics",
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {lang === "ar" ? "استثمر في عقلك" : "Invest in your future"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {lang === "ar"
              ? "وصول غير محدود لمعلم الذكاء الاصطناعي وخرائط المسار المهني والتعلم بدون إعلانات."
              : "Unlimited access to the AI tutor, personalized roadmaps, and ad-free learning."}
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 items-start">
          {/* Plan features */}
          <Card className="md:col-span-2 border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">
                {lang === "ar" ? "الخطة المميزة" : "Premium Plan"}
              </CardTitle>
              <div className="mt-4 flex items-baseline text-4xl font-extrabold tracking-tight">
                $5
                <span className="ms-1 text-xl font-medium text-muted-foreground">
                  /{lang === "ar" ? "شهر" : "mo"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Payment options */}
          <Card className="md:col-span-3 shadow-sm">
            <CardHeader>
              <CardTitle>
                {lang === "ar" ? "اختر طريقة الدفع" : "Select Payment Method"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment method selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setActiveMethod("crypto"); setPaymentInfo(null); }}
                  className={`p-4 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-2 ${activeMethod === "crypto" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <Bitcoin className="h-6 w-6 text-orange-500" />
                  <span>{lang === "ar" ? "كريبتو (USDT TRC20)" : "Crypto (USDT TRC20)"}</span>
                </button>
                <button
                  onClick={() => { setActiveMethod("card"); setPaymentInfo(null); }}
                  className={`p-4 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-2 ${activeMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <CreditCard className="h-6 w-6 text-primary" />
                  <span>{lang === "ar" ? "بطاقة ائتمان" : "Credit Card"}</span>
                </button>
              </div>

              {/* Crypto Panel */}
              {activeMethod === "crypto" && !paymentInfo && (
                <div className="space-y-4">
                  <div className="bg-secondary/50 rounded-lg p-4 border text-sm text-muted-foreground flex gap-3 items-start">
                    <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p>
                      {lang === "ar"
                        ? "ادفع بأمان بـ USDT على شبكة Tron (TRC20) عبر NOWPayments. يتم التفعيل تلقائياً بعد التأكيد."
                        : "Pay securely with USDT on the Tron network (TRC20) via NOWPayments. Auto-activates after confirmation."}
                    </p>
                  </div>
                  <Button className="w-full h-12 text-base" onClick={() => handlePayment("crypto")} disabled={subscribeMutation.isPending}>
                    {subscribeMutation.isPending && activeMethod === "crypto"
                      ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{lang === "ar" ? "جاري التهيئة..." : "Initializing..."}</>
                      : <><Bitcoin className="h-5 w-5 me-2" />{lang === "ar" ? "الدفع بـ USDT TRC20" : "Pay with USDT TRC20"}</>}
                  </Button>
                </div>
              )}

              {/* Crypto Payment Info */}
              {activeMethod === "crypto" && paymentInfo && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-800 dark:text-green-300 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{lang === "ar" ? "سيتم تفعيل اشتراكك تلقائياً فور تأكيد المعاملة." : "Your subscription will activate automatically once the transaction is confirmed."}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-mono font-bold mb-1">{paymentInfo.amount} USDT</p>
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "شبكة Tron (TRC20)" : "Tron Network (TRC20)"}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4 border">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      {lang === "ar" ? "عنوان المحفظة (USDT TRC20)" : "Wallet Address (USDT TRC20)"}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono break-all flex-1 text-foreground">{paymentInfo.paymentAddress}</code>
                      <Button variant="outline" size="icon" onClick={handleCopyAddress} className="shrink-0 h-8 w-8">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {copied && <p className="text-xs text-green-600 mt-1">{lang === "ar" ? "تم النسخ ✓" : "Copied ✓"}</p>}
                  </div>
                  {paymentInfo.invoiceUrl && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={paymentInfo.invoiceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        {lang === "ar" ? "فتح صفحة الدفع الرسمية" : "Open Official Payment Page"}
                      </a>
                    </Button>
                  )}
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    {lang === "ar" ? "في انتظار تأكيد الشبكة..." : "Waiting for network confirmation..."}
                  </div>
                </div>
              )}

              {/* Card Payment Panel */}
              {activeMethod === "card" && (
                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center">
                    <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold mb-1 text-lg">
                      {lang === "ar" ? "دفع فوري بالبطاقة" : "Instant Card Payment"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {lang === "ar"
                        ? "ادفع بأمان عبر Lemon Squeezy. ستتم إعادة توجيهك لإكمال الدفع ويُفعَّل اشتراكك تلقائياً."
                        : "Pay securely via Lemon Squeezy. You'll be redirected to complete payment and your subscription activates automatically."}
                    </p>
                    <Button className="w-full h-12 text-base" onClick={() => handlePayment("card")} disabled={subscribeMutation.isPending}>
                      {subscribeMutation.isPending && activeMethod === "card"
                        ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{lang === "ar" ? "جاري الفتح..." : "Opening..."}</>
                        : <><CreditCard className="h-5 w-5 me-2" />{lang === "ar" ? "الدفع بالبطاقة — 5$/شهر" : "Pay with Card — $5/mo"}</>}
                    </Button>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      {lang === "ar"
                        ? "إذا لم تُفعَّل بعد 5 دقائق من الدفع، تواصل مع الدعم أو استخدم كود الترويج."
                        : "If not activated within 5 minutes of payment, contact support or use a promo code."}
                    </p>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
