import { useAuth } from "@/lib/auth";
import { useGetUserSummary, useGetUser, useHealthCheck } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplet, Flame, MapPin, Users, Activity } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const { userId, logout } = useAuth();
  const queryClient = useQueryClient();
  const { data: user, isLoading: loadingUser } = useGetUser(userId!);
  const { data: summary, isLoading: loadingSummary } = useGetUserSummary(userId!);
  const { data: health } = useHealthCheck();

  const handleLogout = () => {
    queryClient.clear();
    logout();
  };

  return (
    <div className="flex flex-col w-full min-h-full relative">
      <div className="p-6 pb-2 shrink-0">
        <h1 className="text-3xl font-extrabold mb-1">Dossier</h1>
        <p className="text-muted-foreground">Your vital stats</p>
      </div>

      <div className="p-6 space-y-6">
        <Card className="p-6 flex flex-col sm:flex-row items-center gap-6 border-2 border-primary/20 bg-primary/5">
          {loadingUser ? (
            <Skeleton className="h-24 w-24 rounded-full" />
          ) : (
            <div 
              className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg shrink-0"
              style={{ backgroundColor: user?.avatarColor || "hsl(var(--primary))" }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 text-center sm:text-left">
            {loadingUser ? (
              <Skeleton className="h-8 w-48 mb-2 mx-auto sm:mx-0" />
            ) : (
              <h2 className="text-3xl font-bold">{user?.name}</h2>
            )}
            <p className="text-muted-foreground font-mono text-sm">ID: {userId?.slice(0, 8)}...</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="shrink-0 font-bold border-2">
            Discharge
          </Button>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            icon={Droplet} 
            title="Total Drops" 
            value={loadingSummary ? null : summary?.totalLogs} 
            color="text-blue-500" 
          />
          <StatCard 
            icon={Flame} 
            title="Longest Streak" 
            value={loadingSummary ? null : `${summary?.longestStreakDays} Days`} 
            color="text-orange-500" 
          />
          <StatCard 
            icon={MapPin} 
            title="Favorite Spot" 
            value={loadingSummary ? null : summary?.favoriteSpot || "N/A"} 
            color="text-primary" 
          />
          <StatCard 
            icon={Users} 
            title="Squads" 
            value={loadingSummary ? null : summary?.groupCount} 
            color="text-purple-500" 
          />
        </div>

        <div className="flex justify-center pt-8">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <Activity size={14} className={health?.status === "ok" ? "text-green-500" : "text-destructive"} />
            Server Status: {health?.status === "ok" ? "Operational" : "Offline"}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }: { icon: any, title: string, value: any, color: string }) {
  return (
    <Card className="p-5 flex flex-col gap-2 border-2 hover-elevate transition-all">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={color} size={18} strokeWidth={2.5} />
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      {value === null ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <div className="text-2xl sm:text-3xl font-black truncate">{value}</div>
      )}
    </Card>
  );
}