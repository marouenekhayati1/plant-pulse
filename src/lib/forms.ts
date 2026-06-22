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
  optional?: boolean;
  nightOnly?: boolean;
  hint?: string;
  showIf?: { key: string; equals: string | string[] };
};

export type FormSchema = {
  fields: FormField[];
  /** computed values shown in real-time. Returns numeric record. previousCounters: previous reading's counter values */
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

const ACTIVE_IF = (stateKey: string) => ({ key: stateKey, equals: "Active" });

export const SCHEMAS: Record<UtilityKind, FormSchema> = {
  water_room: {
    fields: [
      N("counter_r1", "Compteur R1", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, nightOnly: true, optional: true }),
      N("counter_r2", "Compteur R2", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, nightOnly: true, optional: true }),
      N("counter_general", "Compteur Général", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, nightOnly: true, optional: true }),
      N("counter_vestiaires", "Compteur Vestiaires", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, nightOnly: true, optional: true }),
      N("counter_process", "Compteur Process", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, nightOnly: true, optional: true }),
      N("counter_adoucisseur", "Compteur Adoucisseur", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, nightOnly: true, optional: true }),
      N("counter_lave_moulle", "Compteur Lave-moulle", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, nightOnly: true, optional: true }),
      N("counter_bvm_tf", "Compteur BVM + TF", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, nightOnly: true, optional: true }),
      N("counter_smt", "Compteur SMT", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, nightOnly: true, optional: true }),

      SEL("master_pump", "Pompe master active", ["Pompe 1", "Pompe 2"], { group: "Pompes & pressions" }),
      N("pressure_pump1", "Pression Pompe 1", "bar", { group: "Pompes & pressions", hint: "Min 5 / Max 6 bar" }),
      N("pressure_pump2", "Pression Pompe 2", "bar", { group: "Pompes & pressions", hint: "Min 5 / Max 6 bar" }),
      N("pressure_quartz1", "Pression Filtre à quartz 1", "bar", { group: "Pompes & pressions", hint: "Min 5 / Max 6 bar" }),
      N("pressure_quartz2", "Pression Filtre à quartz 2", "bar", { group: "Pompes & pressions", hint: "Min 5 / Max 6 bar" }),
      N("pressure_pvc1", "Pression Filtre PVC 1", "bar", { group: "Pompes & pressions", hint: "Min 4 / Max 5 bar" }),
      N("pressure_collect_filtree", "Pression Collecteur Eau Filtrée", "bar", { group: "Pompes & pressions", hint: "Min 4 / Max 5 bar" }),
      N("pressure_collect_adoucie", "Pression Collecteur Eau Adoucie", "bar", { group: "Pompes & pressions", hint: "Min 4 / Max 5 bar" }),
      N("pressure_filtre_inox", "Pression Filtre Inox", "bar", { group: "Pompes & pressions", hint: "Min 4 / Max 5 bar" }),
      N("pressure_pvc2", "Pression Filtre PVC 2", "bar", { group: "Pompes & pressions", hint: "Min 4 / Max 5 bar" }),

      SEL("uv1_lamps", "Lampes actives UV1", ["0", "1", "2"], { group: "UV" }),
      N("uv2_percent", "Pourcentage UV2", "%", { group: "UV", hint: "Min 95 %" }),
      N("uv2_hours", "Heures UV2", "h", { group: "UV" }),
      N("uv3_percent", "Pourcentage UV3", "%", { group: "UV", hint: "Min 95 %" }),
      N("uv3_hours", "Heures UV3", "h", { group: "UV" }),

      SEL("adoucisseur_actif", "Adoucisseur actif", ["1", "2"], { group: "Adoucisseur" }),
      N("regen_counter", "Compteur régénération adoucisseur", undefined, { group: "Adoucisseur", isCounter: true }),
    ],
  },

  hot_water: {
    fields: [
      N("counter_osmosed", "Compteur Eau Osmosée", "m³", { group: "Compteurs", isCounter: true }),
      N("counter_softened", "Compteur Eau Adoucie", "m³", { group: "Compteurs", isCounter: true }),
      N("mf788_added", "Quantité MF788 versée", "L", { group: "Dosage chimique", hint: "Voir quantité recommandée à droite" }),
      N("adg5150_added", "Quantité ADG5150 versée", "L", { group: "Dosage chimique", hint: "Voir quantité recommandée à droite" }),

      N("pressure_r2", "Pression R2", "bar", { group: "Circuits" }),
      N("pressure_es", "Pression Circuit Eau Surchauffée", "bar", { group: "Circuits", hint: "4,8 – 5 bar" }),
      N("temp_es", "Température Circuit Eau Surchauffée", "°C", { group: "Circuits", hint: "131 – 134 °C" }),
      N("pressure_ec", "Pression Circuit Eau Chaude", "bar", { group: "Circuits", hint: "2,5 – 3 bar" }),
      N("temp_ec", "Température Circuit Eau Chaude", "°C", { group: "Circuits", hint: "80 – 90 °C" }),

      SEL("mingazzini_state", "Chaudière Mingazzini", ["Active", "Inactive"], { group: "Chaudière Mingazzini" }),
      N("mingazzini_temp", "Température Mingazzini", "°C", { group: "Chaudière Mingazzini", hint: "131 – 134 °C", showIf: ACTIVE_IF("mingazzini_state"), optional: true }),
      N("mingazzini_pressure", "Pression Mingazzini", "bar", { group: "Chaudière Mingazzini", hint: "2,5 – 3 bar", showIf: ACTIVE_IF("mingazzini_state"), optional: true }),

      SEL("ici_state", "Chaudière ICI", ["Active", "Inactive"], { group: "Chaudière ICI" }),
      N("ici_temp", "Température ICI", "°C", { group: "Chaudière ICI", hint: "131 – 134 °C", showIf: ACTIVE_IF("ici_state"), optional: true }),
      N("ici_pressure", "Pression ICI", "bar", { group: "Chaudière ICI", hint: "2,5 – 3 bar", showIf: ACTIVE_IF("ici_state"), optional: true }),
    ],
    compute: (d, p) => {
      const dOsm = p ? num(d.counter_osmosed) - num(p.counter_osmosed) : 0;
      const dSoft = p ? num(d.counter_softened) - num(p.counter_softened) : 0;
      const total = dOsm + dSoft;
      return {
        consumption_total: round(total),
        mf788_required: round(total * 0.6),
        adg5150_required: round(total * 0.5),
      };
    },
  },

  steam_boiler: {
    fields: [
      N("counter_osmosed", "Compteur Eau Osmosée", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, nightOnly: true, optional: true }),
      N("counter_softened", "Compteur Eau Adoucie", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, nightOnly: true, optional: true }),
      N("dose_tank_level", "Niveau réservoir de dosage", "L", { group: "Dosage", hint: "Quantité recommandée affichée à droite" }),
      N("dose_added", "Quantité de produit versée", "L", { group: "Dosage" }),
      SEL("tank_water_level", "Niveau Eau Bâche", ["= 3/4", "< 3/4", "> 3/4"], { group: "Dosage" }),

      SEL("mingazzini_state", "Chaudière Mingazzini", ["Active", "Inactive"], { group: "Chaudière Mingazzini" }),
      N("mingazzini_pressure", "Pression Mingazzini", "bar", { group: "Chaudière Mingazzini", hint: "4 – 7 bar", showIf: ACTIVE_IF("mingazzini_state"), optional: true }),
      N("mingazzini_purge_time", "Temps de purge Mingazzini", "s", { group: "Chaudière Mingazzini", showIf: ACTIVE_IF("mingazzini_state"), optional: true }),
      N("mingazzini_purge_interval", "Intervalle de purge Mingazzini", "min", { group: "Chaudière Mingazzini", showIf: ACTIVE_IF("mingazzini_state"), optional: true }),

      SEL("alsthom_state", "Chaudière Alsthom", ["Active", "Inactive"], { group: "Chaudière Alsthom" }),
      N("alsthom_pressure", "Pression Alsthom", "bar", { group: "Chaudière Alsthom", hint: "4 – 7 bar", showIf: ACTIVE_IF("alsthom_state"), optional: true }),
      N("alsthom_purge_time", "Temps de purge Alsthom", "s", { group: "Chaudière Alsthom", showIf: ACTIVE_IF("alsthom_state"), optional: true }),
      N("alsthom_purge_interval", "Intervalle de purge Alsthom", "min", { group: "Chaudière Alsthom", showIf: ACTIVE_IF("alsthom_state"), optional: true }),
    ],
    compute: (d) => {
      const lvl = num(d.dose_tank_level);
      const required = 150 - lvl * 0.047;
      return { dose_required: round(required) };
    },
  },

  vacuum_pump: {
    fields: [
      SEL("purge_done", "Purge du circuit (poste de nuit uniquement)", ["Fait", "Non fait"], { group: "Purge", nightOnly: true, optional: true }),
      N("global_pressure", "Pression globale", "mbar", { group: "Pressions" }),
      N("tank_pressure", "Pression réservoir", "mbar", { group: "Pressions" }),
      N("pump1_percent", "% fonctionnement Pompe 1", "%", { group: "Pompe 1" }),
      N("pump1_hours", "Compteur entretien Pompe 1", "h", { group: "Pompe 1", isCounter: true }),
      N("pump2_percent", "% fonctionnement Pompe 2", "%", { group: "Pompe 2" }),
      N("pump2_hours", "Compteur entretien Pompe 2", "h", { group: "Pompe 2", isCounter: true }),
      N("pump3_percent", "% fonctionnement Pompe 3", "%", { group: "Pompe 3" }),
      N("pump3_hours", "Compteur entretien Pompe 3", "h", { group: "Pompe 3", isCounter: true }),
      N("pump4_percent", "% fonctionnement Pompe 4", "%", { group: "Pompe 4" }),
      N("pump4_hours", "Compteur entretien Pompe 4", "h", { group: "Pompe 4", isCounter: true }),
      SEL("leak_inspection", "Inspection fuites (Huile ou Air)", ["Pas de fuite", "Fuite détectée"], { group: "Inspection" }),
      TXT("leak_zone", "Zone de la fuite", { group: "Inspection", showIf: { key: "leak_inspection", equals: "Fuite détectée" }, optional: true }),
    ],
  },

  air_compressor: {
    fields: [
      SEL("purge_done", "Purge du circuit (poste de nuit uniquement)", ["Fait", "Non fait"], { group: "Purge", nightOnly: true, optional: true }),
      ...[2, 3, 4, 5, 6, 7].flatMap((n) => [
        N(`comp${n}_temp`, `Température Compresseur ${n}`, "°C", { group: `Compresseur ${n}` }),
        N(`comp${n}_hours`, `Compteur entretien Compresseur ${n}`, "h", { group: `Compresseur ${n}`, isCounter: true }),
      ]),
      ...[1, 2, 3, 4, 5].map((n) =>
        N(`sech${n}_temp`, `Température Sécheur ${n}`, "°C", { group: "Sécheurs" }),
      ),
      SEL("oil_level", "Inspection niveau d'huile", ["OK", "NOK"], { group: "Inspection" }),
      TXT("oil_detail", "Détail niveau bas", { group: "Inspection", showIf: { key: "oil_level", equals: "NOK" }, optional: true }),
      SEL("leak_inspection", "Inspection fuites (Huile ou Air)", ["Pas de fuite", "Fuite détectée"], { group: "Inspection" }),
      TXT("leak_zone", "Zone de la fuite", { group: "Inspection", showIf: { key: "leak_inspection", equals: "Fuite détectée" }, optional: true }),
    ],
  },

  chiller: {
    fields: [
      // Trane
      SEL("trane_state", "Trane", ["Active", "Inactive"], { group: "❄️ Trane" }),
      N("trane_pressure_reservoir", "Pression Réservoir Trane", "bar", { group: "❄️ Trane", showIf: ACTIVE_IF("trane_state"), optional: true }),
      SEL("trane_purge_air", "Purge de l'air Trane (matin et nuit)", ["Fait", "Non fait"], { group: "❄️ Trane", showIf: ACTIVE_IF("trane_state"), optional: true }),
      N("trane_hp1", "Pression HP Compresseur 1 Trane", "bar", { group: "❄️ Trane", hint: "Réf : 12 bar", showIf: ACTIVE_IF("trane_state"), optional: true }),
      N("trane_bp1", "Pression BP Compresseur 1 Trane", "bar", { group: "❄️ Trane", hint: "Réf : 6 bar", showIf: ACTIVE_IF("trane_state"), optional: true }),
      N("trane_hp2", "Pression HP Compresseur 2 Trane", "bar", { group: "❄️ Trane", hint: "Réf : 12 bar", showIf: ACTIVE_IF("trane_state"), optional: true }),
      N("trane_bp2", "Pression BP Compresseur 2 Trane", "bar", { group: "❄️ Trane", hint: "Réf : 6 bar", showIf: ACTIVE_IF("trane_state"), optional: true }),
      SEL("trane_active_comp", "Compresseur en fonctionnement Trane", ["Compresseur 1", "Compresseur 2"], { group: "❄️ Trane", showIf: ACTIVE_IF("trane_state"), optional: true }),
      N("trane_setpoint", "Consigne Trane", undefined, { group: "❄️ Trane", hint: "Réf : 12", showIf: ACTIVE_IF("trane_state"), optional: true }),
      N("trane_temp_amont", "Température en amont Trane", "°C", { group: "❄️ Trane", showIf: ACTIVE_IF("trane_state"), optional: true }),
      N("trane_temp_aval", "Température en aval Trane", "°C", { group: "❄️ Trane", showIf: ACTIVE_IF("trane_state"), optional: true }),

      // Chiller (LiBr)
      SEL("chiller_state", "Chiller", ["Active", "Inactive"], { group: "❄️ Chiller" }),
      SEL("chiller_tower_level", "Niveau eau tour de refroidissement", ["OK", "Bas", "Haut"], { group: "❄️ Chiller", showIf: ACTIVE_IF("chiller_state"), optional: true }),
      N("chiller_chilled_in", "Température entrée eau glacée", "°C", { group: "❄️ Chiller", showIf: ACTIVE_IF("chiller_state"), optional: true }),
      N("chiller_chilled_out", "Température sortie eau glacée", "°C", { group: "❄️ Chiller", hint: "Max 15 °C", showIf: ACTIVE_IF("chiller_state"), optional: true }),
      N("chiller_tower_in", "Température entrée tour", "°C", { group: "❄️ Chiller", showIf: ACTIVE_IF("chiller_state"), optional: true }),
      N("chiller_tower_out", "Température sortie tour", "°C", { group: "❄️ Chiller", hint: "Max 37 °C", showIf: ACTIVE_IF("chiller_state"), optional: true }),
      N("chiller_hot_in", "Température entrée eau chaude", "°C", { group: "❄️ Chiller", showIf: ACTIVE_IF("chiller_state"), optional: true }),
      N("chiller_hot_out", "Température sortie eau chaude", "°C", { group: "❄️ Chiller", showIf: ACTIVE_IF("chiller_state"), optional: true }),
      N("chiller_vacuum", "Pression vide", "mmHg", { group: "❄️ Chiller", hint: "< 16 mmHg", showIf: ACTIVE_IF("chiller_state"), optional: true }),
      N("chiller_cv", "CV", "%", { group: "❄️ Chiller", showIf: ACTIVE_IF("chiller_state"), optional: true }),
      SEL("chiller_libr_level", "Niveau voyant bromure de lithium", ["OK", "Bas", "Haut"], { group: "❄️ Chiller", showIf: ACTIVE_IF("chiller_state"), optional: true }),

      // York
      SEL("york_state", "York", ["Active", "Inactive"], { group: "❄️ York" }),
      N("york_pressure_reservoir", "Pression Réservoir York", "bar", { group: "❄️ York", showIf: ACTIVE_IF("york_state"), optional: true }),
      SEL("york_purge_air", "Purge de l'air York (matin et nuit)", ["Fait", "Non fait"], { group: "❄️ York", showIf: ACTIVE_IF("york_state"), optional: true }),
      N("york_hp1", "Pression HP Compresseur 1 York", "bar", { group: "❄️ York", hint: "Réf : 12 bar", showIf: ACTIVE_IF("york_state"), optional: true }),
      N("york_bp1", "Pression BP Compresseur 1 York", "bar", { group: "❄️ York", hint: "Réf : 6 bar", showIf: ACTIVE_IF("york_state"), optional: true }),
      N("york_hp2", "Pression HP Compresseur 2 York", "bar", { group: "❄️ York", hint: "Réf : 12 bar", showIf: ACTIVE_IF("york_state"), optional: true }),
      N("york_bp2", "Pression BP Compresseur 2 York", "bar", { group: "❄️ York", hint: "Réf : 6 bar", showIf: ACTIVE_IF("york_state"), optional: true }),
      SEL("york_active_comp", "Compresseur en fonctionnement York", ["Compresseur 1", "Compresseur 2"], { group: "❄️ York", showIf: ACTIVE_IF("york_state"), optional: true }),
      N("york_setpoint", "Consigne York", undefined, { group: "❄️ York", hint: "Réf : 12", showIf: ACTIVE_IF("york_state"), optional: true }),
      N("york_temp_amont", "Température en amont York", "°C", { group: "❄️ York", showIf: ACTIVE_IF("york_state"), optional: true }),
      N("york_temp_aval", "Température en aval York", "°C", { group: "❄️ York", showIf: ACTIVE_IF("york_state"), optional: true }),
    ],
  },

  thermo: {
    fields: [
      TXT("filter1_state", "État filtre thermo 1", { group: "Filtres" }),
      TXT("filter2_state", "État filtre thermo 2", { group: "Filtres" }),
      TXT("filter3_state", "État filtre thermo 3", { group: "Filtres" }),
      TXT("turbine1_inspection", "Inspection turbine thermo 1", { group: "Turbines" }),
      TXT("turbine2_inspection", "Inspection turbine thermo 2", { group: "Turbines" }),
      TXT("turbine3_inspection", "Inspection turbine thermo 3", { group: "Turbines" }),
    ],
  },

  generator_g1: generatorSchema(),
  generator_g2: generatorSchema(),

  osmosis: {
    fields: [
      N("counter_production", "Compteur Production", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, nightOnly: true, optional: true }),
      N("counter_rejection", "Compteur Rejet", "m³", { group: "Compteurs (poste de nuit)", isCounter: true, nightOnly: true, optional: true }),
      N("dose_tank1_level", "Niveau réservoir de dosage 1", "L", { group: "Dosage" }),
      N("dose_tank2_level", "Niveau réservoir de dosage 2", "L", { group: "Dosage" }),
      N("dose1_amount", "Quantité produit 1", "L", { group: "Dosage" }),
      N("dose2_amount", "Quantité produit 2", "L", { group: "Dosage" }),
      N("pressure_primary", "Pression Primaire", "bar", { group: "Pressions" }),
      N("pressure_before_carbon", "Pression avant filtre à charbon", "bar", { group: "Pressions" }),
      N("pressure_after_carbon", "Pression après filtre à charbon", "bar", { group: "Pressions" }),
      N("pressure_after_filters", "Pression après les filtres", "bar", { group: "Pressions" }),
      N("flow_production", "Débit production", "LPM", { group: "Débits" }),
      N("flow_rejection", "Débit rejet", "LPM", { group: "Débits" }),
    ],
  },
};

