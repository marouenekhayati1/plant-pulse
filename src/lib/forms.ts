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
  /** field is required only on certain guard posts (1=matin, 2=après-midi, 3=nuit) */
  postsOnly?: (1 | 2 | 3)[];
  /** show only when another field has one of these values */
  dependsOn?: { key: string; values: any[] };
  /** field is optional even if visible (no required-check) */
  optional?: boolean;
};

export type FormSchema = {
  fields: FormField[];
  compute?: (data: Record<string, any>, prev?: Record<string, any>) => Record<string, number | string>;
};

const N = (key: string, label: string, unit?: string, opts: Partial<FormField> = {}): FormField => ({
  key, label, type: "number", unit, ...opts,
});
const SEL = (key: string, label: string, options: string[], opts: Partial<FormField> = {}): FormField => ({
  key, label, type: "select", options, ...opts,
});
const TXT = (key: string, label: string, opts: Partial<FormField> = {}): FormField => ({
  key, label, type: "text", ...opts,
});

const ACTIVE_DEP = (stateKey: string) => ({ key: stateKey, values: ["Active"] });
const NIGHT: (1 | 2 | 3)[] = [3];
const MORNING_NIGHT: (1 | 2 | 3)[] = [1, 3];

export const SCHEMAS: Record<UtilityKind, FormSchema> = {
  // ─────────────────────────── Salle de traitement d'eau
  water_room: {
    fields: [
      N("counter_r1", "Compteur R1", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, postsOnly: NIGHT }),
      N("counter_r2", "Compteur R2", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, postsOnly: NIGHT }),
      N("counter_general", "Compteur Général", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, postsOnly: NIGHT }),
      N("counter_vestiaires", "Compteur Vestiaires", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, postsOnly: NIGHT }),
      N("counter_process", "Compteur Process", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, postsOnly: NIGHT }),
      N("counter_adoucisseur", "Compteur Adoucisseur", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, postsOnly: NIGHT }),
      N("counter_lave_moulle", "Compteur Lave-moulle", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, postsOnly: NIGHT }),
      N("counter_bvm_tf", "Compteur BVM + TF", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, postsOnly: NIGHT }),
      N("counter_smt", "Compteur SMT", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, postsOnly: NIGHT }),

      SEL("pompe_master", "Pompe master active", ["Pompe 1", "Pompe 2"], { group: "Pompes" }),
      N("pressure_pompe1", "Pression Pompe 1", "bar", { group: "Pompes" }),
      N("pressure_pompe2", "Pression Pompe 2", "bar", { group: "Pompes" }),

      N("pressure_quartz1", "Pression Filtre à quartz 1", "bar", { group: "Filtres" }),
      N("pressure_quartz2", "Pression Filtre à quartz 2", "bar", { group: "Filtres" }),
      N("pressure_pvc1", "Pression Filtre PVC 1", "bar", { group: "Filtres" }),
      N("pressure_collect_filtree", "Pression Collecteur Eau Filtrée", "bar", { group: "Filtres" }),
      N("pressure_collect_adoucie", "Pression Collecteur Eau Adoucie", "bar", { group: "Filtres" }),
      N("pressure_inox", "Pression Filtre Inox", "bar", { group: "Filtres" }),
      N("pressure_pvc2", "Pression Filtre PVC 2", "bar", { group: "Filtres" }),

      SEL("uv1_lamps", "Lampes actives UV1", ["0", "1", "2"], { group: "UV" }),
      N("uv2_percent", "Pourcentage UV2", "%", { group: "UV" }),
      N("uv2_hours", "Heures UV2", "h", { group: "UV" }),
      N("uv3_percent", "Pourcentage UV3", "%", { group: "UV" }),
      N("uv3_hours", "Heures UV3", "h", { group: "UV" }),

      SEL("adoucisseur_actif", "Adoucisseur actif", ["1", "2"], { group: "Adoucisseur" }),
      N("regen_counter", "Compteur de régénération adoucisseur", "", { group: "Adoucisseur", isCounter: true }),
    ],
    compute: (d, p) => {
      if (!p) return {};
      const keys = ["counter_r1","counter_r2","counter_general","counter_vestiaires","counter_process","counter_adoucisseur","counter_lave_moulle","counter_bvm_tf","counter_smt"];
      const out: Record<string, number> = {};
      for (const k of keys) {
        if (d[k] !== undefined && p[k] !== undefined) out[`${k}_delta`] = round(num(d[k]) - num(p[k]));
      }
      return out;
    },
  },

  // ─────────────────────────── Chaudière Eau Surchauffée
  hot_water: {
    fields: [
      N("osmosed_counter", "Compteur Eau Osmosée", "m³", { group: "Compteurs", isCounter: true }),
      N("softened_counter", "Compteur Eau Adoucie", "m³", { group: "Compteurs", isCounter: true }),
      N("mf788_versee", "Quantité MF788 versée", "L", { group: "Dosage chimique" }),
      N("adg5150_versee", "Quantité ADG5150 versée", "L", { group: "Dosage chimique" }),

      N("r2_pressure", "Pression R2", "bar", { group: "Circuit" }),
      N("surchauffee_pressure", "Pression Circuit Eau Surchauffée", "bar", { group: "Circuit" }),
      N("surchauffee_temp", "Température Circuit Eau Surchauffée", "°C", { group: "Circuit" }),
      N("chaude_pressure", "Pression Circuit Eau Chaude", "bar", { group: "Circuit" }),
      N("chaude_temp", "Température Circuit Eau Chaude", "°C", { group: "Circuit" }),

      SEL("mingazzini_state", "État Chaudière Mingazzini", ["Active", "Inactive"], { group: "Chaudière Mingazzini" }),
      N("mingazzini_temp", "Mingazzini température", "°C", { group: "Chaudière Mingazzini", dependsOn: ACTIVE_DEP("mingazzini_state") }),
      N("mingazzini_pressure", "Mingazzini pression", "bar", { group: "Chaudière Mingazzini", dependsOn: ACTIVE_DEP("mingazzini_state") }),

      SEL("ici_state", "État Chaudière ICI", ["Active", "Inactive"], { group: "Chaudière ICI" }),
      N("ici_temp", "ICI température", "°C", { group: "Chaudière ICI", dependsOn: ACTIVE_DEP("ici_state") }),
      N("ici_pressure", "ICI pression", "bar", { group: "Chaudière ICI", dependsOn: ACTIVE_DEP("ici_state") }),
    ],
    compute: (d, p) => {
      const dOsm = p ? num(d.osmosed_counter) - num(p.osmosed_counter) : 0;
      const dAd = p ? num(d.softened_counter) - num(p.softened_counter) : 0;
      const total = dOsm + dAd;
      return {
        osmosed_consumption: round(dOsm),
        softened_consumption: round(dAd),
        mf788_required: round(0.6 * total),
        adg5150_required: round(0.5 * total),
      };
    },
  },

  // ─────────────────────────── Chaudière à Vapeur
  steam_boiler: {
    fields: [
      N("osmosed_counter", "Compteur Eau Osmosée", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, postsOnly: NIGHT }),
      N("softened_counter", "Compteur Eau Adoucie", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, postsOnly: NIGHT }),
      N("dosing_tank_level", "Niveau du réservoir de dosage", "", { group: "Dosage" }),
      N("product_versee", "Quantité de produit versée", "L", { group: "Dosage" }),
      SEL("bache_level", "Niveau Eau Bâche", ["= 3/4", "< 3/4", "> 3/4"], { group: "Bâche" }),

      SEL("mingazzini_state", "État Chaudière Mingazzini", ["Active", "Inactive"], { group: "Chaudière Mingazzini" }),
      N("mingazzini_pressure", "Mingazzini pression", "bar", { group: "Chaudière Mingazzini", dependsOn: ACTIVE_DEP("mingazzini_state") }),
      N("mingazzini_purge_time", "Mingazzini temps de purge", "s", { group: "Chaudière Mingazzini", dependsOn: ACTIVE_DEP("mingazzini_state") }),
      N("mingazzini_purge_interval", "Mingazzini intervalle de purge", "min", { group: "Chaudière Mingazzini", dependsOn: ACTIVE_DEP("mingazzini_state") }),

      SEL("alsthom_state", "État Chaudière Alsthom", ["Active", "Inactive"], { group: "Chaudière Alsthom" }),
      N("alsthom_pressure", "Alsthom pression", "bar", { group: "Chaudière Alsthom", dependsOn: ACTIVE_DEP("alsthom_state") }),
      N("alsthom_purge_time", "Alsthom temps de purge", "s", { group: "Chaudière Alsthom", dependsOn: ACTIVE_DEP("alsthom_state") }),
      N("alsthom_purge_interval", "Alsthom intervalle de purge", "min", { group: "Chaudière Alsthom", dependsOn: ACTIVE_DEP("alsthom_state") }),
    ],
    compute: (d, p) => ({
      osmosed_consumption: p ? round(num(d.osmosed_counter) - num(p.osmosed_counter)) : 0,
      softened_consumption: p ? round(num(d.softened_counter) - num(p.softened_counter)) : 0,
      product_required: round(150 - num(d.dosing_tank_level) * 0.047),
    }),
  },

  // ─────────────────────────── Pompe à Vide
  vacuum_pump: {
    fields: [
      SEL("circuit_purge", "Purge du circuit (poste de nuit)", ["Fait", "Non fait"], { group: "Circuit", postsOnly: NIGHT }),
      N("global_pressure", "Pression globale", "mbar", { group: "Circuit" }),
      N("tank_pressure", "Pression réservoir", "mbar", { group: "Circuit" }),

      N("pump1_percent", "% fonctionnement Pompe 1", "%", { group: "Pompes" }),
      N("pump1_counter", "Compteur entretien Pompe 1", "h", { group: "Pompes" }),
      N("pump2_percent", "% fonctionnement Pompe 2", "%", { group: "Pompes" }),
      N("pump2_counter", "Compteur entretien Pompe 2", "h", { group: "Pompes" }),
      N("pump3_percent", "% fonctionnement Pompe 3", "%", { group: "Pompes" }),
      N("pump3_counter", "Compteur entretien Pompe 3", "h", { group: "Pompes" }),
      N("pump4_percent", "% fonctionnement Pompe 4", "%", { group: "Pompes" }),
      N("pump4_counter", "Compteur entretien Pompe 4", "h", { group: "Pompes" }),

      SEL("leak_inspection", "Inspection fuites", ["Pas de fuite", "Fuite détectée"], { group: "Inspection" }),
      TXT("leak_zone", "Zone de la fuite", { group: "Inspection", dependsOn: { key: "leak_inspection", values: ["Fuite détectée"] } }),
    ],
  },

  // ─────────────────────────── Compresseur d'Air
  air_compressor: {
    fields: [
      SEL("circuit_purge", "Purge du circuit (poste de nuit)", ["Fait", "Non fait"], { group: "Circuit", postsOnly: NIGHT }),

      N("comp2_temp", "Température Compresseur 2", "°C", { group: "Compresseurs" }),
      N("comp2_counter", "Compteur entretien Compresseur 2", "h", { group: "Compresseurs" }),
      N("comp3_temp", "Température Compresseur 3", "°C", { group: "Compresseurs" }),
      N("comp3_counter", "Compteur entretien Compresseur 3", "h", { group: "Compresseurs" }),
      N("comp4_temp", "Température Compresseur 4", "°C", { group: "Compresseurs" }),
      N("comp4_counter", "Compteur entretien Compresseur 4", "h", { group: "Compresseurs" }),
      N("comp5_temp", "Température Compresseur 5", "°C", { group: "Compresseurs" }),
      N("comp5_counter", "Compteur entretien Compresseur 5", "h", { group: "Compresseurs" }),
      N("comp6_temp", "Température Compresseur 6", "°C", { group: "Compresseurs" }),
      N("comp6_counter", "Compteur entretien Compresseur 6", "h", { group: "Compresseurs" }),
      N("comp7_temp", "Température Compresseur 7", "°C", { group: "Compresseurs" }),
      N("comp7_counter", "Compteur entretien Compresseur 7", "h", { group: "Compresseurs" }),

      N("secheur1_temp", "Température Sécheur 1", "°C", { group: "Sécheurs" }),
      N("secheur2_temp", "Température Sécheur 2", "°C", { group: "Sécheurs" }),
      N("secheur3_temp", "Température Sécheur 3", "°C", { group: "Sécheurs" }),
      N("secheur4_temp", "Température Sécheur 4", "°C", { group: "Sécheurs" }),
      N("secheur5_temp", "Température Sécheur 5", "°C", { group: "Sécheurs" }),

      SEL("oil_inspection", "Inspection niveau d'huile", ["OK", "NOK"], { group: "Inspection" }),
      TXT("oil_detail", "Détail si NOK (niveau bas)", { group: "Inspection", dependsOn: { key: "oil_inspection", values: ["NOK"] } }),
      SEL("leak_inspection", "Inspection fuites", ["Pas de fuite", "Fuite détectée"], { group: "Inspection" }),
      TXT("leak_zone", "Zone de la fuite", { group: "Inspection", dependsOn: { key: "leak_inspection", values: ["Fuite détectée"] } }),
    ],
  },

  // ─────────────────────────── Eau Glacée (Trane + Chiller absorption + York)
  chiller: {
    fields: [
      SEL("trane_state", "État Trane", ["Active", "Inactive"], { group: "Trane" }),
      N("trane_tank_pressure", "Trane — Pression réservoir", "bar", { group: "Trane", dependsOn: ACTIVE_DEP("trane_state") }),
      SEL("trane_air_purge", "Trane — Purge air (matin/nuit)", ["Fait", "Non fait"], { group: "Trane", dependsOn: ACTIVE_DEP("trane_state"), postsOnly: MORNING_NIGHT }),
      N("trane_hp_c1", "Trane — Pression HP Compresseur 1", "bar", { group: "Trane", dependsOn: ACTIVE_DEP("trane_state") }),
      N("trane_bp_c1", "Trane — Pression BP Compresseur 1", "bar", { group: "Trane", dependsOn: ACTIVE_DEP("trane_state") }),
      N("trane_hp_c2", "Trane — Pression HP Compresseur 2", "bar", { group: "Trane", dependsOn: ACTIVE_DEP("trane_state") }),
      N("trane_bp_c2", "Trane — Pression BP Compresseur 2", "bar", { group: "Trane", dependsOn: ACTIVE_DEP("trane_state") }),
      SEL("trane_comp_active", "Trane — Compresseur en fonctionnement", ["Compresseur 1", "Compresseur 2"], { group: "Trane", dependsOn: ACTIVE_DEP("trane_state") }),
      N("trane_setpoint", "Trane — Consigne", "", { group: "Trane", dependsOn: ACTIVE_DEP("trane_state") }),
      N("trane_temp_in", "Trane — Température amont", "°C", { group: "Trane", dependsOn: ACTIVE_DEP("trane_state") }),
      N("trane_temp_out", "Trane — Température aval", "°C", { group: "Trane", dependsOn: ACTIVE_DEP("trane_state") }),

      SEL("chiller_state", "État Chiller absorption", ["Active", "Inactive"], { group: "Chiller absorption" }),
      SEL("chiller_tower_level", "Niveau eau tour de refroidissement", ["OK", "Bas", "Haut"], { group: "Chiller absorption", dependsOn: ACTIVE_DEP("chiller_state") }),
      N("chilled_in", "Température entrée eau glacée", "°C", { group: "Chiller absorption", dependsOn: ACTIVE_DEP("chiller_state") }),
      N("chilled_out", "Température sortie eau glacée", "°C", { group: "Chiller absorption", dependsOn: ACTIVE_DEP("chiller_state") }),
      N("tower_in", "Température entrée tour", "°C", { group: "Chiller absorption", dependsOn: ACTIVE_DEP("chiller_state") }),
      N("tower_out", "Température sortie tour", "°C", { group: "Chiller absorption", dependsOn: ACTIVE_DEP("chiller_state") }),
      N("hot_in", "Température entrée eau chaude", "°C", { group: "Chiller absorption", dependsOn: ACTIVE_DEP("chiller_state") }),
      N("hot_out", "Température sortie eau chaude", "°C", { group: "Chiller absorption", dependsOn: ACTIVE_DEP("chiller_state") }),
      N("vacuum_pressure", "Pression vide", "mmHg", { group: "Chiller absorption", dependsOn: ACTIVE_DEP("chiller_state") }),
      N("cv", "CV", "%", { group: "Chiller absorption", dependsOn: ACTIVE_DEP("chiller_state") }),
      SEL("libr_level", "Niveau voyant bromure de lithium", ["OK", "Bas", "Haut"], { group: "Chiller absorption", dependsOn: ACTIVE_DEP("chiller_state") }),

      SEL("york_state", "État York", ["Active", "Inactive"], { group: "York" }),
      N("york_tank_pressure", "York — Pression réservoir", "bar", { group: "York", dependsOn: ACTIVE_DEP("york_state") }),
      SEL("york_air_purge", "York — Purge air (matin/nuit)", ["Fait", "Non fait"], { group: "York", dependsOn: ACTIVE_DEP("york_state"), postsOnly: MORNING_NIGHT }),
      N("york_hp_c1", "York — Pression HP Compresseur 1", "bar", { group: "York", dependsOn: ACTIVE_DEP("york_state") }),
      N("york_bp_c1", "York — Pression BP Compresseur 1", "bar", { group: "York", dependsOn: ACTIVE_DEP("york_state") }),
      N("york_hp_c2", "York — Pression HP Compresseur 2", "bar", { group: "York", dependsOn: ACTIVE_DEP("york_state") }),
      N("york_bp_c2", "York — Pression BP Compresseur 2", "bar", { group: "York", dependsOn: ACTIVE_DEP("york_state") }),
      SEL("york_comp_active", "York — Compresseur en fonctionnement", ["Compresseur 1", "Compresseur 2"], { group: "York", dependsOn: ACTIVE_DEP("york_state") }),
      N("york_setpoint", "York — Consigne", "", { group: "York", dependsOn: ACTIVE_DEP("york_state") }),
      N("york_temp_in", "York — Température amont", "°C", { group: "York", dependsOn: ACTIVE_DEP("york_state") }),
      N("york_temp_out", "York — Température aval", "°C", { group: "York", dependsOn: ACTIVE_DEP("york_state") }),
    ],
    compute: (d) => ({
      delta_chilled: round(num(d.chilled_in) - num(d.chilled_out)),
      delta_tower: round(num(d.tower_out) - num(d.tower_in)),
      delta_hot: round(num(d.hot_in) - num(d.hot_out)),
    }),
  },

  // ─────────────────────────── Thermoventilation
  thermo: {
    fields: [
      TXT("filter_thermo_1", "État filtre thermo 1", { group: "Filtres" }),
      TXT("filter_thermo_2", "État filtre thermo 2", { group: "Filtres" }),
      TXT("filter_thermo_3", "État filtre thermo 3", { group: "Filtres" }),
      TXT("turbine_thermo_1", "Inspection turbine thermo 1", { group: "Turbines" }),
      TXT("turbine_thermo_2", "Inspection turbine thermo 2", { group: "Turbines" }),
      TXT("turbine_thermo_3", "Inspection turbine thermo 3", { group: "Turbines" }),
    ],
  },

  // ─────────────────────────── Groupes Électrogènes
  generator_g1: generatorSchema(),
  generator_g2: generatorSchema(),

  // ─────────────────────────── Station d'Osmose
  osmosis: {
    fields: [
      N("production_counter", "Compteur Production", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, postsOnly: NIGHT }),
      N("reject_counter", "Compteur Rejet", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, postsOnly: NIGHT }),

      N("dosing_tank_1_level", "Niveau du réservoir de dosage 1", "L", { group: "Dosage", isCounter: true }),
      N("dosing_tank_2_level", "Niveau du réservoir de dosage 2", "L", { group: "Dosage", isCounter: true }),
      N("product_1_qty", "Quantité de produit 1", "L", { group: "Dosage" }),
      N("product_2_qty", "Quantité de produit 2", "L", { group: "Dosage" }),

      N("primary_pressure", "Pression Primaire", "bar", { group: "Pressions" }),
      N("before_carbon", "Pression avant filtre à charbon", "bar", { group: "Pressions" }),
      N("after_carbon", "Pression après filtre à charbon", "bar", { group: "Pressions" }),
      N("after_filters", "Pression après les filtres", "bar", { group: "Pressions" }),

      N("production_flow", "Débit production", "LPM", { group: "Débits" }),
      N("reject_flow", "Débit rejet", "LPM", { group: "Débits" }),
    ],
    compute: (d, p) => {
      const prod = num(d.production_flow);
      const rej = num(d.reject_flow);
      const total = prod + rej;
      const rejection_rate = total > 0 ? round((rej / total) * 100) : 0;
      const efficiency = total > 0 ? round((prod / total) * 100) : 0;
      const tank1_used = p ? round(num(p.dosing_tank_1_level) - num(d.dosing_tank_1_level)) : 0;
      const tank2_used = p ? round(num(p.dosing_tank_2_level) - num(d.dosing_tank_2_level)) : 0;
      return { rejection_rate, efficiency, dosing_1_consumed: tank1_used, dosing_2_consumed: tank2_used };
    },
  },
};

