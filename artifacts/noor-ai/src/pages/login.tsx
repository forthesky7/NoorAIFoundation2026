import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuthStore } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, HelpCircle, Mail, X } from "lucide-react";
import { useLang } from "@/lib/language";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Login() {
  const setToken = useAuthStore(state => state.setToken);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const { lang } = useLang();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const isAr = lang === "ar";
  const [passwordDir, setPasswordDir] = useState<"ltr" | "rtl">(isAr ? "rtl" : "ltr");
  const handlePasswordInput = (e: React.FormEvent<HTMLInputElement>) => {
    const val = (e.target as HTMLInputElement).value;
    if (!val) { setPasswordDir(isAr ? "rtl" : "ltr"); return; }
    const hasArabic = /[\u0600-\u06FF]/.test(val);
    setPasswordDir(hasArabic ? "rtl" : "ltr");
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    loginMutation.mutate({ data: values }, {
      onSuccess: data => {
        setToken(data.token);
        toast({
          title: isAr ? "أهلاً بعودتك!" : "Welcome back!",
          description: isAr ? "تم تسجيل الدخول بنجاح." : "You have successfully logged in.",
        });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({
          title: isAr ? "فشل تسجيل الدخول" : "Login failed",
          description: error?.error || (isAr ? "تحقق من بياناتك وحاول مجدداً." : "Please check your credentials and try again."),
          variant: "destructive",
        });
      },
    });
  }

  return (
    <AppLayout>
      <div className="flex-1 flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader className="space-y-3 items-center text-center">
            <img
              src="/logo.jpg"
              alt="نُور AI"
              className="h-16 w-16 rounded-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <CardTitle className="text-2xl">
              {isAr ? "تسجيل الدخول إلى نُور AI" : "Log in to NOOR AI"}
            </CardTitle>
            <CardDescription>
              {isAr ? "أدخل بيانات حسابك للوصول إلى المنصة" : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "البريد الإلكتروني" : "Email"}</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" type="email" dir="ltr" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>{isAr ? "كلمة المرور" : "Password"}</FormLabel>
                        <button
                          type="button"
                          onClick={() => setShowForgot(true)}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <HelpCircle className="h-3 w-3" />
                          {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
                        </button>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="••••••••"
                            type={showPassword ? "text" : "password"}
                            dir={passwordDir}
                            autoComplete="current-password"
                            className={passwordDir === "rtl" ? "pl-10 text-start" : "pr-10 text-start"}
                            onInput={handlePasswordInput}
                            {...field}
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword(v => !v)}
                            className={`absolute inset-y-0 ${passwordDir === "rtl" ? "left-0 pl-3" : "right-0 pr-3"} flex items-center text-muted-foreground hover:text-foreground transition-colors`}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-11" disabled={loginMutation.isPending}>
                  {loginMutation.isPending
                    ? (isAr ? "جارٍ الدخول..." : "Logging in...")
                    : (isAr ? "تسجيل الدخول" : "Log in")}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              {isAr ? "ليس لديك حساب؟ " : "Don't have an account? "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                {isAr ? "إنشاء حساب" : "Sign up"}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <button
              onClick={() => setShowForgot(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-center mb-5">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-bold">
                {isAr ? "استعادة كلمة المرور" : "Password Recovery"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {isAr
                  ? "لا يوجد حالياً خيار إعادة تعيين تلقائي. يرجى التواصل مع مسؤول المنصة لإعادة تعيين كلمة المرور الخاصة بك."
                  : "Automatic password reset is not available. Please contact the platform administrator to reset your password."}
              </p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm border">
              <p className="font-semibold text-foreground">
                {isAr ? "تواصل مع الدعم:" : "Contact Support:"}
              </p>
              <a
                href="mailto:noorsupportteam@gmail.com"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Mail className="h-4 w-4 shrink-0" />
                noorsupportteam@gmail.com
              </a>
              <p className="text-muted-foreground text-xs mt-1">
                {isAr
                  ? "أرسل بريدك الإلكتروني المسجل وسيتم إعادة تعيين كلمة مرورك خلال 24 ساعة."
                  : "Send your registered email address and your password will be reset within 24 hours."}
              </p>
            </div>
            <Button className="w-full mt-4" onClick={() => setShowForgot(false)}>
              {isAr ? "فهمت، شكراً" : "Got it, thanks"}
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
