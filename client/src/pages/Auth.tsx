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

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) throw error;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Google sign-in failed";
      toast.error(message);
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
              Fastbookr access portal
            </div>
            <h1 className="max-w-xl font-serif text-4xl leading-tight text-stone-900 md:text-5xl">
              Sign in with Google or use your email and password.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-stone-600">
              Google sign-in is the fastest option. You can still create an account with email and password if you prefer.
            </p>
          </section>

          <Card className="border-stone-200/80 bg-white/95 shadow-[0_25px_70px_rgba(15,23,42,0.12)]">
            <CardHeader>
              <CardTitle>{mode === "signin" ? "Sign in" : "Create account"}</CardTitle>
              <CardDescription>
                {mode === "signin"
                  ? "Use Google or your registered email and password."
                  : "Create a Fastbookr account with Google or email."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                className="mb-5 h-11 w-full border-stone-300 bg-white text-stone-900 hover:bg-stone-50"
                onClick={() => void signInWithGoogle()}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.6 12 2.6 6.9 2.6 2.8 6.7 2.8 11.8S6.9 21 12 21c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-.9-.1-1.2H12Z" />
                  <path fill="#34A853" d="M2.8 11.8c0 1.6.6 3.1 1.7 4.2l3-2.3c-.4-.5-.6-1.2-.6-1.9s.2-1.3.6-1.9l-3-2.3c-1.1 1.1-1.7 2.6-1.7 4.2Z" />
                  <path fill="#4A90E2" d="M12 21c2.6 0 4.8-.9 6.4-2.4l-3.1-2.4c-.8.6-1.9 1-3.3 1-2.5 0-4.6-1.7-5.3-4l-3 2.3C5.3 18.8 8.4 21 12 21Z" />
                  <path fill="#FBBC05" d="M6.7 11.8c0-.7.2-1.4.5-2l-3-2.3c-.9 1.2-1.4 2.7-1.4 4.3s.5 3.1 1.4 4.3l3-2.3c-.3-.6-.5-1.3-.5-2Z" />
                </svg>
                Continue with Google
              </Button>

              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-stone-500">Or continue with email</span>
                </div>
              </div>

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
