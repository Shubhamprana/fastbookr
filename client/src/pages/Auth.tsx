import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Home, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Auth() {
  const { isAuthenticated, refresh } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  if (isAuthenticated) {
    window.location.href = "/";
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              name: form.name,
              full_name: form.name,
            },
          },
        });

        if (error) throw error;

        toast.success("Account created. If email confirmation is enabled, verify your email before signing in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) throw error;

        await refresh();
        window.location.href = "/";
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f3efe4_0%,#f8f6f0_35%,#ffffff_100%)]">
      <Navbar />
      <main className="container py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-stone-200/80 bg-white/80 p-8 shadow-[0_30px_80px_rgba(31,41,55,0.08)] backdrop-blur">
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
              <Home className="h-4 w-4" />
              Real Estate access portal
            </div>
            <h1 className="max-w-xl font-serif text-4xl leading-tight text-stone-900 md:text-5xl">
              Sign in directly with Supabase email and password.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-stone-600">
              Google OAuth has been removed from this flow. Use your email address to sign in or create a new account.
            </p>
          </section>

          <Card className="border-stone-200/80 bg-white/95 shadow-[0_25px_70px_rgba(15,23,42,0.12)]">
            <CardHeader>
              <CardTitle>{mode === "signin" ? "Sign in" : "Create account"}</CardTitle>
              <CardDescription>
                {mode === "signin"
                  ? "Use your registered email and password."
                  : "Create a Supabase account for this platform."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={submit}>
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Shubham Prajapati"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-9"
                      value={form.email}
                      onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      id="password"
                      type="password"
                      className="pl-9"
                      value={form.password}
                      onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Minimum 6 characters"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="h-11 w-full" disabled={loading}>
                  {loading
                    ? "Please wait..."
                    : mode === "signin"
                      ? "Sign in"
                      : "Create account"}
                </Button>
              </form>

              <div className="mt-5 text-sm text-stone-600">
                {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="font-semibold text-primary"
                  onClick={() =>
                    setMode(current => (current === "signin" ? "signup" : "signin"))
                  }
                >
                  {mode === "signin" ? "Create an account" : "Sign in instead"}
                </button>
              </div>

              <div className="mt-6 text-sm text-stone-500">
                <Link href="/">Back to home</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
