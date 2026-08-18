import { useListLogs } from "@workspace/api-client-react";
import { LogCard } from "@/components/log-card";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Inbox } from "lucide-react";

export default function LogFeed() {
  const { data: logs, isLoading } = useListLogs();

  return (
    <div className="flex flex-col w-full min-h-full">
      <div className="p-6 pb-2 shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-3xl font-extrabold mb-1 flex items-center gap-2">
          <History className="text-primary" /> Captain's Log
        </h1>
        <p className="text-muted-foreground">Your personal deployment history</p>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))
        ) : logs?.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Inbox size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No deployments yet</h3>
            <p className="text-muted-foreground">Head to the map to log your first drop.</p>
          </div>
        ) : (
          logs?.map((log) => (
            <LogCard key={log.id} log={log} />
          ))
        )}
      </div>
    </div>
  );
}