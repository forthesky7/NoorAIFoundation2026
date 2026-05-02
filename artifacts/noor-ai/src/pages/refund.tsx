import { AppLayout } from "@/components/layout/AppLayout";
import { useLang } from "@/lib/language";
import { ShieldCheck, Clock, HeartHandshake } from "lucide-react";

export default function Refund() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-3">
          {isAr ? "سياسة الاسترداد" : "Refund Policy"}
        </h1>
        <p className="text-muted-foreground mb-10 text-sm">
          {isAr ? "آخر تحديث: مايو 2026" : "Last updated: May 2026"}
        </p>

        <div className="space-y-8">

          {/* Section 1 — No refund after access */}
          <div className="flex gap-4">
            <div className="shrink-0 mt-1 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-2">
                {isAr ? "المبيعات الرقمية نهائية" : "Digital Sales Are Final"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isAr
                  ? "نظرًا للطبيعة الرقمية لمحتوانا التعليمي، لا تتوفر المبالغ المستردة بعد الوصول إلى الدروس. هذا الإجراء ضروري للحفاظ على جودة المنصة ومنع إساءة الاستخدام، مع ضمان استمرار توفير أفضل تجربة تعليمية لجميع الطلاب."
                  : "Due to the digital nature of our educational content, refunds are generally not available once lessons have been accessed. This policy is necessary to prevent abuse and maintain the quality of the platform for all students."}
              </p>
            </div>
          </div>

          {/* Section 2 — Technical issue window */}
          <div className="flex gap-4">
            <div className="shrink-0 mt-1 w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-2">
                {isAr ? "استثناء: المشكلات التقنية" : "Exception: Technical Issues"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isAr
                  ? "إذا واجهت مشكلة تقنية تمنعك من استخدام المنصة، يُرجى التواصل معنا خلال 24 ساعة من الاشتراك. سيقوم فريقنا بالتحقيق في المشكلة فورًا. إذا تعذّر علينا حلها خلال هذه الفترة، سنقوم باسترداد كامل المبلغ دون أي تساؤلات."
                  : "If you experience a technical issue that prevents you from using the platform, please contact us within 24 hours of subscribing. Our team will investigate promptly. If we are unable to resolve the issue within that window, we will issue a full refund — no questions asked."}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 text-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg font-medium">
                <Clock className="h-3.5 w-3.5" />
                {isAr ? "نافذة التحقيق: 24 ساعة" : "Investigation window: 24 hours"}
              </div>
            </div>
          </div>

          {/* Section 3 — Student satisfaction */}
          <div className="flex gap-4">
            <div className="shrink-0 mt-1 w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
              <HeartHandshake className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-2">
                {isAr ? "رضا الطالب هو أولويتنا" : "Student Satisfaction Is Our Priority"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isAr
                  ? "هدفنا الأول والأخير هو نجاح طلابنا. إذا لم تكن تجربتك بالمستوى المتوقع لأي سبب خارج نطاق السياسة أعلاه، نشجعك على التواصل معنا مباشرة على noorsupporteam@gmail.com وسنبذل قصارى جهدنا للوصول إلى حل عادل."
                  : "Our primary goal is your success as a student. If your experience falls short of expectations for any reason beyond the policy above, we encourage you to reach out to us directly at noorsupporteam@gmail.com — we will do everything in our power to find a fair resolution."}
              </p>
            </div>
          </div>

        </div>

        {/* Contact CTA */}
        <div className="mt-12 border rounded-xl p-6 bg-card text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {isAr ? "للتواصل بشأن طلب استرداد أو مشكلة تقنية:" : "To request a refund or report a technical issue:"}
          </p>
          <a
            href="mailto:noorsupporteam@gmail.com"
            className="font-semibold text-primary hover:underline"
          >
            noorsupporteam@gmail.com
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
