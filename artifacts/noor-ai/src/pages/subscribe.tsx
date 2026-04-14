import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Check, CreditCard, Bitcoin } from "lucide-react";
import { useCreateSubscription } from "@workspace/api-client-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const subscribeMutation = useCreateSubscription();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  
  if (user?.subscribed || user?.role === "admin") {
    return <Redirect to="/dashboard" />;
  }

  const handleCryptoPayment = () => {
    subscribeMutation.mutate({
      data: { paymentMethod: "crypto", currency: "USDT" }
    }, {
      onSuccess: (data) => {
        setPaymentInfo(data);
      },
      onError: (err: any) => {
        toast({
          title: "Error",
          description: err.error || "Failed to initialize payment.",
          variant: "destructive"
        });
      }
    });
  };

  const handleCardPayment = () => {
    toast({
      title: "Coming Soon",
      description: "Card payments are not yet available. Please use Crypto.",
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Invest in your intelligence</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get unlimited access to the AI tutor, personalized roadmaps, and ad-free learning.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 items-start">
          <Card className="md:col-span-2 border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Premium Plan</CardTitle>
              <CardDescription>Everything you need to excel</CardDescription>
              <div className="mt-4 flex items-baseline text-4xl font-extrabold tracking-tight">
                $5
                <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {[
                  "Unlimited AI tutoring sessions",
                  "Smart video checkpoints",
                  "Unlimited career roadmaps",
                  "Progress tracking & analytics",
                  "Priority support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="md:col-span-3 border shadow-sm">
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
              <CardDescription>Secure, encrypted payment processing</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentInfo ? (
                <div className="space-y-6 text-center py-4 animate-in fade-in">
                  <div className="bg-secondary p-6 rounded-xl border mb-4 inline-block mx-auto">
                    <div className="w-48 h-48 bg-white p-2 border shadow-sm mb-4 mx-auto">
                      {/* Fake QR code representation */}
                      <div className="w-full h-full border-4 border-black p-1 flex flex-wrap gap-1 content-start">
                        {Array.from({ length: 144 }).map((_, i) => (
                          <div key={i} className={`w-3 h-3 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Send exactly</p>
                    <p className="text-2xl font-mono font-bold mb-4">{paymentInfo.amount} {paymentInfo.currency}</p>
                    <div className="bg-background border px-4 py-3 rounded-lg font-mono text-sm break-all text-left flex justify-between items-center gap-4">
                      <span>{paymentInfo.paymentAddress || "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    Waiting for network confirmation...
                  </div>
                </div>
              ) : (
                <Tabs defaultValue="crypto" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="crypto" className="flex gap-2">
                      <Bitcoin className="h-4 w-4" /> Crypto
                    </TabsTrigger>
                    <TabsTrigger value="card" className="flex gap-2">
                      <CreditCard className="h-4 w-4" /> Card
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="crypto" className="space-y-4">
                    <div className="bg-secondary/50 rounded-lg p-4 border text-sm text-muted-foreground flex gap-3 items-start">
                      <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                      <p>Pay securely with USDT (TRC20) via NOWPayments. Your subscription will activate automatically once the transaction is confirmed on the blockchain.</p>
                    </div>
                    <Button 
                      className="w-full h-12 text-base" 
                      onClick={handleCryptoPayment}
                      disabled={subscribeMutation.isPending}
                    >
                      {subscribeMutation.isPending ? "Initializing..." : "Pay with Crypto"}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="card" className="space-y-4">
                    <div className="space-y-4 opacity-50 pointer-events-none">
                      <div className="space-y-2">
                        <Label>Card Number</Label>
                        <Input placeholder="0000 0000 0000 0000" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Expiry</Label>
                          <Input placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                          <Label>CVC</Label>
                          <Input placeholder="123" />
                        </div>
                      </div>
                    </div>
                    <Button className="w-full h-12 text-base" onClick={handleCardPayment} variant="secondary">
                      Card Payments Coming Soon
                    </Button>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
