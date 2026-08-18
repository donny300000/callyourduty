import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLogin, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Droplet } from "lucide-react";

export default function Login({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 4) return;

    login.mutate(
      { data: { email, password } },
      {
        onSuccess: (user) => {
          queryClient.setQueryData(getGetCurrentUserQueryKey(), user);
        },
        onError: () => {
          toast({
            title: "Login failed",
            description: "Invalid email or password.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6">
      <div className="max-w-md w-full flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center shadow-lg hover-elevate">
            <Droplet size={48} className="text-primary-foreground" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">Call Your Duty</h1>
          <p className="text-lg text-muted-foreground">Welcome back, operative.</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4 bg-card p-6 sm:p-8 rounded-3xl border border-card-border shadow-xl">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-bold text-foreground uppercase tracking-wider">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 text-lg bg-background border-2 focus-visible:ring-primary"
              disabled={login.isPending}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-bold text-foreground uppercase tracking-wider">Password</label>
            <Input
              id="password"
              type="password"
              placeholder="At least 4 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 text-lg bg-background border-2 focus-visible:ring-primary"
              disabled={login.isPending}
            />
          </div>
          <Button
            type="submit"
            className="w-full h-14 text-lg font-bold rounded-2xl hover-elevate shadow-md"
            disabled={!email.trim() || password.length < 4 || login.isPending}
          >
            {login.isPending ? "Logging in..." : "Log In"}
          </Button>
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Need an account? Sign up
          </button>
        </form>
      </div>
    </div>
  );
}
