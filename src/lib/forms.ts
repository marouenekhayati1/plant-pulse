import type { UtilityKind } from "./utilities";

export type FieldType = "number" | "select" | "text" | "boolean";

export type FormField = {
  key: string;
  label: string;
  type: FieldType;
  unit?: string;
  options?: string[];
  isCounter?: boolean;
  group?: string;
};

export type FormSchema = {
  fields: FormField[];
  /** computed values shown in real-time. Returns numeric record. previousCounters: previous reading's counter values */
  compute?: (data: Record<string, any>, prev?: Record<string, any>) => Record<string, number | string>;
};

const N = (key: string, label: string, unit?: string, opts: Partial<FormField> = {}): FormField => ({
  key, label, type: "number", unit, ...opts,
});
const SEL = (key: string, label: string, options: string[]): FormField => ({ key, label, type: "select", options });
const TXT = (key: string, label: string): FormField => ({ key, label, type: "text" });

export const SCHEMAS: Record<UtilityKind, FormSchema> = {
  generator_g1: {
    fields: [
      N("engine_load", "Charge moteur", "%"),
      SEL("oil_level", "Niveau d'huile", ["Min", "Medium", "Max"]),
      N("cyl_min_temp", "Temp. cylindre min", "°C"),
      TXT("cyl_min_id", "ID cylindre min"),
      N("cyl_max_temp", "Temp. cylindre max", "°C"),
      TXT("cyl_max_id", "ID cylindre max"),
      N("exhaust_temp", "Temp. échappement", "°C"),
      N("cooling_in", "Eau refr. entrée", "°C"),
      N("cooling_out", "Eau refr. sortie", "°C"),
      N("superheated_return", "Retour eau surchauffée", "°C"),
    ],
    compute: (d) => {
      const dt = num(d.cooling_out) - num(d.cooling_in);
      return { delta_t_cooling: round(dt) };
    },
  },
  generator_g2: {
    fields: [
      N("engine_load", "Charge moteur", "%"),
      SEL("oil_level", "Niveau d'huile", ["Min", "Medium", "Max"]),
      N("cyl_min_temp", "Temp. cylindre min", "°C"),
      TXT("cyl_min_id", "ID cylindre min"),
      N("cyl_max_temp", "Temp. cylindre max", "°C"),
      TXT("cyl_max_id", "ID cylindre max"),
      N("exhaust_temp", "Temp. échappement", "°C"),
      N("cooling_in", "Eau refr. entrée", "°C"),
      N("cooling_out", "Eau refr. sortie", "°C"),
      N("superheated_return", "Retour eau surchauffée", "°C"),
    ],
    compute: (d) => ({ delta_t_cooling: round(num(d.cooling_out) - num(d.cooling_in)) }),
  },
  osmosis: {
    fields: [
      N("production_flow", "Débit production", "GPM"),
      N("reject_flow", "Débit rejet", "GPM"),
      N("system_pressure", "Pression système", "PSI"),
      N("filter_5_before", "Filtre 5µ avant", "PSI", { group: "Filtres" }),
      N("filter_5_after", "Filtre 5µ après", "PSI", { group: "Filtres" }),
      N("filter_carbon", "Filtre charbon", "PSI", { group: "Filtres" }),
      N("filter_1", "Filtre 1µ", "PSI", { group: "Filtres" }),
      N("water_tank_level", "Niveau cuve eau", "%"),
      N("adj5150_level", "Niveau ADJ5150", "L", { group: "Produits chimiques", isCounter: true }),
      N("mdc704_level", "Niveau MDC704", "L", { group: "Produits chimiques", isCounter: true }),
    ],
    compute: (d, p) => {
      const prod = num(d.production_flow);
      const rej = num(d.reject_flow);
      const total = prod + rej;
      const rejection_rate = total > 0 ? round((rej / total) * 100) : 0;
      const efficiency = total > 0 ? round((prod / total) * 100) : 0;
      const adj_used = p ? round(num(p.adj5150_level) - num(d.adj5150_level)) : 0;
      const mdc_used = p ? round(num(p.mdc704_level) - num(d.mdc704_level)) : 0;
      return { rejection_rate, efficiency, adj5150_consumed: adj_used, mdc704_consumed: mdc_used };
    },
  },
  hot_water: {
    fields: [
      SEL("boiler_mingazzini", "Chaudière Mingazzini en service", ["Oui", "Non"]),
      N("mingazzini_setpoint", "Mingazzini consigne", "°C"),
      N("mingazzini_temp", "Mingazzini température", "°C"),
      N("mingazzini_pressure", "Mingazzini pression", "bar"),
      SEL("boiler_ici", "Chaudière ICI en service", ["Oui", "Non"]),
      N("ici_setpoint", "ICI consigne", "°C"),
      N("ici_temp", "ICI température", "°C"),
      N("ici_pressure", "ICI pression", "bar"),
      N("r2_pressure", "Pression R2", "bar"),
      N("softened_water_counter", "Compteur eau adoucie", "m³", { isCounter: true }),
      N("osmosed_water_counter", "Compteur eau osmosée", "m³", { isCounter: true }),
    ],
    compute: (d, p) => ({
      softened_consumption: p ? round(num(d.softened_water_counter) - num(p.softened_water_counter)) : 0,
      osmosed_consumption: p ? round(num(d.osmosed_water_counter) - num(p.osmosed_water_counter)) : 0,
    }),
  },
  steam_boiler: {
    fields: [
      SEL("boiler_type", "Type chaudière", ["Mingazzini", "Alstom"]),
      N("pressure_setpoint", "Consigne pression", "bar"),
      N("actual_pressure", "Pression réelle", "bar"),
      SEL("boiler_water_level", "Niveau eau chaudière", ["OK", "NOK"]),
      SEL("tank_water_level", "Niveau eau bâche", ["OK", "NOK"]),
      N("osmosed_water_counter", "Compteur eau osmosée", "m³", { isCounter: true }),
      N("softened_water_counter", "Compteur eau adoucie", "m³", { isCounter: true }),
    ],
    compute: (d, p) => ({
      osmosed_consumption: p ? round(num(d.osmosed_water_counter) - num(p.osmosed_water_counter)) : 0,
      softened_consumption: p ? round(num(d.softened_water_counter) - num(p.softened_water_counter)) : 0,
    }),
  },
  water_room: {
    fields: [
      SEL("tank1_level", "Niveau cuve 1", ["OK", "NOK"]),
      SEL("tank2_level", "Niveau cuve 2", ["OK", "NOK"]),
    ],
  },
  chiller: {
    fields: [
      SEL("tower_water_level", "Niveau eau tour", ["OK", "NOK"]),
      N("chilled_in", "Eau glacée entrée", "°C"),
      N("chilled_out", "Eau glacée sortie", "°C"),
      N("tower_in", "Tour entrée", "°C"),
      N("tower_out", "Tour sortie", "°C"),
      N("hot_in", "Eau chaude entrée", "°C"),
      N("hot_out", "Eau chaude sortie", "°C"),
      N("vacuum_pressure", "Pression vide", "mmHg"),
      SEL("libr_level", "Niveau LiBr", ["OK", "NOK"]),
      N("water_counter", "Compteur eau", "m³", { isCounter: true }),
      N("dose_3dt", "Dose 3DT", "L", { group: "Dosage chimique", isCounter: true }),
      N("dose_bio23", "Dose Bio 23", "L", { group: "Dosage chimique", isCounter: true }),
      N("dose_bio125", "Dose Bio 125", "L", { group: "Dosage chimique", isCounter: true }),
    ],
    compute: (d, p) => ({
      water_consumption: p ? round(num(d.water_counter) - num(p.water_counter)) : 0,
      dose_3dt_used: p ? round(num(p.dose_3dt) - num(d.dose_3dt)) : 0,
      dose_bio23_used: p ? round(num(p.dose_bio23) - num(d.dose_bio23)) : 0,
      dose_bio125_used: p ? round(num(p.dose_bio125) - num(d.dose_bio125)) : 0,
    }),
  },
};

function num(v: any): number {
  const n = typeof v === "number" ? v : parseFloat(v);
  return isNaN(n) ? 0 : n;
}
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export const COMPUTED_LABELS: Record<string, { label: string; unit?: string }> = {
  delta_t_cooling: { label: "ΔT refroidissement", unit: "°C" },
  rejection_rate: { label: "Taux de rejet", unit: "%" },
  efficiency: { label: "Efficacité production", unit: "%" },
  adj5150_consumed: { label: "ADJ5150 consommé", unit: "L" },
  mdc704_consumed: { label: "MDC704 consommé", unit: "L" },
  softened_consumption: { label: "Conso. eau adoucie", unit: "m³" },
  osmosed_consumption: { label: "Conso. eau osmosée", unit: "m³" },
  water_consumption: { label: "Conso. eau", unit: "m³" },
  dose_3dt_used: { label: "3DT utilisé", unit: "L" },
  dose_bio23_used: { label: "Bio 23 utilisé", unit: "L" },
  dose_bio125_used: { label: "Bio 125 utilisé", unit: "L" },
};