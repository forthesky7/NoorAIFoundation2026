import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowRight, Brain, Compass, Lock, PlayCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background border-b border-border/50">
        <div className="container px-4 md:px-6 mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            The Private Academy in the Cloud
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
            Master any subject with <span className="text-primary">guided intelligence</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            NOOR AI combines world-class video learning with an active AI tutor that ensures comprehension. Shape your future with personalized career roadmaps and guided study.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 w-full sm:w-auto text-base" asChild>
              <Link href="/register">
                Start Learning Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {deferredPrompt && (
              <Button size="lg" variant="outline" className="h-12 px-8 w-full sm:w-auto text-base" onClick={handleInstallClick}>
                Install App
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20 bg-background">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Thoughtful. Precise. Effective.</h2>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
              We replace passive watching with active understanding.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
              <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                <PlayCircle className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Interruption</h3>
              <p className="text-muted-foreground leading-relaxed">
                Videos pause at critical checkpoints. Our AI tutor asks comprehension questions before you can proceed, ensuring you actually understand the material.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
              <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                <Compass className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Future Simulator</h3>
              <p className="text-muted-foreground leading-relaxed">
                Input your interests, grades, and goals. We generate a visual career roadmap with actionable milestones to get you from where you are to where you want to be.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
              <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                <Brain className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Socratic Method</h3>
              <p className="text-muted-foreground leading-relaxed">
                The AI doesn't just give you the answer. It guides you to find it yourself through dialogue, mimicking the world's best private tutors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & Privacy */}
      <section className="w-full py-20 bg-secondary">
        <div className="container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Invest in your future</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Access to the complete library, unlimited AI tutoring, and unlimited career roadmaps for less than the cost of a coffee.
              </p>
              <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold tracking-tight">$5</span>
                  <span className="text-muted-foreground font-medium">/ month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span>Unlimited AI tutoring</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span>Smart video checkpoints</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span>Career roadmap generator</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span>Pay with Card or Crypto</span>
                  </li>
                </ul>
                <Button className="w-full h-12" asChild>
                  <Link href="/register">Start Free Trial</Link>
                </Button>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="bg-background p-8 rounded-2xl border border-border">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <Lock className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">Privacy First</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  We believe your educational data belongs to you. NOOR AI employs local processing where possible to minimize data transmission. Your career goals and personal progress are secured and never sold to third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
