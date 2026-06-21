import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { UTILITIES, type UtilityKind, utilityLabel } from "@/lib/utilities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: () => <AppShell><Admin /></AppShell> });

type Tech = { id: string; matricule: string; first_name: string; last_name: string; role: string; active: boolean };
type Threshold = { id: string; utility: UtilityKind; field_key: string; label: string; min_value: number | null; max_value: number | null; warn_min: number | null; warn_max: number | null; unit: string | null };

function Admin() {
  const { tech } = useAuth();
  const navigate = useNavigate();
  const [techs, setTechs] = useState<Tech[]>([]);
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [filterUtil, setFilterUtil] = useState<UtilityKind | "all">("all");

  useEffect(() => {
    if (tech && tech.role !== "admin") {
      toast.error("Accès réservé aux administrateurs");
      navigate({ to: "/dashboard" });
    }
  }, [tech, navigate]);

  async function reload() {
    const [t, th] = await Promise.all([
      supabase.from("technicians").select("*").order("last_name"),
      supabase.from("thresholds").select("*").order("utility").order("field_key"),
    ]);
    setTechs((t.data ?? []) as Tech[]);
    setThresholds((th.data ?? []) as Threshold[]);
  }
  useEffect(() => { reload(); }, []);

  async function setActive(id: string, active: boolean) {
    const { error } = await supabase.from("technicians").update({ active }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Mis à jour"); reload();
  }
  async function setRole(id: string, role: string) {
    const { error } = await supabase.from("technicians").update({ role: role as "admin" | "maintenance_manager" | "technician" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Rôle mis à jour"); reload();
  }
  async function deleteTech(id: string) {
    if (!confirm("Supprimer ce technicien ?")) return;
    const { error } = await supabase.from("technicians").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Supprimé"); reload();
  }

  async function saveThreshold(t: Threshold) {
    const { error } = await supabase.from("thresholds").update({
      min_value: t.min_value, max_value: t.max_value, warn_min: t.warn_min, warn_max: t.warn_max,
    }).eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success(`${t.label} mis à jour`);
  }

  const visibleTh = thresholds.filter((t) => filterUtil === "all" || t.utility === filterUtil);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Administration</h1>
        <p className="text-sm text-muted-foreground">Gérer les techniciens, seuils et utilités</p>
      </div>

      <Tabs defaultValue="techs">
        <TabsList>
          <TabsTrigger value="techs">Techniciens</TabsTrigger>
          <TabsTrigger value="thresholds">Seuils</TabsTrigger>
        </TabsList>

        <TabsContent value="techs" className="space-y-3">
          {techs.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex-1">
                  <div className="font-medium">{t.first_name} {t.last_name} <span className="ml-2 font-mono text-xs text-muted-foreground">{t.matricule}</span></div>
                  <Badge variant="secondary" className="mt-1">{t.role}</Badge>
                  {!t.active && <Badge variant="destructive" className="ml-2">Inactif</Badge>}
                </div>
                <Select value={t.role} onValueChange={(v) => setRole(t.id, v)}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technician">Technicien</SelectItem>
                    <SelectItem value="maintenance_manager">Resp. maintenance</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setActive(t.id, !t.active)}>{t.active ? "Désactiver" : "Activer"}</Button>
                <Button variant="ghost" size="sm" onClick={() => deleteTech(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-3">
          <Card>
            <CardContent className="pt-6">
              <Label className="text-xs">Filtrer par utilité</Label>
              <Select value={filterUtil} onValueChange={(v) => setFilterUtil(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {UTILITIES.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          {visibleTh.map((t) => (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t.label} <span className="text-xs text-muted-foreground">({utilityLabel(t.utility)} · {t.unit})</span></CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 items-end gap-3 sm:grid-cols-5">
                {(["min_value", "warn_min", "warn_max", "max_value"] as const).map((k) => (
                  <div key={k}>
                    <Label className="text-[10px] uppercase text-muted-foreground">{k.replace("_", " ")}</Label>
                    <Input type="number" step="any" value={t[k] ?? ""} onChange={(e) => {
                      const val = e.target.value === "" ? null : parseFloat(e.target.value);
                      setThresholds((prev) => prev.map((x) => x.id === t.id ? { ...x, [k]: val } : x));
                    }} />
                  </div>
                ))}
                <Button onClick={() => saveThreshold(t)}><Save className="mr-2 h-4 w-4" />Enregistrer</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}