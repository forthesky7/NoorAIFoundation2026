import { AppLayout } from "@/components/layout/AppLayout";
import { useLang } from "@/lib/language";

export default function Refund() {
  const { lang } = useLang();
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">{lang === "ar" ? "سياسة الاسترداد" : "Refund Policy"}</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
          <p>
            {lang === "ar"
              ? "نظرًا للطبيعة الرقمية لمحتوانا، فإن جميع المبيعات نهائية وغير قابلة للاسترداد بعد الوصول إلى الخدمة."
              : "Due to the digital nature of our content, all sales are final and non-refundable once the service is accessed."}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
