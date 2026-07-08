import { useRoute } from "wouter";
import { useGetGroup, useListGroupLogs, useGetGroupLeaderboard } from "@workspace/api-client-react";
import { LogCard } from "@/components/log-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Trophy, Copy, Check, Users } from "lucide-react";
import { useState } from "react";

export default function GroupDetail() {
  const [, params] = useRoute("/groups/:id");
  const groupId = params?.id || "";

  const { data: group, isLoading: loadingGroup } = useGetGroup(groupId);
  const { data: logs, isLoading: loadingLogs } = useListGroupLogs(groupId);
  const { data: leaderboard, isLoading: loadingLeaderboard } = useGetGroupLeaderboard(groupId);

  const [copied, setCopied] = useState(false);

  const copyInvite = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loadingGroup) {
    return <div className="p-6 space-y-4"><Skeleton className="h-12 w-3/4" /><Skeleton className="h-32 w-full" /></div>;
  }

  if (!group) {
    return <div className="p-6 text-center text-muted-foreground">Squad not found</div>;
  }

  return (
    <div className="flex flex-col w-full min-h-full">
      <div className="p-6 pb-4 shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-10 border-b border-border">
        <h1 className="text-3xl font-extrabold mb-1">{group.name}</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold uppercase">
            <Users size={16} /> {group.members.length} member{group.members.length !== 1 ? 's' : ''}
          </div>
          <button 
            onClick={copyInvite}
            className="flex items-center gap-1.5 bg-muted text-foreground px-3 py-1 rounded-full text-xs font-mono font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            Code: {group.inviteCode}
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2"><Trophy className="text-primary" /> Leaderboard</h2>
          <Card className="border-2 overflow-hidden">
            {loadingLeaderboard ? (
              <div className="p-4 space-y-3"><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/></div>
            ) : leaderboard?.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No activity yet</div>
            ) : (
              <div className="divide-y divide-border">
                {leaderboard?.map((entry, idx) => (
                  <div key={entry.userId} className={`flex items-center justify-between p-3 ${idx === 0 ? 'bg-primary/10' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="font-black text-muted-foreground w-4 text-right">{idx + 1}</div>
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm"
                        style={{ backgroundColor: entry.avatarColor }}
                      >
                        {entry.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-bold">{entry.name}</div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="text-xs">
                        <div className="font-bold">{entry.totalLogs}</div>
                        <div className="text-muted-foreground text-[10px] uppercase">Drops</div>
                      </div>
                      <div className="text-xs w-12">
                        <div className="font-black text-primary">{entry.averageOverall?.toFixed(1) || "-"}</div>
                        <div className="text-muted-foreground text-[10px] uppercase">Avg</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-3">Recent Intel</h2>
          <div className="flex flex-col gap-4">
            {loadingLogs ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
            ) : logs?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl">Silence on the front</div>
            ) : (
              logs?.map(log => <LogCard key={log.id} log={log} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}