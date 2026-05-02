import { AppLayout } from "@/components/layout/AppLayout";
import { useLang } from "@/lib/language";

export default function Privacy() {
  const { lang } = useLang();
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">{lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
          <p>
            {lang === "ar"
              ? "نجمع بريدك الإلكتروني فقط لإنشاء حسابك وضمان أمان المدفوعات. لا نشارك بياناتك مع أطراف ثالثة، باستثناء معالجي الدفع."
              : "We only collect your email for account creation and payment security. We do not share your data with third parties except for payment processors."}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
