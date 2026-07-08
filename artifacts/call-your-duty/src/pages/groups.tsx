import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useListGroups, useCreateGroup, useJoinGroup, getListGroupsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, Plus, KeyRound, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Groups() {
  const { userId } = useAuth();
  const { data: groups, isLoading } = useListGroups({ userId: userId! });

  return (
    <div className="flex flex-col w-full min-h-full">
      <div className="p-6 pb-2 shrink-0">
        <h1 className="text-3xl font-extrabold mb-1 flex items-center gap-2">
          <Users className="text-primary" /> Squads
        </h1>
        <p className="text-muted-foreground">Coordinate with your allies</p>
      </div>

      <div className="p-4 flex gap-2">
        <CreateGroupDialog />
        <JoinGroupDialog />
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))
        ) : groups?.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Lone Wolf</h3>
            <p className="text-muted-foreground">Create or join a squad to compete on the leaderboards.</p>
          </div>
        ) : (
          groups?.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`} className="block">
              <Card className="p-4 border-2 hover:border-primary transition-colors flex items-center justify-between group active:scale-[0.98]">
                <div>
                  <h3 className="text-xl font-bold mb-1">{group.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ChevronRight size={20} />
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function CreateGroupDialog() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const createGroup = useCreateGroup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createGroup.mutate({ data: { name, userId: userId! } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey({ userId: userId! }) });
        setOpen(false);
        setName("");
        toast({ title: "Squad created!", variant: "default" });
      },
      onError: () => {
        toast({ title: "Failed to create squad", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex-1 font-bold border-2 rounded-xl h-12 gap-2" variant="outline">
          <Plus size={18} /> Create
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-2 p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Form a Squad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider">Squad Name</label>
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. The Regulars"
              className="h-12 border-2 focus-visible:ring-primary"
            />
          </div>
          <Button type="submit" className="w-full h-12 font-bold rounded-xl text-lg" disabled={createGroup.isPending || !name.trim()}>
            {createGroup.isPending ? "Creating..." : "Initialize"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function JoinGroupDialog() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const joinGroup = useJoinGroup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    joinGroup.mutate({ data: { inviteCode: code.toUpperCase(), userId: userId! } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey({ userId: userId! }) });
        setOpen(false);
        setCode("");
        toast({ title: "Joined squad!", variant: "default" });
      },
      onError: () => {
        toast({ title: "Invalid invite code", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex-1 font-bold rounded-xl h-12 gap-2 shadow-sm">
          <KeyRound size={18} /> Join
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-2 p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Enter Invite Code</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider">Code</label>
            <Input 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              placeholder="e.g. A1B2C3"
              className="h-12 border-2 focus-visible:ring-primary font-mono uppercase text-lg tracking-widest text-center"
              maxLength={8}
            />
          </div>
          <Button type="submit" className="w-full h-12 font-bold rounded-xl text-lg" disabled={joinGroup.isPending || !code.trim()}>
            {joinGroup.isPending ? "Joining..." : "Infiltrate"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}