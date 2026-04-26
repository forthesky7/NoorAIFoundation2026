import { Navbar } from "./Navbar";
import { useLang } from "@/lib/language";
import { Send } from "lucide-react";

const TELEGRAM_LINK = "https://t.me/NoorAi_Education";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t, lang } = useLang();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="py-6 md:py-0 border-t md:h-auto md:min-h-[64px] flex items-center justify-center bg-card text-card-foreground">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-3 py-4 text-sm">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} نُور AI. {t.footerText}.
          </p>
          <div className="flex items-center gap-6">
            <a
              href={TELEGRAM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#2CA5E0] hover:text-[#2CA5E0]/80 font-medium transition-colors text-sm"
            >
              <Send className="h-4 w-4" />
              <span>تابعنا لمزيد من الأخبار</span>
            </a>
            <span className="flex items-center gap-1 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              {lang === "ar" ? "معالجة محلية" : "Local Processing"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
