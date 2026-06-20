import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { UTILITIES, type UtilityKind, getGuardPost, statusFor, statusColor, type Threshold } from "@/lib/utilities";
import { SCHEMAS, COMPUTED_LABELS, type FormField } from "@/lib/forms";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/entry")({ component: () => <AppShell><Entry /></AppShell> });

function Entry() {
  const { tech } = useAuth();
  const [utility, setUtility] = useState<UtilityKind | "">("");
  const [data, setData] = useState<Record<string, any>>({});
  const [prev, setPrev] = useState<Record<string, any> | null>(null);
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const schema = utility ? SCHEMAS[utility] : null;
  const currentPost = getGuardPost();

  function isVisible(f: FormField): boolean {
    if (f.postsOnly && !f.postsOnly.includes(currentPost as 1 | 2 | 3)) return false;
    if (f.dependsOn) {
      const v = data[f.dependsOn.key];
      if (!f.dependsOn.values.includes(v)) return false;
    }
    return true;
  }

  useEffect(() => {
    if (!utility) return;
    setData({}); setPrev(null); setShowChecklist(false); setChecklist({}); setComment("");
    Promise.all([
      supabase.from("thresholds").select("*").eq("utility", utility),
      supabase.from("utility_readings").select("data").eq("utility", utility).order("recorded_at", { ascending: false }).limit(1),
    ]).then(([th, last]) => {
      setThresholds((th.data ?? []) as Threshold[]);
      if (last.data && last.data[0]) setPrev(last.data[0].data as Record<string, any>);
    });
  }, [utility]);

  const computed = useMemo(() => {
    if (!schema?.compute) return {};
    return schema.compute(data, prev ?? undefined);
  }, [schema, data, prev]);

  const anomalyFields = useMemo(() => {
    if (!schema) return [] as { key: string; label: string; value: number; status: "warning" | "critical" }[];
    const out: { key: string; label: string; value: number; status: "warning" | "critical" }[] = [];
    for (const f of schema.fields) {
      if (f.type !== "number") continue;
      const v = parseFloat(data[f.key]);
      if (isNaN(v)) continue;
      const t = thresholds.find((t) => t.field_key === f.key);
      const s = statusFor(v, t);
      if (s !== "ok") out.push({ key: f.key, label: f.label, value: v, status: s });
    }
    // OK/NOK fields
    for (const f of schema.fields) {
      if (f.type === "select" && f.options?.includes("NOK") && data[f.key] === "NOK") {
        out.push({ key: f.key, label: f.label, value: 0, status: "critical" });
      }
    }
    return out;
  }, [data, schema, thresholds]);

  const hasAnomaly = anomalyFields.length > 0;

  function setField(k: string, v: any) {
    setData((d) => ({ ...d, [k]: v }));
  }

  async function attemptSave() {
    if (!utility || !tech || !schema) return;
    // require all numeric/select fields filled
    for (const f of schema.fields) {
      if (!isVisible(f)) continue;
      if (f.optional || f.type === "text") continue;
      if (data[f.key] === undefined || data[f.key] === "" || data[f.key] === null) {
        toast.error(`Champ requis: ${f.label}`);
        return;
      }
    }
    if (hasAnomaly && !showChecklist) {
      setShowChecklist(true);
      // build checklist
      const init: Record<string, boolean> = {};
      for (const a of anomalyFields) init[`${a.key}_verified`] = false;
      init["safety_checked"] = false;
      init["supervisor_notified"] = false;
      setChecklist(init);
      toast.warning("Anomalies détectées : checklist requise");
      return;
    }
    if (hasAnomaly && Object.values(checklist).some((v) => !v)) {
      toast.error("Cochez tous les points de vérification");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("utility_readings").insert({
      utility,
      technician_id: tech.id,
      technician_name: `${tech.first_name} ${tech.last_name}`,
      technician_matricule: tech.matricule,
      guard_post: getGuardPost(),
      data,
      computed,
      anomaly: hasAnomaly,
      anomaly_fields: anomalyFields,
      checklist: hasAnomaly ? { items: checklist, comment } : null,
      comment: comment || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Relevé enregistré");
    setUtility(""); setData({}); setShowChecklist(false); setChecklist({}); setComment("");
  }

  // group fields
  const grouped = useMemo(() => {
    if (!schema) return {} as Record<string, FormField[]>;
    const g: Record<string, FormField[]> = {};
    for (const f of schema.fields) {
      if (!isVisible(f)) continue;
      const k = f.group ?? "Mesures";
      (g[k] ||= []).push(f);
    }
    return g;
  }, [schema, data, currentPost]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Saisie de relevé</h1>
        <p className="text-sm text-muted-foreground">Sélectionnez une utilité et complétez les valeurs.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Label className="mb-2 block">Utilité</Label>
          <Select value={utility} onValueChange={(v) => setUtility(v as UtilityKind)}>
            <SelectTrigger className="h-14 text-lg"><SelectValue placeholder="Choisir l'utilité..." /></SelectTrigger>
            <SelectContent>
              {UTILITIES.map((u) => (
                <SelectItem key={u.value} value={u.value} className="text-base">
                  <span className="mr-2">{u.icon}</span> {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {schema && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {Object.entries(grouped).map(([group, fields]) => (
              <Card key={group}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{group}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {fields.map((f: FormField) => {
                    const t = thresholds.find((x) => x.field_key === f.key);
                    const v = parseFloat(data[f.key]);
                    const status = f.type === "number" ? statusFor(v, t) : (data[f.key] === "NOK" ? "critical" : "ok");
                    return (
                      <div key={f.key} className="space-y-1.5">
                        <Label className="flex items-center justify-between text-sm">
                          <span>{f.label}{f.unit && <span className="text-muted-foreground"> ({f.unit})</span>}</span>
                          {data[f.key] !== undefined && data[f.key] !== "" && (
                            <span className={`h-2 w-2 rounded-full ${status === "critical" ? "bg-destructive" : status === "warning" ? "bg-warning" : "bg-success"}`} />
                          )}
                        </Label>
                        {f.type === "number" && (
                          <Input className="h-11" type="number" step="any" value={data[f.key] ?? ""} onChange={(e) => setField(f.key, e.target.value)} />
                        )}
                        {f.type === "text" && (
                          <Input className="h-11" value={data[f.key] ?? ""} onChange={(e) => setField(f.key, e.target.value)} />
                        )}
                        {f.type === "select" && (
                          <Select value={data[f.key] ?? ""} onValueChange={(v) => setField(f.key, v)}>
                            <SelectTrigger className="h-11"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              {f.options!.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                        {t && f.type === "number" && (
                          <p className="text-[11px] text-muted-foreground">Plage OK: {t.warn_min ?? t.min_value} – {t.warn_max ?? t.max_value} {t.unit}</p>
                        )}
                        {f.isCounter && prev?.[f.key] !== undefined && (
                          <p className="text-[11px] text-muted-foreground">Précédent: {prev[f.key]}</p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Commentaire (facultatif)</CardTitle></CardHeader>
              <CardContent>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Observations…" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-primary/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Indicateurs temps réel</CardTitle>
                <CardDescription>Calculés automatiquement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.keys(computed).length === 0 && <p className="text-sm text-muted-foreground">—</p>}
                {Object.entries(computed).map(([k, v]) => {
                  const meta = COMPUTED_LABELS[k];
                  return (
                    <div key={k} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                      <span className="text-sm">{meta?.label ?? k}</span>
                      <span className="font-mono text-base font-semibold">{v}{meta?.unit ? ` ${meta.unit}` : ""}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className={hasAnomaly ? "border-destructive" : "border-success"}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {hasAnomaly ? <><AlertTriangle className="h-4 w-4 text-destructive" />Anomalies</> : <><CheckCircle2 className="h-4 w-4 text-success" />Tous les paramètres OK</>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasAnomaly ? (
                  <ul className="space-y-1 text-sm">
                    {anomalyFields.map((a) => (
                      <li key={a.key} className="flex items-center justify-between">
                        <span>{a.label}</span>
                        <Badge className={statusColor(a.status)}>{a.status}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune valeur hors seuil détectée.</p>
                )}
              </CardContent>
            </Card>

            {showChecklist && (
              <Card className="border-warning">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Checklist obligatoire</CardTitle>
                  <CardDescription>Validez chaque point pour autoriser l'enregistrement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.keys(checklist).map((k) => (
                    <label key={k} className="flex items-start gap-2 text-sm">
                      <Checkbox checked={checklist[k]} onCheckedChange={(v) => setChecklist((c) => ({ ...c, [k]: !!v }))} />
                      <span>
                        {k === "safety_checked" && "Sécurité vérifiée sur site"}
                        {k === "supervisor_notified" && "Superviseur notifié"}
                        {k.endsWith("_verified") && `Valeur "${anomalyFields.find((a) => `${a.key}_verified` === k)?.label ?? k}" revérifiée physiquement`}
                      </span>
                    </label>
                  ))}
                </CardContent>
              </Card>
            )}

            <Button className="h-14 w-full text-base" onClick={attemptSave} disabled={saving}>
              <Save className="mr-2 h-5 w-5" />
              {saving ? "Enregistrement…" : hasAnomaly && !showChecklist ? "Vérifier anomalies" : "Enregistrer le relevé"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}