import { createClient } from "@supabase/supabase-js";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  type CognitoUserSession,
} from "amazon-cognito-identity-js";

const COGNITO_USER_POOL_ID = "us-east-1_NIqaIWN4p";
const COGNITO_CLIENT_ID = "48s3rpim1847lvnfd8pce9glqh";
const WATTNOW_USER_ID = "us-east-1:2e44f066-1ee0-4353-9885-97ee102980bc";
const WATTNOW_API_BASE =
  "https://325qd9g4o9.execute-api.us-east-2.amazonaws.com/dev/apis.wattnow.io";
const WATTNOW_USER_REGION = "us-east-2";

const DEVICE_MAP: Record<string, "randa1" | "randa2" | "randa3" | "aux" | "ge1" | "ge2"> = {
  W3pGNRR01014: "randa1",
  W3pGNRR01015: "randa2",
  W3pGNRR01013: "randa3",
  W3pGNRR01012: "aux",
  W3pGNRR01016: "ge1",
  W3pGNRR01017: "ge2",
};

function getDb() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  }) as unknown as { from: (table: string) => any };
}

type Session = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  deviceKey: string | null;
  userId: string;
  expiresAt: Date;
};

function decodeJwt(token: string): Record<string, unknown> {
  const part = token.split(".")[1];
  if (!part) return {};
  const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  try {
    return JSON.parse(atob(b64 + pad));
  } catch {
    return {};
  }
}

function cognitoLogin(username: string, password: string): Promise<Session> {
  return new Promise((resolve, reject) => {
    const pool = new CognitoUserPool({
      UserPoolId: COGNITO_USER_POOL_ID,
      ClientId: COGNITO_CLIENT_ID,
    });
    const user = new CognitoUser({ Username: username, Pool: pool });
    const auth = new AuthenticationDetails({ Username: username, Password: password });
    user.authenticateUser(auth, {
      onSuccess: (result: CognitoUserSession) => {
        const accessToken = result.getAccessToken().getJwtToken();
        const idToken = result.getIdToken().getJwtToken();
        const refreshToken = result.getRefreshToken().getToken();
        const payload = decodeJwt(accessToken) as { exp?: number; device_key?: string };
        const expSec = payload.exp ?? Math.floor(Date.now() / 1000) + 3600;
        resolve({
          accessToken,
          idToken,
          refreshToken,
          deviceKey: payload.device_key ?? null,
          userId: WATTNOW_USER_ID,
          expiresAt: new Date(expSec * 1000),
        });
      },
      onFailure: (err) => reject(err),
      newPasswordRequired: () => reject(new Error("New password required for WattNow user")),
    });
  });
}

async function loadCachedSession(db: ReturnType<typeof getDb>): Promise<Session | null> {
  const { data } = await db
    .from("wattnow_session")
    .select("*")
    .eq("id", "singleton")
    .maybeSingle();
  if (!data) return null;
  const row = data as {
    access_token: string;
    id_token: string | null;
    refresh_token: string | null;
    device_key: string | null;
    user_id: string;
    expires_at: string;
  };
  return {
    accessToken: row.access_token,
    idToken: row.id_token ?? "",
    refreshToken: row.refresh_token ?? "",
    deviceKey: row.device_key,
    userId: row.user_id,
    expiresAt: new Date(row.expires_at),
  };
}

async function saveSession(db: ReturnType<typeof getDb>, s: Session): Promise<void> {
  await db.from("wattnow_session").upsert({
    id: "singleton",
    access_token: s.accessToken,
    id_token: s.idToken,
    refresh_token: s.refreshToken,
    device_key: s.deviceKey,
    user_id: s.userId,
    expires_at: s.expiresAt.toISOString(),
    updated_at: new Date().toISOString(),
  });
}

async function getValidSession(db: ReturnType<typeof getDb>, forceRefresh = false): Promise<Session> {
  if (!forceRefresh) {
    const cached = await loadCachedSession(db);
    if (cached && cached.expiresAt.getTime() > Date.now() + 60_000) {
      return cached;
    }
  }
  const username = process.env.WATTNOW_USERNAME;
  const password = process.env.WATTNOW_PASSWORD;
  if (!username || !password) {
    throw new Error("WATTNOW_USERNAME / WATTNOW_PASSWORD secrets are not set");
  }
  const fresh = await cognitoLogin(username, password);
  await saveSession(db, fresh);
  return fresh;
}

type RawDevice = {
  deviceId: string;
  device_label: string;
  phase_a_value: string;
  phase_b_value: string;
  phase_c_value: string;
  all_value: string;
  date_hour: string;
};

