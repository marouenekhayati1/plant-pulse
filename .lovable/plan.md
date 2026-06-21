## Mise à jour des check-lists

Refonte complète de `src/lib/forms.ts` (schémas de formulaires) et `src/lib/utilities.ts` (liste des utilités + seuils par défaut) pour refléter les nouvelles check-lists fournies.

### Nouvelles utilités

```text
water_room       → Salle de traitement d'eau
hot_water        → Chaudière Eau Surchauffée
steam_boiler     → Chaudière à Vapeur
vacuum_pump      → Pompe à Vide          (NOUVEAU)
air_compressor   → Compresseur d'Air     (NOUVEAU)
chiller          → Eau Glacée (Trane + Chiller absorption + York)
thermo           → Thermoventilation     (NOUVEAU)
generator_g1     → Groupe Électrogène 1
generator_g2     → Groupe Électrogène 2
osmosis          → Station d'Osmose
```

### Champs par utilité

Chaque schéma reprend exactement les champs listés (compteurs, pressions, températures, états ▢, commentaires). Les champs marqués "Poste de nuit uniquement" / "Postes matin et nuit" deviennent visibles selon le poste détecté (`getGuardPost()`), sinon optionnels. Les champs « Si active » s'affichent conditionnellement après le sélecteur d'état.

### Calculs temps réel (compute)

- **water_room** : consommations par compteur (actuel − précédent).
- **hot_water** : `mf788_required = 0.6 × (Δosmosée + Δadoucie)`, `adg5150_required = 0.5 × (Δosmosée + Δadoucie)`.
- **steam_boiler** : `produit_required = 150 − niveau_reservoir_dosage × 0.047`.
- **vacuum_pump / air_compressor** : aucun calcul, juste seuils.
- **chiller** : ΔT eau glacée, ΔT tour, ΔT eau chaude.
- **generator_g1/g2** : ΔT refroidissement (inchangé).
- **osmosis** : taux de rejet, efficacité, consommations dosage (inchangé, étendu).

### Seuils par défaut (`thresholds`)

Insertion via migration des plages mentionnées entre parenthèses :
- Pressions pompes/filtres salle d'eau (min/max bar).
- UV2/UV3 ≥ 95 %.
- Eau surchauffée 4.8–5 bar / 131–134 °C ; eau chaude 2.5–3 bar / 80–90 °C.
- Chaudières vapeur 4–7 bar.
- Charge groupes ≥ 75 %.
- Chiller : sortie eau glacée ≤ 15 °C, sortie tour ≤ 37 °C, vide < 16 mmHg.
- Trane/York HP réf 12 bar, BP réf 6 bar.

### Fichiers modifiés

- `src/lib/utilities.ts` — ajout/renommage des 3 utilités, icônes.
- `src/lib/forms.ts` — nouveaux schémas + compute + labels calculés.
- `src/routes/entry.tsx` — petit ajustement pour afficher les groupes conditionnels (état actif/inactif).
- Nouvelle migration SQL — seeds des `thresholds` pour les nouvelles utilités.

Pas de changement UI majeur : le moteur de formulaire existant gère déjà groupes, anomalies, checklist obligatoire et commentaire.

### Points à confirmer avant implémentation

1. Pour les groupes électrogènes G1/G2, je garde **deux utilités séparées** comme aujourd'hui (un relevé indépendant chacun) plutôt qu'une seule avec deux blocs ?
2. Pour Eau Glacée (Trane + Chiller absorption + York), je regroupe les **3 machines dans une seule utilité « chiller »** avec sélecteur d'état par machine — OK ?
3. Les **quantités « required » calculées** (MF788, ADG5150, produit vapeur) : on les affiche en indicateurs temps réel et le technicien saisit ensuite la quantité réellement versée pour traçabilité — OK ?
