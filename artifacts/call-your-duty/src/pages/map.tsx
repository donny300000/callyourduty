import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useListLogs, useCreateLog, useListGroups, getListLogsQueryKey, getGetUserSummaryQueryKey, getGetGroupLeaderboardQueryKey, getListGroupLogsQueryKey } from "@workspace/api-client-react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, MapPin as MapPinIcon, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Fix leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapPage() {
  const { data: logs } = useListLogs();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795]); // US center default
  const [sheetOpen, setSheetOpen] = useState(false);
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMapCenter(coords);
        if (mapRef.current) {
          mapRef.current.flyTo(coords, 14);
        }
      });
    }
  }, []);

  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        setSheetOpen(true);
        if (mapRef.current) {
          mapRef.current.flyTo(coords, 16);
        }
      });
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="absolute top-4 left-4 right-4 z-[400] flex justify-between items-center pointer-events-none">
        <Card className="px-4 py-2 bg-background/90 backdrop-blur pointer-events-auto border-2 shadow-lg rounded-2xl">
          <h1 className="font-black text-xl tracking-tight">Call Your Duty</h1>
        </Card>
      </div>

      <div className="flex-1 relative z-0">
        <MapContainer 
          center={mapCenter} 
          zoom={4} 
          className="w-full h-full"
          ref={mapRef}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={(coords) => {
            setPosition(coords);
            setSheetOpen(true);
          }} />
          
          {logs?.map(log => (
            <Marker key={log.id} position={[log.lat, log.lng]} icon={customIcon}>
              <Popup className="rounded-xl overflow-hidden font-sans border-0 shadow-xl">
                <div className="font-bold text-base mb-1">{log.locationName || "Unknown Drop"}</div>
                <div className="text-xs text-muted-foreground mb-2">{new Date(log.createdAt).toLocaleDateString()}</div>
                <div className="bg-primary text-primary-foreground font-black inline-block px-2 py-1 rounded-md text-sm">
                  {log.overallScore.toFixed(1)} / 5
                </div>
              </Popup>
            </Marker>
          ))}
          {position && <Marker position={position} icon={customIcon} />}
        </MapContainer>
      </div>

      <div className="absolute bottom-6 left-0 right-0 z-[400] flex justify-center pointer-events-none px-4">
        <Button 
          size="lg" 
          onClick={handleLocateMe}
          className="rounded-full h-16 px-8 text-lg font-black shadow-[0_8px_30px_rgba(199,255,0,0.4)] pointer-events-auto hover:scale-105 active:scale-95 transition-transform gap-2 border-2 border-primary-foreground/20"
        >
          <Target size={24} /> Log Drop Here
        </Button>
      </div>

      <LogFormSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        position={position}
        onSuccess={() => setPosition(null)}
      />
    </div>
  );
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (coords: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function LogFormSheet({ open, onOpenChange, position, onSuccess }: { open: boolean, onOpenChange: (o: boolean) => void, position: [number, number] | null, onSuccess: () => void }) {
  const { user } = useAuth();
  const { data: groups } = useListGroups();
  const createLog = useCreateLog();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [locationName, setLocationName] = useState("");
  const [groupId, setGroupId] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [ratings, setRatings] = useState({ speed: 3, comfort: 3, privacy: 3, ambiance: 3, relief: 5 });

  const resetForm = () => {
    setLocationName("");
    setGroupId("none");
    setNotes("");
    setRatings({ speed: 3, comfort: 3, privacy: 3, ambiance: 3, relief: 5 });
  };

  const handleSubmit = () => {
    if (!position) return;

    createLog.mutate({
      data: {
        groupId: groupId === "none" ? null : groupId,
        lat: position[0],
        lng: position[1],
        locationName: locationName || null,
        notes: notes || null,
        ratings
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLogsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUserSummaryQueryKey(user!.id) });
        if (groupId !== "none") {
          queryClient.invalidateQueries({ queryKey: getGetGroupLeaderboardQueryKey(groupId) });
          queryClient.invalidateQueries({ queryKey: getListGroupLogsQueryKey(groupId) });
        }
        
        toast({
          title: "Log deployed successfully!",
          description: "Your record is in the books.",
        });
        
        onOpenChange(false);
        resetForm();
        onSuccess();
      },
      onError: () => {
        toast({ title: "Deployment failed", variant: "destructive" });
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => {
      if (!o) onSuccess();
      onOpenChange(o);
    }}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-[2rem] px-6 py-6 border-t-2 overflow-y-auto">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle className="text-3xl font-black flex items-center gap-2">
            <MapPinIcon className="text-primary" /> New Entry
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-20">
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Location Name (Optional)</label>
            <Input 
              placeholder="e.g. 3rd Floor Office Restroom" 
              value={locationName} 
              onChange={e => setLocationName(e.target.value)}
              className="h-12 border-2 text-lg"
            />
          </div>

          {groups && groups.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Share with Squad</label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="h-12 border-2 text-base">
                  <SelectValue placeholder="Keep private" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Private (Just me)</SelectItem>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-4 bg-muted/30 p-5 rounded-2xl border">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Ratings</label>
            <RatingSlider label="Speed" value={ratings.speed} onChange={v => setRatings(prev => ({ ...prev, speed: v }))} />
            <RatingSlider label="Comfort" value={ratings.comfort} onChange={v => setRatings(prev => ({ ...prev, comfort: v }))} />
            <RatingSlider label="Privacy" value={ratings.privacy} onChange={v => setRatings(prev => ({ ...prev, privacy: v }))} />
            <RatingSlider label="Ambiance" value={ratings.ambiance} onChange={v => setRatings(prev => ({ ...prev, ambiance: v }))} />
            <RatingSlider label="Relief" value={ratings.relief} onChange={v => setRatings(prev => ({ ...prev, relief: v }))} />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Field Notes (Optional)</label>
            <Textarea 
              placeholder="Any notable details for the debrief?" 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              className="min-h-[100px] border-2 text-base resize-none"
            />
          </div>

          <Button 
            size="lg" 
            className="w-full h-14 text-xl font-black rounded-xl shadow-md gap-2"
            onClick={handleSubmit}
            disabled={createLog.isPending}
          >
            {createLog.isPending ? "Submitting..." : <><Send size={20} /> Submit Log</>}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RatingSlider({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-20 text-sm font-bold">{label}</div>
      <Slider 
        value={[value]} 
        min={1} 
        max={5} 
        step={1} 
        onValueChange={([v]) => onChange(v)} 
        className="flex-1"
      />
      <div className="w-6 text-right font-black font-mono text-primary">{value}</div>
    </div>
  );
}