function generatorSchema(): FormSchema {
  return {
    fields: [
      SEL("state", "État du groupe", ["Active", "Inactive"], { group: "État" }),
      N("engine_load", "Charge moteur", "%", { group: "Moteur", dependsOn: ACTIVE_DEP("state") }),
      SEL("oil_level", "Niveau d'huile", ["ADD", "CENTRE", "FULL"], { group: "Moteur", dependsOn: ACTIVE_DEP("state") }),
      N("cyl_min_temp", "Température cylindre min", "°C", { group: "Cylindres", dependsOn: ACTIVE_DEP("state") }),
      TXT("cyl_min_id", "N° Cylindre min", { group: "Cylindres", dependsOn: ACTIVE_DEP("state") }),
      N("cyl_max_temp", "Température cylindre max", "°C", { group: "Cylindres", dependsOn: ACTIVE_DEP("state") }),
      TXT("cyl_max_id", "N° Cylindre max", { group: "Cylindres", dependsOn: ACTIVE_DEP("state") }),
      N("cooling_in", "Eau refr. entrée", "°C", { group: "Refroidissement", dependsOn: ACTIVE_DEP("state") }),
      N("cooling_out", "Eau refr. sortie", "°C", { group: "Refroidissement", dependsOn: ACTIVE_DEP("state") }),
      N("exhaust_temp", "Température échappement", "°C", { group: "Refroidissement", dependsOn: ACTIVE_DEP("state") }),
      N("superheated_return", "Retour eau surchauffée", "°C", { group: "Refroidissement", dependsOn: ACTIVE_DEP("state") }),
    ],
    compute: (d) => ({ delta_t_cooling: round(num(d.cooling_out) - num(d.cooling_in)) }),
  };
}

