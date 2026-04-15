import { Navbar } from "./Navbar";
import { useLang } from "@/lib/language";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t, lang } = useLang();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="py-6 md:py-0 border-t md:h-16 flex items-center justify-center bg-card text-card-foreground">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between text-sm">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} نُور AI. {t.footerText}.
          </p>
          <div className="flex items-center gap-4 mt-4 md:mt-0 text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              {lang === "ar" ? "معالجة محلية" : "Local Processing"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
