import { AppLayout } from "@/components/layout/AppLayout";
import { useLang } from "@/lib/language";

export default function Terms() {
  const { lang } = useLang();
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">{lang === "ar" ? "شروط الخدمة" : "Terms of Service"}</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
          <p>
            {lang === "ar"
              ? "تقدم نُور AI أدوات تعليمية مدعومة بالذكاء الاصطناعي. باستخدام خدمتنا، فإنك توافق على شروطنا. الوصول للخدمة مخصص للاستخدام الشخصي فقط."
              : "Noor AI provides AI-based educational tools. By using our service, you agree to our terms. Access is for personal use only."}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
