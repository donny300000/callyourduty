import { Link, useLocation } from "wouter";
import { MapPin, History, Users, UserRound } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const navs = [
    { href: "/", icon: MapPin, label: "Map" },
    { href: "/log", icon: History, label: "Log" },
    { href: "/groups", icon: Users, label: "Groups" },
    { href: "/profile", icon: UserRound, label: "Profile" }
  ];

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-background overflow-hidden relative">
      <main className="flex-1 overflow-y-auto w-full relative z-0 flex flex-col">
        {children}
      </main>
      <nav className="border-t border-border bg-card pb-safe shrink-0 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around p-3">
          {navs.map((n) => {
            const Icon = n.icon;
            const active = location === n.href || (n.href !== "/" && location.startsWith(n.href));
            return (
              <Link key={n.href} href={n.href} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 ${active ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{n.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  );
}