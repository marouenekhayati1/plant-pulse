import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { getBackendDiagnostics, type BackendDiagnostics } from "@/lib/diagnostics.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Server, Database, ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, XCircle, HelpCircle, Cloud } from "lucide-react";

export const Route = createFileRoute("/diagnostics")({
  component: () => (
    <AppShell>
      <DiagnosticsPage />
    </AppShell>
  ),
  head: () => ({
    meta: [
      { title: "Diagnostics · INDUS Monitoring" },
      { name: "description", content: "Diagnostics backend et connectivité Lovable Cloud" },
      { property: "og:title", content: "Diagnostics · INDUS Monitoring" },
      { property: "og:description", content: "Diagnostics backend et connectivité Lovable Cloud" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function DiagnosticsPage() {
  const { tech } = useAuth();
  const navigate = useNavigate();
  const fetchDiagnostics = useServerFn(getBackendDiagnostics);
  const [data, setData] = useState<BackendDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tech && tech.role !== "admin") {
      toast.error("Accès réservé aux administrateurs");
      navigate({ to: "/dashboard" });
    }
  }, [tech, navigate]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDiagnostics();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      toast.error("Impossible de récupérer les diagnostics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [fetchDiagnostics]);

  if (!tech || tech.role !== "admin") return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Diagnostics</h1>
          <p className="text-sm text-muted-foreground">État du backend et connectivité Lovable Cloud</p>
        </div>
        <Button onClick={load} disabled={loading} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Rafraîchir
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      {!data && !error && loading && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Chargement des diagnostics…</CardContent>
        </Card>
      )}

      {data && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatusCard
            title="Connexion backend"
            icon={<Cloud className="h-5 w-5" />}
            status={data.connected ? "success" : "error"}
            value={data.connected ? "Connecté" : "Non connecté"}
            detail={data.provider}
          />

          <StatusCard
            title="Projet"
            icon={<Server className="h-5 w-5" />}
            status={data.projectRef ? "success" : "warning"}
            value={data.projectRef ?? "Inconnu"}
            detail="Référence masquée pour la sécurité"
          />

          <StatusCard
            title="Région"
            icon={<Database className="h-5 w-5" />}
            status={data.region ? "success" : "warning"}
            value={data.region ?? "Inconnue"}
            detail="Région hébergement base de données"
          />

          <StatusCard
            title="Configuration Auth"
            icon={<ShieldCheck className="h-5 w-5" />}
            status={data.authConfigured ? "success" : "error"}
            value={data.authConfigured ? "Clé présente" : "Clé manquante"}
            detail="Clé anonyme / publishable"
          />

          <StatusCard
            title="Configuration DB"
            icon={<Database className="h-5 w-5" />}
            status={data.dbConfigured ? "success" : "error"}
            value={data.dbConfigured ? "URL présente" : "URL manquante"}
            detail="URL Supabase configurée"
          />

          <StatusCard
            title="Santé base de données"
            icon={data.healthCheck === "ok" ? <CheckCircle2 className="h-5 w-5" /> : data.healthCheck === "error" ? <XCircle className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
            status={data.healthCheck === "ok" ? "success" : data.healthCheck === "error" ? "error" : "warning"}
            value={data.healthCheck === "ok" ? "Opérationnelle" : data.healthCheck === "error" ? "Erreur" : "Non testée"}
            detail={data.healthError ?? "Requête de test réussie"}
          />
        </div>
      )}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations techniques</CardTitle>
            <CardDescription>Données brutes masquées pour la sécurité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Fournisseur" value={data.provider} />
            <Row label="Référence projet" value={data.projectRef ?? "—"} />
            <Row label="Région" value={data.region ?? "—"} />
            <Row label="Auth configurée" value={data.authConfigured ? "Oui" : "Non"} />
            <Row label="DB configurée" value={data.dbConfigured ? "Oui" : "Non"} />
            <Row label="Santé" value={data.healthCheck} />
            <Separator />
            <Row label="Dernier rafraîchissement" value={new Date(data.timestamp).toLocaleString("fr-FR")} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusCard({
  title,
  icon,
  status,
  value,
  detail,
}: {
  title: string;
  icon: React.ReactNode;
  status: "success" | "warning" | "error";
  value: string;
  detail: string;
}) {
  const variant = status === "success" ? "success" : status === "error" ? "destructive" : "warning";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Badge variant={variant as any}>{value}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </div>
  );
}
