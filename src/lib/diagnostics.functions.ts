import { createServerFn } from "@tanstack/react-start";

export type BackendDiagnostics = {
  connected: boolean;
  provider: string;
  projectRef: string | null;
  region: string | null;
  authConfigured: boolean;
  dbConfigured: boolean;
  healthCheck: "ok" | "error" | "unknown";
  healthError: string | null;
  timestamp: string;
};

function maskRef(ref: string) {
  if (ref.length <= 8) return ref;
  return `${ref.slice(0, 4)}…${ref.slice(-4)}`;
}

function parseRegionFromDbUrl(dbUrl: string | undefined): string | null {
  if (!dbUrl) return null;
  try {
    const match = dbUrl.match(/aws-0-([a-z0-9-]+)\.pooler\.supabase\.com/);
    if (match) return match[1];
  } catch {}
  return null;
}

export const getBackendDiagnostics = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"] || "";
  const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"] || "";
  const dbUrl = process.env["SUPABASE_DB_URL"] || "";

  const projectRefMatch = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/);
  const projectRef = projectRefMatch ? projectRefMatch[1] : null;

  const region = parseRegionFromDbUrl(dbUrl);

  let healthCheck: BackendDiagnostics["healthCheck"] = "unknown";
  let healthError: string | null = null;

  if (url && publishableKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(url, publishableKey, {
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      });
      const { error } = await supabase.from("technicians").select("id", { count: "exact", head: true });
      if (error) {
        healthCheck = "error";
        healthError = error.message;
      } else {
        healthCheck = "ok";
      }
    } catch (e) {
      healthCheck = "error";
      healthError = e instanceof Error ? e.message : String(e);
    }
  }

  return {
    connected: Boolean(url && publishableKey),
    provider: "Lovable Cloud",
    projectRef: projectRef ? maskRef(projectRef) : null,
    region,
    authConfigured: Boolean(publishableKey),
    dbConfigured: Boolean(url),
    healthCheck,
    healthError,
    timestamp: new Date().toISOString(),
  } satisfies BackendDiagnostics;
});
