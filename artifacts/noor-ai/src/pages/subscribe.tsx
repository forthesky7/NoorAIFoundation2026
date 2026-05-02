import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldCheck, Check, CreditCard, Bitcoin, Copy, Loader2, Zap, AlertCircle, CheckCircle2, Network, Users, Gift, Tag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCreateSubscription } from "@workspace/api-client-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useLang } from "@/lib/language";
import { apiClient } from "@/lib/api";

type PayMethod = "crypto" | "card";
type CryptoNetwork = "trc20" | "polygon";

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { lang } = useLang();
  const subscribeMutation = useCreateSubscription();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMethod, setActiveMethod] = useState<PayMethod>("crypto");
  const [cryptoNetwork, setCryptoNetwork] = useState<CryptoNetwork>("trc20");
  const [copied, setCopied] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<null | "valid" | "invalid" | "loading">(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponStatus("loading");
    try {
      const res = await apiClient.post("/coupons/validate", { code: couponCode.trim() });
      const data = await res.json();
      if (res.ok && data.valid) {
        setCouponStatus("valid");
        setCouponDiscount(data.discountPercent || 0);
        toast({ title: lang === "ar" ? "كود صالح! ✓" : "Valid coupon! ✓", description: data.message });
      } else {
        setCouponStatus("invalid");
        setCouponDiscount(0);
        toast({ title: data.error || (lang === "ar" ? "كود غير صالح" : "Invalid coupon"), variant: "destructive" });
      }
    } catch {
      setCouponStatus("invalid");
    }
  };

  if (user?.subscribed || user?.role === "admin") {
    return <Redirect to="/dashboard" />;
  }

  const handlePayment = (method: PayMethod) => {
    setActiveMethod(method);
    // For crypto: call API with selected network
    apiClient.post("/subscription/create", {
      paymentMethod: method,
      currency: method === "crypto" ? "USDT" : "USD",
      network: method === "crypto" ? cryptoNetwork : undefined,
    }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw data;
      if (method === "card") {
        if (data.paymentUrl) window.open(data.paymentUrl, "_blank", "noopener,noreferrer");
        return;
      }
      setPaymentInfo({ ...data, networkKey: cryptoNetwork });
      setModalOpen(true);
    }).catch((err: any) => {
      if (method === "card" && err?.configured === false) {
        toast({
          title: lang === "ar" ? "الدفع بالبطاقة" : "Card Payment",
          description: err?.error || "ستتوفر قريباً",
        });
      } else {
        toast({
          title: lang === "ar" ? "خطأ" : "Error",
          description: err?.error || err?.message || (lang === "ar" ? "فشل تهيئة الدفع." : "Failed to initialize payment."),
          variant: "destructive",
        });
      }
    });
  };

  const handleCopyAddress = async () => {
    const addr = paymentInfo?.paymentAddress;
    if (!addr) return;
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
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

  const networkLabel = (n: CryptoNetwork) => n === "trc20"
    ? (lang === "ar" ? "Tron (TRC20)" : "Tron (TRC20)")
    : (lang === "ar" ? "شبكة Polygon" : "Polygon Network");

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
              {/* Coupon Code Field */}
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  {lang === "ar" ? "لديك كود خصم أو كود إحالة؟" : "Have a discount or referral code?"}
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder={lang === "ar" ? "أدخل الكود هنا" : "Enter code here"}
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponStatus(null); setCouponDiscount(0); }}
                      dir="ltr"
                      className={`font-mono pr-8 ${couponStatus === "valid" ? "border-green-500 bg-green-50 dark:bg-green-950/20" : couponStatus === "invalid" ? "border-red-400" : ""}`}
                      onKeyDown={e => e.key === "Enter" && handleValidateCoupon()}
                    />
                    {couponStatus === "valid" && (
                      <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                    {couponStatus === "invalid" && (
                      <X className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleValidateCoupon}
                    disabled={!couponCode.trim() || couponStatus === "loading" || couponStatus === "valid"}
                    className="shrink-0"
                  >
                    {couponStatus === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : (lang === "ar" ? "تحقق" : "Apply")}
                  </Button>
                </div>
                {couponStatus === "valid" && couponDiscount > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5" />
                    {lang === "ar" ? `🎉 خصم ${couponDiscount}% مطبّق على اشتراكك التالي!` : `🎉 ${couponDiscount}% discount applied to your subscription!`}
                  </p>
                )}
              </div>

              {/* Method selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveMethod("crypto")}
                  className={`p-4 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-2 ${activeMethod === "crypto" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <Bitcoin className="h-6 w-6 text-orange-500" />
                  <span>{lang === "ar" ? "كريبتو (USDT)" : "Crypto (USDT)"}</span>
                </button>
                <button
                  onClick={() => setActiveMethod("card")}
                  className={`p-4 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-2 ${activeMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <CreditCard className="h-6 w-6 text-primary" />
                  <span>{lang === "ar" ? "بطاقة ائتمان" : "Credit Card"}</span>
                </button>
              </div>

              {/* Crypto Panel */}
              {activeMethod === "crypto" && (
                <div className="space-y-4">
                  {/* Network selector */}
                  <div>
                    <p className="text-sm font-medium mb-2">
                      {lang === "ar" ? "اختر الشبكة:" : "Select network:"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["trc20", "polygon"] as CryptoNetwork[]).map(n => (
                        <button
                          key={n}
                          onClick={() => setCryptoNetwork(n)}
                          className={`p-3 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${cryptoNetwork === n ? "border-primary bg-primary/8 text-primary" : "border-border hover:border-primary/40"}`}
                        >
                          <Network className="h-3.5 w-3.5 shrink-0" />
                          {networkLabel(n)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-4 border text-sm text-muted-foreground flex gap-3 items-start">
                    <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p>
                      {lang === "ar"
                        ? `ادفع بأمان بـ USDT على شبكة ${networkLabel(cryptoNetwork)}. يتم التفعيل تلقائياً بعد التأكيد. جميع رسوم الشبكة مدفوعة من طرفنا — أنت تدفع 5$ بالضبط.`
                        : `Pay securely with USDT on the ${networkLabel(cryptoNetwork)} network. Auto-activates after confirmation. All fees covered by us — you pay exactly $5.`}
                    </p>
                  </div>
                  <Button
                    className="w-full h-12 text-base"
                    onClick={() => handlePayment("crypto")}
                  >
                    <Bitcoin className="h-5 w-5 me-2" />
                    {lang === "ar"
                      ? `الدفع بـ USDT ${networkLabel(cryptoNetwork)} — 5$`
                      : `Pay with USDT ${networkLabel(cryptoNetwork)} — $5`}
                  </Button>
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
                      {lang === "ar" ? "Visa · Mastercard · Apple Pay" : "Visa · Mastercard · Apple Pay"}
                    </p>
                    <Button
                      className="w-full h-12 text-base"
                      onClick={() => handlePayment("card")}
                    >
                      <CreditCard className="h-5 w-5 me-2" />
                      {lang === "ar" ? "الدفع بالبطاقة — 5$/شهر" : "Pay with Card — $5/mo"}
                    </Button>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      {lang === "ar"
                        ? "إذا لم تُفعَّل بعد 5 دقائق من الدفع، تواصل مع الدعم."
                        : "If not activated within 5 minutes of payment, contact support."}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Group & Buddy Discount Section ─── */}
      <div className="container mx-auto px-4 pb-10 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Group discount */}
          <div className="rounded-2xl border-2 border-dashed border-primary/25 bg-primary/3 p-6 text-center relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-1">
              {lang === "ar" ? "اشتراك المجموعة" : "Group Subscription"}
            </h3>
            <p className="text-3xl font-extrabold text-primary mb-1">$20</p>
            <p className="text-sm text-muted-foreground mb-3">
              {lang === "ar" ? "لـ 5 طلاب — توفير 60% لكل فرد" : "For 5 students — 60% off per person"}
            </p>
            <ul className="text-sm text-start space-y-1.5">
              {(lang === "ar"
                ? ["وصول كامل لجميع الميزات لـ 5 أشخاص", "شهر واحد مشترك", "مناسب للمجموعات الدراسية"]
                : ["Full access for 5 people", "1 shared month", "Ideal for study groups"]
              ).map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              {lang === "ar" ? "تواصل معنا عبر البريد: noorsupportteam@gmail.com" : "Contact us: noorsupportteam@gmail.com"}
            </p>
          </div>

          {/* Buddy discount */}
          <div className="rounded-2xl border-2 border-dashed border-violet-400/30 bg-violet-50/50 dark:bg-violet-950/10 p-6 text-center relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-3">
              <Gift className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-lg font-bold mb-1">
              {lang === "ar" ? "خصم الثنائي" : "Buddy Discount"}
            </h3>
            <p className="text-3xl font-extrabold text-violet-600 dark:text-violet-400 mb-1">20% <span className="text-base font-medium">{lang === "ar" ? "خصم" : "off"}</span></p>
            <p className="text-sm text-muted-foreground mb-3">
              {lang === "ar" ? "لكل طالب عند اشتراك صديقين معاً" : "For each student when 2 friends subscribe together"}
            </p>
            <ul className="text-sm text-start space-y-1.5">
              {(lang === "ar"
                ? ["اشترك أنت وصديق بسعر $4 لكل منكما", "استخدم كود الإحالة الخاص بك", "صالح مع أي طريقة دفع"]
                : ["You and a friend subscribe for $4 each", "Use your personal referral code", "Valid with any payment method"]
              ).map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              {lang === "ar" ? "احصل على كودك من صفحة الملف الشخصي" : "Get your code from your profile page"}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Crypto Payment Modal ─── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md w-full" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Bitcoin className="h-5 w-5 text-orange-500" />
              {lang === "ar" ? "تفاصيل الدفع بـ USDT" : "USDT Payment Details"}
            </DialogTitle>
          </DialogHeader>

          {paymentInfo && (
            <div className="space-y-5 pt-2">
              {/* Status banner */}
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-800 dark:text-green-300 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {lang === "ar"
                    ? "سيتم تفعيل اشتراكك تلقائياً فور تأكيد المعاملة على الشبكة."
                    : "Your subscription activates automatically once the transaction is confirmed on-chain."}
                </span>
              </div>

              {/* Network badge */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                  <Network className="h-3 w-3" />
                  {paymentInfo.networkKey === "polygon" ? (lang === "ar" ? "شبكة Polygon" : "Polygon Network") : "Tron (TRC20)"}
                </span>
              </div>

              {/* Amount */}
              <div className="text-center py-2">
                <p className="text-4xl font-mono font-bold tracking-tight">
                  {paymentInfo.amount} <span className="text-2xl text-muted-foreground">USDT</span>
                </p>
              </div>

              {/* QR Code */}
              {paymentInfo.paymentAddress && (
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl border shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${encodeURIComponent(paymentInfo.paymentAddress)}`}
                      alt="QR Code"
                      width={180}
                      height={180}
                      className="block"
                    />
                  </div>
                </div>
              )}

              {/* Wallet address */}
              <div className="bg-muted rounded-lg p-4 border">
                <p className="text-xs text-muted-foreground mb-2 font-medium">
                  {lang === "ar"
                    ? `عنوان المحفظة (USDT ${paymentInfo.networkKey === "polygon" ? "Polygon" : "TRC20"})`
                    : `Wallet Address (USDT ${paymentInfo.networkKey === "polygon" ? "Polygon" : "TRC20"})`}
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono break-all flex-1 text-foreground leading-relaxed">
                    {paymentInfo.paymentAddress}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopyAddress} className="shrink-0 h-8 w-8">
                    {copied
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                {copied && <p className="text-xs text-green-600 mt-1.5">{lang === "ar" ? "تم النسخ ✓" : "Copied ✓"}</p>}
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <p>
                  {paymentInfo.networkKey === "polygon"
                    ? (lang === "ar" ? "تأكد من إرسال USDT على شبكة Polygon فقط. لا تستخدم TRC20 على هذا العنوان." : "Send USDT on Polygon network only. Do not send TRC20 to this address.")
                    : (lang === "ar" ? "تأكد من إرسال USDT على شبكة TRC20 فقط. الإرسال على شبكة مختلفة قد يؤدي لفقدان الأموال." : "Send USDT on TRC20 network only. Sending on a different network may result in permanent loss.")}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                {lang === "ar" ? "في انتظار تأكيد الشبكة..." : "Waiting for network confirmation..."}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
