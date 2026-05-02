import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { UTILITIES, type UtilityKind, utilityLabel } from "@/lib/utilities";
import { COMPUTED_LABELS, SCHEMAS } from "@/lib/forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/history")({ component: () => <AppShell><History /></AppShell> });

type Reading = {
  id: string;
  utility: UtilityKind;
  technician_name: string;
  technician_matricule: string;
  guard_post: number;
  data: Record<string, any>;
  computed: Record<string, any>;
  anomaly: boolean;
  anomaly_fields: any[];
  checklist: any;
  comment: string | null;
  recorded_at: string;
};

function History() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [techs, setTechs] = useState<{ id: string; name: string }[]>([]);
  const [fUtility, setFUtility] = useState<string>("all");
  const [fTech, setFTech] = useState<string>("all");
  const [fPost, setFPost] = useState<string>("all");
  const [fDate, setFDate] = useState<string>("");
  const [selected, setSelected] = useState<Reading | null>(null);

  useEffect(() => {
    supabase.from("utility_readings").select("*").order("recorded_at", { ascending: false }).limit(500).then(({ data }) => setReadings((data ?? []) as Reading[]));
    supabase.from("technicians").select("id, first_name, last_name").then(({ data }) => {
      setTechs((data ?? []).map((t: any) => ({ id: t.id, name: `${t.first_name} ${t.last_name}` })));
    });
  }, []);

  const filtered = useMemo(() => {
    return readings.filter((r) => {
      if (fUtility !== "all" && r.utility !== fUtility) return false;
      if (fTech !== "all" && r.technician_name !== fTech) return false;
      if (fPost !== "all" && String(r.guard_post) !== fPost) return false;
      if (fDate && !r.recorded_at.startsWith(fDate)) return false;
      return true;
    });
  }, [readings, fUtility, fTech, fPost, fDate]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Historique</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} relevé(s)</p>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div><Label className="text-xs">Utilité</Label>
            <Select value={fUtility} onValueChange={setFUtility}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {UTILITIES.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Technicien</Label>
            <Select value={fTech} onValueChange={setFTech}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {techs.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Poste</Label>
            <Select value={fPost} onValueChange={setFPost}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="1">Poste 1</SelectItem>
                <SelectItem value="2">Poste 2</SelectItem>
                <SelectItem value="3">Poste 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Date</Label>
            <Input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date / heure</TableHead>
                <TableHead>Utilité</TableHead>
                <TableHead>Technicien</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{new Date(r.recorded_at).toLocaleString("fr-FR")}</TableCell>
                  <TableCell>{utilityLabel(r.utility)}</TableCell>
                  <TableCell>{r.technician_name}</TableCell>
                  <TableCell>P{r.guard_post}</TableCell>
                  <TableCell>{r.anomaly ? <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Anomalie</Badge> : <Badge className="bg-success text-success-foreground">OK</Badge>}</TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={() => setSelected(r)}><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Aucun relevé.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{utilityLabel(selected.utility)} · {new Date(selected.recorded_at).toLocaleString("fr-FR")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{selected.technician_name} ({selected.technician_matricule})</Badge>
                  <Badge variant="secondary">Poste {selected.guard_post}</Badge>
                  {selected.anomaly && <Badge variant="destructive">Anomalie</Badge>}
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">Mesures</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {SCHEMAS[selected.utility].fields.map((f) => (
                      <div key={f.key} className="flex justify-between rounded bg-muted/40 px-2 py-1">
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className="font-mono">{String(selected.data[f.key] ?? "—")}{f.unit ? ` ${f.unit}` : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {Object.keys(selected.computed || {}).length > 0 && (
                  <div>
                    <h4 className="mb-2 font-semibold">Indicateurs calculés</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selected.computed).map(([k, v]) => (
                        <div key={k} className="flex justify-between rounded bg-primary/10 px-2 py-1">
                          <span>{COMPUTED_LABELS[k]?.label ?? k}</span>
                          <span className="font-mono font-semibold">{String(v)}{COMPUTED_LABELS[k]?.unit ? ` ${COMPUTED_LABELS[k]!.unit}` : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selected.checklist && (
                  <div>
                    <h4 className="mb-2 font-semibold">Checklist</h4>
                    <pre className="overflow-x-auto rounded bg-muted/40 p-2 text-xs">{JSON.stringify(selected.checklist, null, 2)}</pre>
                  </div>
                )}
                {selected.comment && (
                  <div>
                    <h4 className="mb-1 font-semibold">Commentaire</h4>
                    <p className="rounded bg-muted/40 p-2">{selected.comment}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}