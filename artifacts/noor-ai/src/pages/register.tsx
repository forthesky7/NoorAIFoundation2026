import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@workspace/api-client-react";
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
import { Eye, EyeOff } from "lucide-react";
import { useLang } from "@/lib/language";

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Register() {
  const setToken = useAuthStore(state => state.setToken);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const { lang } = useLang();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    registerMutation.mutate({ data: values }, {
      onSuccess: data => {
        setToken(data.token);
        toast({
          title: lang === "ar" ? "تم إنشاء الحساب!" : "Account created",
          description: lang === "ar" ? "أهلاً بك في نُور AI." : "Welcome to NOOR AI.",
        });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({
          title: lang === "ar" ? "فشل التسجيل" : "Registration failed",
          description: error?.error || (lang === "ar" ? "حاول مجدداً لاحقاً." : "Please try again later."),
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
              {lang === "ar" ? "انضم إلى نُور AI" : "Join NOOR AI"}
            </CardTitle>
            <CardDescription>
              {lang === "ar" ? "أنشئ حسابك وابدأ رحلتك التعليمية" : "Create an account to start your learning journey"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{lang === "ar" ? "الاسم الكامل" : "Full Name"}</FormLabel>
                      <FormControl>
                        <Input placeholder={lang === "ar" ? "محمد العلي" : "John Doe"} autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{lang === "ar" ? "البريد الإلكتروني" : "Email"}</FormLabel>
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
                      <FormLabel>{lang === "ar" ? "كلمة المرور" : "Password"}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="••••••••"
                            type={showPassword ? "text" : "password"}
                            dir="ltr"
                            autoComplete="new-password"
                            className="pe-10"
                            {...field}
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground transition-colors"
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
                <Button type="submit" className="w-full h-11" disabled={registerMutation.isPending}>
                  {registerMutation.isPending
                    ? (lang === "ar" ? "جارٍ الإنشاء..." : "Creating account...")
                    : (lang === "ar" ? "إنشاء الحساب" : "Sign up")}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "لديك حساب بالفعل؟ " : "Already have an account? "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                {lang === "ar" ? "تسجيل الدخول" : "Log in"}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
