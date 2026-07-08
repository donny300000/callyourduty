import { useState } from "react";
import { useCreateUser } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Droplet } from "lucide-react";

export default function Onboarding() {
  const [name, setName] = useState("");
  const { login } = useAuth();
  const { toast } = useToast();
  const createUser = useCreateUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createUser.mutate({ data: { name } }, {
      onSuccess: (user) => {
        login(user.id);
      },
      onError: (err) => {
        toast({
          title: "Failed to enter",
          description: "Something went wrong. Try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6">
      <div className="max-w-md w-full flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center shadow-lg hover-elevate">
            <Droplet size={48} className="text-primary-foreground" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">Call Your Duty</h1>
          <p className="text-lg text-muted-foreground">The most important log you'll ever keep.</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4 bg-card p-6 sm:p-8 rounded-3xl border border-card-border shadow-xl">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-bold text-foreground uppercase tracking-wider">Choose a Codename</label>
            <Input 
              id="name"
              placeholder="e.g. The Phantom Pooper" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 text-lg bg-background border-2 focus-visible:ring-primary"
              disabled={createUser.isPending}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-bold rounded-2xl hover-elevate shadow-md"
            disabled={!name.trim() || createUser.isPending}
          >
            {createUser.isPending ? "Entering..." : "Deploy"}
          </Button>
        </form>
      </div>
    </div>
  );
}