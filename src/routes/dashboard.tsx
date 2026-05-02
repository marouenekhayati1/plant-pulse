import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { UTILITIES, type UtilityKind, statusFor, statusDot, type Threshold, utilityLabel } from "@/lib/utilities";
import { SCHEMAS } from "@/lib/forms";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, ArrowRight, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard")({ component: () => <AppShell><Dashboard /></AppShell> });

type Reading = {
  id: string;
  utility: UtilityKind;
  technician_name: string;
  guard_post: number;
  data: Record<string, any>;
  computed: Record<string, any>;
  anomaly: boolean;
  recorded_at: string;
};

function Dashboard() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [thresholds, setThresholds] = useState<Threshold[] & { utility?: UtilityKind }[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("utility_readings").select("*").order("recorded_at", { ascending: false }).limit(200),
      supabase.from("thresholds").select("*"),
    ]).then(([r, t]) => {
      setReadings((r.data ?? []) as Reading[]);
      setThresholds((t.data ?? []) as any);
    });
  }, []);

  const latestPerUtility = useMemo(() => {
    const map = new Map<UtilityKind, Reading>();
    for (const r of readings) if (!map.has(r.utility)) map.set(r.utility, r);
    return map;
  }, [readings]);

  function utilityStatus(u: UtilityKind, r?: Reading): "ok" | "warning" | "critical" | "none" {
    if (!r) return "none";
    if (r.anomaly) return "critical";
    const schema = SCHEMAS[u];
    let worst: "ok" | "warning" | "critical" = "ok";
    for (const f of schema.fields) {
      if (f.type !== "number") continue;
      const v = parseFloat(r.data[f.key]);
      const t = (thresholds as any[]).find((x) => x.utility === u && x.field_key === f.key);
      const s = statusFor(v, t);
      if (s === "critical") return "critical";
      if (s === "warning") worst = "warning";
    }
    return worst;
  }

  const recentAnomalies = readings.filter((r) => r.anomaly).slice(0, 6);

  // Trend chart for generator G1 exhaust temp (sample)
  const g1Trend = useMemo(() => {
    return readings
      .filter((r) => r.utility === "generator_g1")
      .slice(0, 20)
      .reverse()
      .map((r) => ({
        time: new Date(r.recorded_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        exhaust: parseFloat(r.data.exhaust_temp) || 0,
        cooling: parseFloat(r.data.cooling_out) || 0,
      }));
  }, [readings]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Vue temps réel · {readings.length} relevés totaux</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Relevés aujourd'hui" value={readings.filter((r) => sameDay(r.recorded_at)).length.toString()} icon={<Activity className="h-4 w-4" />} />
        <KPI label="Anomalies actives" value={recentAnomalies.length.toString()} icon={<AlertTriangle className="h-4 w-4" />} tone={recentAnomalies.length ? "critical" : "ok"} />
        <KPI label="Utilités suivies" value={UTILITIES.length.toString()} icon={<Activity className="h-4 w-4" />} />
        <KPI label="Dernier relevé" value={readings[0] ? new Date(readings[0].recorded_at).toLocaleTimeString("fr-FR") : "—"} icon={<Clock className="h-4 w-4" />} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {UTILITIES.map((u) => {
          const r = latestPerUtility.get(u.value);
          const s = utilityStatus(u.value, r);
          return (
            <Card key={u.value} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="text-lg">{u.icon}</span>{u.label}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${s === "none" ? "bg-muted" : statusDot(s as any)}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {r ? (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>Par <span className="text-foreground">{r.technician_name}</span></div>
                    <div>Poste {r.guard_post} · {new Date(r.recorded_at).toLocaleString("fr-FR")}</div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Aucun relevé.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendance G1 (température)</CardTitle>
            <CardDescription>20 derniers relevés</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {g1Trend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={g1Trend}>
                  <CartesianGrid stroke="oklch(0.35 0.03 250)" strokeDasharray="3 3" />
                  <XAxis dataKey="time" stroke="oklch(0.7 0.02 250)" fontSize={11} />
                  <YAxis stroke="oklch(0.7 0.02 250)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "oklch(0.22 0.025 250)", border: "1px solid oklch(0.35 0.03 250)" }} />
                  <Line type="monotone" dataKey="exhaust" stroke="oklch(0.65 0.24 25)" strokeWidth={2} dot={false} name="Échappement" />
                  <Line type="monotone" dataKey="cooling" stroke="oklch(0.72 0.18 220)" strokeWidth={2} dot={false} name="Refroid. sortie" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Pas encore de données.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-destructive" />Centre d'alertes</CardTitle>
            <CardDescription>Anomalies récentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentAnomalies.length === 0 && <p className="text-sm text-muted-foreground">Aucune anomalie récente.</p>}
            {recentAnomalies.map((r) => (
              <Link key={r.id} to="/history" className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm hover:bg-muted">
                <div>
                  <div className="font-medium">{utilityLabel(r.utility)}</div>
                  <div className="text-xs text-muted-foreground">{r.technician_name} · {new Date(r.recorded_at).toLocaleString("fr-FR")}</div>
                </div>
                <Badge variant="destructive">Anomalie</Badge>
              </Link>
            ))}
            <Link to="/history" className="mt-2 flex items-center justify-end gap-1 text-xs text-primary">
              Tout l'historique <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPI({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone?: "ok" | "critical" }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={`text-2xl font-bold ${tone === "critical" ? "text-destructive" : ""}`}>{value}</div>
        </div>
        <div className="rounded-md bg-muted p-2 text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  );
}

function sameDay(iso: string) {
  const a = new Date(iso); const b = new Date();
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}