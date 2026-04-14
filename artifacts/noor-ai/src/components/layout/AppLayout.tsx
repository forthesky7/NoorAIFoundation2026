import { Navbar } from "./Navbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="py-6 md:py-0 border-t md:h-16 flex items-center justify-center bg-card text-card-foreground">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between text-sm">
          <p className="text-muted-foreground">© {new Date().getFullYear()} NOOR AI. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0 text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Local Processing Priority
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
