import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Check, CreditCard, Bitcoin, Copy, ExternalLink, Tag, Loader2 } from "lucide-react";
import { useCreateSubscription } from "@workspace/api-client-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { Redirect, Link } from "wouter";
import { useLang } from "@/lib/language";
import { apiClient } from "@/lib/api";

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { lang } = useLang();
  const subscribeMutation = useCreateSubscription();
  const queryClient = useQueryClient();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (user?.subscribed || user?.role === "admin") {
    return <Redirect to="/dashboard" />;
  }

  const handleCryptoPayment = () => {
    subscribeMutation.mutate(
      { data: { paymentMethod: "crypto", currency: "USDT" } },
      {
        onSuccess: (data) => setPaymentInfo(data),
        onError: (err: any) => {
          toast({
            title: lang === "ar" ? "خطأ" : "Error",
            description: err.error || (lang === "ar" ? "فشل تهيئة الدفع." : "Failed to initialize payment."),
            variant: "destructive",
          });
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

  const handlePromoCode = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await apiClient.post("/subscription/promo", { code: promoCode.trim() });
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({
          title: lang === "ar" ? "🎉 تم تفعيل اشتراكك!" : "🎉 Subscription activated!",
          description: lang === "ar" ? "مرحباً في نُور AI Premium!" : "Welcome to NOOR AI Premium!",
        });
      } else {
        const data = await res.json();
        toast({
          title: lang === "ar" ? "كود غير صالح" : "Invalid code",
          description: data.error || (lang === "ar" ? "تحقق من الكود وحاول مجدداً." : "Check the code and try again."),
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: lang === "ar" ? "خطأ في الاتصال" : "Connection error", variant: "destructive" });
    }
    setPromoLoading(false);
  };

  const features = lang === "ar" ? [
    "جلسات تدريس ذكي بالذكاء الاصطناعي غير محدودة",
    "نقاط تحقق ذكية للفيديو",
    "خرائط مسار مهني غير محدودة",
    "تتبع التقدم والتحليلات",
    "دعم أولوي مخصص",
  ] : [
    "Unlimited AI tutoring sessions",
    "Smart video checkpoints",
    "Unlimited career roadmaps",
    "Progress tracking & analytics",
    "Priority support",
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {lang === "ar" ? "استثمر في عقلك" : "Invest in your intelligence"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {lang === "ar"
              ? "وصول غير محدود للمعلم الذكي وخرائط المسار المهني والتعلم بدون إعلانات."
              : "Get unlimited access to the AI tutor, personalized roadmaps, and ad-free learning."}
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 items-start">
          {/* Plan Card */}
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
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Payment Card */}
          <Card className="md:col-span-3 border shadow-sm">
            <CardHeader>
              <CardTitle>
                {lang === "ar" ? "اختر طريقة الدفع" : "Select Payment Method"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentInfo ? (
                <div className="space-y-5 animate-in fade-in">
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-800 dark:text-green-300 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      {lang === "ar"
                        ? "سيتم تفعيل اشتراكك تلقائياً فور تأكيد المعاملة على الشبكة."
                        : "Your subscription will activate automatically once the transaction is confirmed."}
                    </span>
                  </div>

                  <div className="text-center">
                    <p className="text-3xl font-mono font-bold mb-1">{paymentInfo.amount} USDT</p>
                    <p className="text-sm text-muted-foreground">
                      {lang === "ar" ? "أرسل بالضبط هذا المبلغ إلى العنوان أدناه" : "Send exactly this amount to the address below"}
                    </p>
                  </div>

                  <div className="bg-muted rounded-lg p-4 border">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      {lang === "ar" ? "عنوان المحفظة (USDT ERC20)" : "Wallet Address (USDT ERC20)"}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono break-all flex-1 text-foreground">
                        {paymentInfo.paymentAddress}
                      </code>
                      <Button variant="outline" size="icon" onClick={handleCopyAddress} className="shrink-0">
                        <Copy className="h-4 w-4" />
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
              ) : (
                <Tabs defaultValue="crypto" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="crypto" className="flex gap-2">
                      <Bitcoin className="h-4 w-4" />
                      {lang === "ar" ? "كريبتو" : "Crypto"}
                    </TabsTrigger>
                    <TabsTrigger value="card" className="flex gap-2">
                      <CreditCard className="h-4 w-4" />
                      {lang === "ar" ? "بطاقة" : "Card"}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="crypto" className="space-y-4">
                    <div className="bg-secondary/50 rounded-lg p-4 border text-sm text-muted-foreground flex gap-3 items-start">
                      <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <p>
                        {lang === "ar"
                          ? "ادفع بأمان بـ USDT عبر NOWPayments. سيتم تفعيل اشتراكك تلقائياً بعد تأكيد المعاملة."
                          : "Pay securely with USDT via NOWPayments. Your subscription will activate automatically once confirmed."}
                      </p>
                    </div>
                    <Button className="w-full h-12 text-base" onClick={handleCryptoPayment} disabled={subscribeMutation.isPending}>
                      {subscribeMutation.isPending
                        ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{lang === "ar" ? "جاري التهيئة..." : "Initializing..."}</>
                        : (lang === "ar" ? "الدفع بالعملات المشفرة" : "Pay with Crypto")}
                    </Button>
                  </TabsContent>

                  <TabsContent value="card" className="space-y-4">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-center">
                      <CreditCard className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="font-semibold mb-1">
                        {lang === "ar" ? "بطاقة الائتمان / مدى" : "Credit / Debit Card"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {lang === "ar"
                          ? "قريباً — نعمل على دمج بوابة البطاقة. في الوقت الحالي استخدم الكريبتو أو كود الترويج."
                          : "Coming soon — card gateway is being integrated. Use Crypto or Promo Code for now."}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {/* Promo Code Section */}
              <div className="border-t pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {lang === "ar" ? "لديك كود ترويجي؟" : "Have a promo code?"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={lang === "ar" ? "أدخل الكود هنا" : "Enter code here"}
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                    dir="ltr"
                    className="font-mono uppercase"
                    onKeyDown={e => e.key === "Enter" && handlePromoCode()}
                  />
                  <Button variant="outline" onClick={handlePromoCode} disabled={promoLoading || !promoCode.trim()}>
                    {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (lang === "ar" ? "تفعيل" : "Apply")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