function num(v: any): number {
  const n = typeof v === "number" ? v : parseFloat(v);
  return isNaN(n) ? 0 : n;
}
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export const COMPUTED_LABELS: Record<string, { label: string; unit?: string }> = {
  delta_t_cooling: { label: "ΔT refroidissement", unit: "°C" },
  delta_chilled: { label: "ΔT eau glacée", unit: "°C" },
  delta_tower: { label: "ΔT tour", unit: "°C" },
  delta_hot: { label: "ΔT eau chaude", unit: "°C" },
  rejection_rate: { label: "Taux de rejet", unit: "%" },
  efficiency: { label: "Efficacité production", unit: "%" },
  dosing_1_consumed: { label: "Dosage 1 consommé", unit: "L" },
  dosing_2_consumed: { label: "Dosage 2 consommé", unit: "L" },
  softened_consumption: { label: "Conso. eau adoucie", unit: "m³" },
  osmosed_consumption: { label: "Conso. eau osmosée", unit: "m³" },
  mf788_required: { label: "MF788 à verser", unit: "L" },
  adg5150_required: { label: "ADG5150 à verser", unit: "L" },
  product_required: { label: "Produit à verser", unit: "L" },
  counter_r1_delta: { label: "Δ Compteur R1", unit: "m³" },
  counter_r2_delta: { label: "Δ Compteur R2", unit: "m³" },
  counter_general_delta: { label: "Δ Compteur Général", unit: "m³" },
  counter_vestiaires_delta: { label: "Δ Compteur Vestiaires", unit: "m³" },
  counter_process_delta: { label: "Δ Compteur Process", unit: "m³" },
  counter_adoucisseur_delta: { label: "Δ Compteur Adoucisseur", unit: "m³" },
  counter_lave_moulle_delta: { label: "Δ Compteur Lave-moulle", unit: "m³" },
  counter_bvm_tf_delta: { label: "Δ Compteur BVM+TF", unit: "m³" },
  counter_smt_delta: { label: "Δ Compteur SMT", unit: "m³" },
};