function generatorSchema(): FormSchema {
  return {
    fields: [
      SEL("state", "État groupe", ["Active", "Inactive"], { group: "État" }),
      N("engine_load", "Charge moteur", "%", { group: "Moteur", hint: "Min 75 %", showIf: ACTIVE_IF("state"), optional: true }),
      SEL("oil_level", "Niveau d'huile", ["ADD", "FULL", "CENTRE"], { group: "Moteur", showIf: ACTIVE_IF("state"), optional: true }),
      N("cyl_min_temp", "Température cylindre min", "°C", { group: "Cylindres", showIf: ACTIVE_IF("state"), optional: true }),
      TXT("cyl_min_id", "N° cylindre min", { group: "Cylindres", showIf: ACTIVE_IF("state"), optional: true }),
      N("cyl_max_temp", "Température cylindre max", "°C", { group: "Cylindres", showIf: ACTIVE_IF("state"), optional: true }),
      TXT("cyl_max_id", "N° cylindre max", { group: "Cylindres", showIf: ACTIVE_IF("state"), optional: true }),
      N("cooling_in", "Température entrée eau refroidissement moteur", "°C", { group: "Refroidissement", showIf: ACTIVE_IF("state"), optional: true }),
      N("cooling_out", "Température sortie eau refroidissement moteur", "°C", { group: "Refroidissement", showIf: ACTIVE_IF("state"), optional: true }),
      N("exhaust_temp", "Température échappement", "°C", { group: "Refroidissement", showIf: ACTIVE_IF("state"), optional: true }),
      N("superheated_return", "Température retour eau surchauffée", "°C", { group: "Refroidissement", showIf: ACTIVE_IF("state"), optional: true }),
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
  consumption_total: { label: "Consommation totale (Osm+Adouc)", unit: "m³" },
  mf788_required: { label: "MF788 à verser (0,6 × m³)", unit: "L" },
  adg5150_required: { label: "ADG5150 à verser (0,5 × m³)", unit: "L" },
  dose_required: { label: "Quantité à verser (150 − niveau × 0,047)", unit: "L" },
};