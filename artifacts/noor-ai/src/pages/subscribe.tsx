import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldCheck, Check, CreditCard, Bitcoin, Copy, Loader2, Zap, AlertCircle, CheckCircle2, Network } from "lucide-react";
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
    : (lang === "ar" ? "Polygon (ERC-20)" : "Polygon (ERC-20)");

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
                      {lang === "ar" ? "ستتوفر قريباً." : "Coming soon."}
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
                  {paymentInfo.networkKey === "polygon" ? "Polygon (ERC-20)" : "Tron (TRC20)"}
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
