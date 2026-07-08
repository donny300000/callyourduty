import { useState } from "react";
import { PoopLog, useGetLog, useDeleteLog, getGetLogQueryKey, getListLogsQueryKey, getListGroupLogsQueryKey, getGetGroupLeaderboardQueryKey, getGetUserSummaryQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Star, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export function LogCard({ log }: { log: PoopLog }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card 
        className="p-4 border-2 hover-elevate transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 cursor-pointer active:scale-[0.98]"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-md"
              style={{ backgroundColor: log.avatarColor }}
            >
              {log.userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold">{log.userName}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin size={12} />
                {log.locationName || "Unknown location"}
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-mono shrink-0">
            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1 mb-4 bg-muted/50 p-2 rounded-xl">
          <MiniRating label="SPD" value={log.ratings.speed} />
          <MiniRating label="COM" value={log.ratings.comfort} />
          <MiniRating label="PRV" value={log.ratings.privacy} />
          <MiniRating label="AMB" value={log.ratings.ambiance} />
          <MiniRating label="REL" value={log.ratings.relief} />
        </div>

        <div className="flex items-end justify-between">
          <div className="text-sm italic text-muted-foreground line-clamp-2 flex-1 pr-4">
            {log.notes ? `"${log.notes}"` : "No details provided."}
          </div>
          <div className="shrink-0 flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-lg font-black text-lg shadow-sm">
            {log.overallScore.toFixed(1)}
            <Star size={16} fill="currentColor" />
          </div>
        </div>
      </Card>

      <LogDetailDialog open={open} onOpenChange={setOpen} logId={log.id} />
    </>
  );
}

function LogDetailDialog({ open, onOpenChange, logId }: { open: boolean, onOpenChange: (open: boolean) => void, logId: string }) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: log, isLoading } = useGetLog(logId, { query: { enabled: open, queryKey: getGetLogQueryKey(logId) } });
  const deleteLog = useDeleteLog();

  const handleDelete = () => {
    if (!log) return;
    deleteLog.mutate({ logId: log.id }, {
      onSuccess: () => {
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: getListLogsQueryKey({ userId: userId! }) });
        queryClient.invalidateQueries({ queryKey: getGetUserSummaryQueryKey(userId!) });
        if (log.groupId) {
          queryClient.invalidateQueries({ queryKey: getListGroupLogsQueryKey(log.groupId) });
          queryClient.invalidateQueries({ queryKey: getGetGroupLeaderboardQueryKey(log.groupId) });
        }
        toast({ title: "Log scrubbed", description: "Record erased from history." });
      },
      onError: () => {
        toast({ title: "Failed to delete", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Intel Report</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : log ? (
          <div className="space-y-6 mt-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-md"
                style={{ backgroundColor: log.avatarColor }}
              >
                {log.userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-black text-xl">{log.userName}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 font-bold uppercase tracking-wider">
                  <MapPin size={14} />
                  {log.locationName || "Classified Coordinates"}
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-1">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground p-3 rounded-xl shadow-md">
                <div className="font-black text-3xl leading-none">{log.overallScore.toFixed(1)}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Score</div>
              </div>
            </div>

            <div className="bg-muted/30 border p-4 rounded-2xl space-y-3">
              <DetailRating label="Speed" value={log.ratings.speed} />
              <DetailRating label="Comfort" value={log.ratings.comfort} />
              <DetailRating label="Privacy" value={log.ratings.privacy} />
              <DetailRating label="Ambiance" value={log.ratings.ambiance} />
              <DetailRating label="Relief" value={log.ratings.relief} />
            </div>

            {log.notes && (
              <div className="bg-card border-2 p-4 rounded-2xl">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Field Notes</div>
                <p className="italic">"{log.notes}"</p>
              </div>
            )}

            {log.userId === userId && (
              <Button 
                variant="destructive" 
                className="w-full h-12 font-bold rounded-xl gap-2 mt-4" 
                onClick={handleDelete}
                disabled={deleteLog.isPending}
              >
                <Trash2 size={18} /> 
                {deleteLog.isPending ? "Scrubbing..." : "Scrub Record"}
              </Button>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Log not found.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MiniRating({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-black text-sm">{value}</div>
    </div>
  );
}

function DetailRating({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i} 
            className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-xs ${
              i < value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground/30'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}