async function fetchLastValues(
  session: Session
): Promise<RawDevice[] | { unauthorized: true }> {
  const url = `${WATTNOW_API_BASE}/dashboard/realtime/devices/lastValuesByDeviceType/${session.userId}/${session.userId}/tri`;
  const res = await fetch(url, {
    headers: {
      accesstoken: session.accessToken,
      devicekey: session.deviceKey ?? "",
      userregion: WATTNOW_USER_REGION,
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
    },
  });
  if (res.status === 401 || res.status === 403) return { unauthorized: true };
  if (!res.ok) {
    throw new Error(`WattNow API ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as RawDevice[];
}

type RealtimeSnapshot = {
  recordedAt: string;
  randa1_kw: number | null;
  randa2_kw: number | null;
  randa3_kw: number | null;
  aux_kw: number | null;
  ge1_kw: number | null;
  ge2_kw: number | null;
  conso_kw: number;
  prod_kw: number;
  delta_kw: number;
  stale: boolean;
  error?: string;
};

function toKw(watts: string | null | undefined): number | null {
  if (watts == null) return null;
  const v = parseFloat(watts);
  if (!isFinite(v)) return null;
  return v / 1000;
}

async function lastSnapshotFallback(
  db: ReturnType<typeof getDb>,
  error: string
): Promise<RealtimeSnapshot> {
  const { data } = await db
    .from("wattnow_snapshots")
    .select("*")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) {
    return {
      recordedAt: new Date().toISOString(),
      randa1_kw: null, randa2_kw: null, randa3_kw: null, aux_kw: null,
      ge1_kw: null, ge2_kw: null,
      conso_kw: 0, prod_kw: 0, delta_kw: 0,
      stale: true, error,
    };
  }
  const r = data as any;
  return {
    recordedAt: r.recorded_at,
    randa1_kw: r.randa1_kw, randa2_kw: r.randa2_kw, randa3_kw: r.randa3_kw,
    aux_kw: r.aux_kw,
    ge1_kw: r.ge1_kw, ge2_kw: r.ge2_kw,
    conso_kw: Number(r.conso_kw) || 0,
    prod_kw: Number(r.prod_kw) || 0,
    delta_kw: Number(r.delta_kw) || 0,
    stale: true, error,
  };
}

async function pollWattNow(db: ReturnType<typeof getDb>): Promise<RealtimeSnapshot> {
  try {
    let session = await getValidSession(db);
    let raw = await fetchLastValues(session);
    if ("unauthorized" in raw) {
      session = await getValidSession(db, true);
      raw = await fetchLastValues(session);
      if ("unauthorized" in raw) {
        return lastSnapshotFallback(db, "WattNow refused even after re-login");
      }
    }
    const slots: Record<string, number | null> = {
      randa1: null, randa2: null, randa3: null, aux: null, ge1: null, ge2: null,
    };
    for (const d of raw) {
      const slot = DEVICE_MAP[d.deviceId];
      if (slot) slots[slot] = toKw(d.all_value);
    }
    const conso =
      (slots.randa1 ?? 0) + (slots.randa2 ?? 0) + (slots.randa3 ?? 0) + (slots.aux ?? 0) * 2;
    const prod = (slots.ge1 ?? 0) + (slots.ge2 ?? 0);
    const delta = prod - conso;
    const recordedAt = new Date().toISOString();

    await db.from("wattnow_snapshots").insert({
      recorded_at: recordedAt,
      randa1_kw: slots.randa1, randa2_kw: slots.randa2, randa3_kw: slots.randa3,
      aux_kw: (slots.aux ?? 0) * 2,
      ge1_kw: slots.ge1, ge2_kw: slots.ge2,
      conso_kw: conso, prod_kw: prod, delta_kw: delta,
      raw,
    });

    return {
      recordedAt,
      randa1_kw: slots.randa1, randa2_kw: slots.randa2, randa3_kw: slots.randa3,
      aux_kw: (slots.aux ?? 0) * 2,
      ge1_kw: slots.ge1, ge2_kw: slots.ge2,
      conso_kw: conso, prod_kw: prod, delta_kw: delta,
      stale: false,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[wattnow] poll failed:", msg);
    return lastSnapshotFallback(db, msg);
  }
}

async function loadRecentSnapshots(db: ReturnType<typeof getDb>, limit = 60) {
  const { data } = await db
    .from("wattnow_snapshots")
    .select(
      "recorded_at, randa1_kw, randa2_kw, randa3_kw, aux_kw, ge1_kw, ge2_kw, conso_kw, prod_kw, delta_kw"
    )
    .order("recorded_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as any[]).reverse();
}

async function loadDailyTrend(db: ReturnType<typeof getDb>) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await db
    .from("wattnow_snapshots")
    .select("recorded_at, conso_kw, prod_kw")
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true });

  const hourly: Record<string, { conso: number; prod: number; count: number }> = {};
  for (const row of (data ?? []) as any[]) {
    const hour = new Date(row.recorded_at).toISOString().slice(0, 13) + ":00:00";
    if (!hourly[hour]) hourly[hour] = { conso: 0, prod: 0, count: 0 };
    hourly[hour].conso += Number(row.conso_kw) || 0;
    hourly[hour].prod += Number(row.prod_kw) || 0;
    hourly[hour].count++;
  }

  return Object.entries(hourly).map(([hour, vals]) => ({
    hour,
    conso: vals.conso / vals.count,
    prod: vals.prod / vals.count,
  }));
}

export default async function handler() {
  try {
    const db = getDb();
    const current = await pollWattNow(db);
    const history = await loadRecentSnapshots(db, 60);
    const trend24h = await loadDailyTrend(db);

    return new Response(JSON.stringify({ current, history, trend24h }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[wattnow-realtime] handler error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
