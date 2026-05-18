import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getWattNowRealtime } from "@/lib/wattnow.functions";
import { Zap, Factory, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";

export const Route = createFileRoute("/energie")({
  component: () => <AppShell><EnergiePage /></AppShell>,
});

type Snap = {
  recorded_at: string;
  randa1_kw: number | null; randa2_kw: number | null; randa3_kw: number | null;
  ge1_kw: number | null; ge2_kw: number | null;
  conso_kw: number; prod_kw: number; delta_kw: number;
};
type Payload = {
  current: {
    recordedAt: string;
    randa1_kw: number | null; randa2_kw: number | null; randa3_kw: number | null;
    ge1_kw: number | null; ge2_kw: number | null;
    conso_kw: number; prod_kw: number; delta_kw: number;
    stale: boolean; error?: string;
  };
  history: Snap[];
};

function fmt(v: number | null | undefined, digits = 1): string {
  if (v == null || !isFinite(v)) return "—";
  return v.toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Formate une puissance exprimée en kW : MW si |v| >= 1000, sinon kW. */
function fmtPower(kw: number | null | undefined): { value: string; unit: "kW" | "MW" } {
  if (kw == null || !isFinite(kw)) return { value: "—", unit: "kW" };
  const abs = Math.abs(kw);
  if (abs >= 1000) {
    return {
      value: (kw / 1000).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      unit: "MW",
    };
  }
  return {
    value: kw.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    unit: "kW",
  };
}

function EnergiePage() {
  const fetchRealtime = useServerFn(getWattNowRealtime);
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = (await fetchRealtime()) as Payload;
        if (!cancelled) { setData(res); setError(null); setLoading(false); }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    }
    tick();
    const t = setInterval(tick, 5000);
    return () => { cancelled = true; clearInterval(t); };
  }, [fetchRealtime]);

  const c = data?.current;
  const surplus = (c?.delta_kw ?? 0) < 0;

  const chartData = (data?.history ?? []).map((s) => ({
    time: new Date(s.recorded_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    conso: Number(s.conso_kw) || 0,
    prod: Number(s.prod_kw) || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Énergie temps réel</h1>
          <p className="text-sm text-muted-foreground">
            Source WattNow · rafraîchissement 5 s
            {c?.stale && <Badge variant="destructive" className="ml-2">Données en cache</Badge>}
          </p>
        </div>
        {c && (
          <div className="text-right text-xs text-muted-foreground">
            <div>Dernier relevé</div>
            <div className="font-mono">{new Date(c.recordedAt).toLocaleTimeString("fr-FR")}</div>
          </div>
        )}
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 p-4 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" /> {error}
          </CardContent>
        </Card>
      )}

      {loading && !c && <p className="text-sm text-muted-foreground">Connexion à WattNow…</p>}

      {c && (
        <>
          {/* Delta principal */}
          <Card className={surplus ? "border-emerald-500/50" : "border-destructive/50"}>
            <CardContent className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Consommation − Production
                </div>
                <div className={`flex items-center gap-2 text-4xl font-bold ${surplus ? "text-emerald-500" : "text-destructive"}`}>
                  {surplus ? <TrendingDown className="h-8 w-8" /> : <TrendingUp className="h-8 w-8" />}
                  {(() => { const p = fmtPower(c.delta_kw); return `${p.value} ${p.unit}`; })()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {surplus ? "Surplus de production" : "Déficit — la production ne couvre pas la consommation"}
                </div>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <div className="text-muted-foreground">Conso totale</div>
                  <div className="text-2xl font-semibold">{(() => { const p = fmtPower(c.conso_kw); return `${p.value} ${p.unit}`; })()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Prod totale</div>
                  <div className="text-2xl font-semibold">{(() => { const p = fmtPower(c.prod_kw); return `${p.value} ${p.unit}`; })()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5 cartes */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <DeviceCard label="Randa 1" kw={c.randa1_kw} icon={<Zap className="h-4 w-4" />} kind="conso" />
            <DeviceCard label="Randa 2" kw={c.randa2_kw} icon={<Zap className="h-4 w-4" />} kind="conso" />
            <DeviceCard label="Randa 3" kw={c.randa3_kw} icon={<Zap className="h-4 w-4" />} kind="conso" />
            <DeviceCard label="Groupe 1" kw={c.ge1_kw} icon={<Factory className="h-4 w-4" />} kind="prod" />
            <DeviceCard label="Groupe 2" kw={c.ge2_kw} icon={<Factory className="h-4 w-4" />} kind="prod" />
          </div>

          {/* Tendance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendance 5 minutes</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="oklch(0.35 0.03 250)" strokeDasharray="3 3" />
                    <XAxis dataKey="time" stroke="oklch(0.7 0.02 250)" fontSize={11} />
                    <YAxis stroke="oklch(0.7 0.02 250)" fontSize={11} unit=" kW" />
                    <Tooltip contentStyle={{ background: "oklch(0.22 0.025 250)", border: "1px solid oklch(0.35 0.03 250)" }} />
                    <Legend />
                    <Line type="monotone" dataKey="conso" name="Consommation" stroke="oklch(0.65 0.24 25)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="prod" name="Production" stroke="oklch(0.72 0.18 145)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Pas encore assez de points (refresh toutes les 5 s).
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function DeviceCard({ label, kw, icon, kind }: { label: string; kw: number | null; icon: React.ReactNode; kind: "conso" | "prod" }) {
  const color = kind === "conso" ? "text-orange-500" : "text-emerald-500";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">{icon}{label}</span>
          <span className="text-[10px] uppercase text-muted-foreground">{kind === "conso" ? "Conso" : "Prod"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(() => {
          const p = fmtPower(kw);
          return (
            <div className={`text-2xl font-bold ${color}`}>
              {p.value} <span className="text-sm font-normal text-muted-foreground">{p.unit}</span>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}