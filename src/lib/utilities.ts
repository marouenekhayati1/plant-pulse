export type UtilityKind =
  | "generator_g1"
  | "generator_g2"
  | "osmosis"
  | "hot_water"
  | "steam_boiler"
  | "water_room"
  | "chiller"
  | "vacuum_pump"
  | "air_compressor"
  | "thermo";

export const UTILITIES: { value: UtilityKind; label: string; icon: string }[] = [
  { value: "water_room", label: "Salle de traitement d'eau", icon: "🚰" },
  { value: "hot_water", label: "Chaudière Eau Surchauffée", icon: "🔥" },
  { value: "steam_boiler", label: "Chaudière à Vapeur", icon: "♨️" },
  { value: "vacuum_pump", label: "Pompe à Vide", icon: "🌀" },
  { value: "air_compressor", label: "Compresseur d'Air", icon: "💨" },
  { value: "chiller", label: "Eau Glacée", icon: "❄️" },
  { value: "thermo", label: "Thermoventilation", icon: "🌬️" },
  { value: "generator_g1", label: "Groupe Électrogène G1", icon: "⚡" },
  { value: "generator_g2", label: "Groupe Électrogène G2", icon: "⚡" },
  { value: "osmosis", label: "Station d'Osmose", icon: "💧" },
];

export function utilityLabel(u: UtilityKind): string {
  return UTILITIES.find((x) => x.value === u)?.label ?? u;
}

export function getGuardPost(date = new Date()): 1 | 2 | 3 {
  const h = date.getHours();
  if (h >= 6 && h < 14) return 1;
  if (h >= 14 && h < 20) return 2;
  return 3;
}

export function guardPostLabel(p: number): string {
  if (p === 1) return "Poste 1 (06h–14h)";
  if (p === 2) return "Poste 2 (14h–20h)";
  return "Poste 3 (20h–06h)";
}

export type Threshold = {
  field_key: string;
  label: string;
  min_value: number | null;
  max_value: number | null;
  warn_min: number | null;
  warn_max: number | null;
  unit: string | null;
};

export type Status = "ok" | "warning" | "critical";

export function statusFor(value: number | null | undefined, t?: Threshold): Status {
  if (value === null || value === undefined || isNaN(value) || !t) return "ok";
  const { min_value, max_value, warn_min, warn_max } = t;
  if (
    (min_value !== null && value < min_value) ||
    (max_value !== null && value > max_value)
  )
    return "critical";
  if (
    (warn_min !== null && value < warn_min) ||
    (warn_max !== null && value > warn_max)
  )
    return "warning";
  return "ok";
}

export function statusColor(s: Status): string {
  if (s === "critical") return "bg-destructive text-destructive-foreground";
  if (s === "warning") return "bg-warning text-warning-foreground";
  return "bg-success text-success-foreground";
}

export function statusDot(s: Status): string {
  if (s === "critical") return "bg-destructive";
  if (s === "warning") return "bg-warning";
  return "bg-success";
}