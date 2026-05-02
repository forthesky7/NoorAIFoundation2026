import { Navbar } from "./Navbar";
import { useLang } from "@/lib/language";
import { Send, Mail } from "lucide-react";
import { Link } from "wouter";

const TELEGRAM_LINK = "https://t.me/NoorAi_Education";
const SUPPORT_EMAIL = "noorsupporteam@gmail.com";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t, lang } = useLang();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t bg-card text-card-foreground">
        {/* Three-column section */}
        <div className="container mx-auto px-4 md:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-10 text-sm">

          {/* Column 1 — About */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-foreground text-base">
              {lang === "ar" ? "عن نُور AI" : "About Noor AI"}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "ar"
                ? "نُمكّن الطلاب من التعلم الذكي عبر مساعد أستاذ سقراطي."
                : "Empowering students with Socratic AI learning."}
            </p>
            <a
              href={TELEGRAM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#2CA5E0] hover:text-[#2CA5E0]/80 font-medium transition-colors w-fit"
            >
              <Send className="h-4 w-4" />
              <span>تابعنا لمزيد من الأخبار</span>
            </a>
          </div>

          {/* Column 2 — Legal */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-foreground text-base">
              {lang === "ar" ? "قانوني" : "Legal"}
            </h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                {lang === "ar" ? "شروط الخدمة" : "Terms of Service"}
              </Link>
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                {lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
              </Link>
              <Link
                href="/refund"
                className="text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                {lang === "ar" ? "سياسة الاسترداد" : "Refund Policy"}
              </Link>
            </nav>
          </div>

          {/* Column 3 — Support */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-foreground text-base">
              {lang === "ar" ? "الدعم" : "Support"}
            </h3>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span>{SUPPORT_EMAIL}</span>
            </a>
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              {lang === "ar" ? "معالجة محلية آمنة" : "Local Secure Processing"}
            </span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t">
          <div className="container mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} نُور AI. {t.footerText}.</p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                {lang === "ar" ? "شروط الخدمة" : "Terms"}
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                {lang === "ar" ? "الخصوصية" : "Privacy"}
              </Link>
              <Link href="/refund" className="hover:text-foreground transition-colors">
                {lang === "ar" ? "الاسترداد" : "Refund"}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
