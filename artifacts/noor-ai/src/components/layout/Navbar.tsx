import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@workspace/api-client-react";
import { GraduationCap, LogOut, Menu, UserCircle, Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLang } from "@/lib/language";

export function Navbar() {
  const { user, isAuthenticated, setToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const logout = useLogout();
  const { t, toggle, lang } = useLang();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setToken(null);
        setLocation("/login");
        toast({ title: lang === "ar" ? "تم تسجيل الخروج" : "Logged out" });
      },
    });
  };

  const NavLinks = () => (
    <>
      <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        {t.dashboard}
      </Link>
      <Link href="/videos" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        {t.library}
      </Link>
      <Link href="/future" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        {t.futureSimulator}
      </Link>
      {user?.role === "admin" && (
        <Link href="/admin-noor" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          {t.adminNoor}
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg tracking-tight">نُور AI</span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6 ms-6">
              <NavLinks />
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium"
          >
            <Languages className="h-3.5 w-3.5" />
            {t.langToggle}
          </Button>

          {isAuthenticated ? (
            <>
              {!user?.subscribed && user?.role !== "admin" && (
                <Button variant="default" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/subscribe">{t.subscribe}</Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <UserCircle className="h-5 w-5" />
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">{t.dashboard}</Link>
                  </DropdownMenuItem>
                  {!user?.subscribed && user?.role !== "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/subscribe">{lang === "ar" ? "الاشتراك" : "Subscription"}</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={toggle} className="gap-2">
                    <Languages className="h-4 w-4" />
                    {t.langToggle}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="me-2 h-4 w-4" />
                    <span>{t.logout}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">{t.menu}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side={lang === "ar" ? "right" : "right"}>
                    <SheetHeader>
                      <SheetTitle>{t.menu}</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 mt-6">
                      <NavLinks />
                      <Button variant="ghost" size="sm" onClick={toggle} className="justify-start gap-2">
                        <Languages className="h-4 w-4" />
                        {t.langToggle}
                      </Button>
                      {!user?.subscribed && user?.role !== "admin" && (
                        <Button variant="default" className="mt-4" asChild>
                          <Link href="/subscribe">{t.subscribe}</Link>
                        </Button>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">{t.logIn}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t.signUp}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
