## Objectif

Afficher en temps réel sur le site (page `/energie`, refresh 5 s) :
- **Consommation** : Randa 1 + Randa 2 + Randa 3 (kW)
- **Production** : Groupe 1 + Groupe 2 (kW)
- **Différence** Conso − Production (vert = surplus, rouge = déficit)
- Graphe tendance 5 dernières minutes

Les données viennent de WattNow (`test.wattnow.io`), via le compte `randa_admin`.

## Architecture

```text
Navigateur (page /energie)
       │  poll toutes les 5 s
       ▼
TanStack server function (getWattNowRealtime)
       │
       ├─ lit token mis en cache dans table wattnow_session
       │     └─ si expiré : login Cognito SRP avec WATTNOW_USERNAME/WATTNOW_PASSWORD
       │
       └─ GET https://325qd9g4o9.execute-api…/dashboard/realtime/devices/lastValuesByDeviceType/{userId}/{userId}/tri
              headers: accesstoken, devicekey, userregion
              -> [{deviceId, phase_a_value, phase_b_value, phase_c_value, all_value (W)}, ...]
       │
       ▼
Mappe en {randa1, randa2, randa3, ge1, ge2, conso, prod, delta} (kW)
+ insère snapshot dans wattnow_snapshots (pour le graphe + historique)
```

## Étapes

1. **Secrets** : ajouter `WATTNOW_USERNAME` et `WATTNOW_PASSWORD` (via tool `add_secret`, vous les saisissez dans le formulaire — pas dans le chat).
2. **Dépendance** : `bun add amazon-cognito-identity-js` (utilisé pour le login SRP côté serveur).
3. **Migration DB** (Lovable Cloud) :
   - `wattnow_session` : ligne unique cachant `access_token`, `id_token`, `refresh_token`, `device_key`, `user_id`, `expires_at`. RLS service-role-only.
   - `wattnow_snapshots` : `id, recorded_at, randa1_kw, randa2_kw, randa3_kw, ge1_kw, ge2_kw, conso_kw, prod_kw, delta_kw`. Lecture admin/technicien connecté. Insert service-role.
4. **Serveur** (`src/lib/wattnow.server.ts` + `src/lib/wattnow.functions.ts`) :
   - `loginCognito()` : SRP via amazon-cognito-identity-js, retourne `{accessToken, idToken, deviceKey, userId, expiresAt}`. User pool `us-east-1_NIqaIWN4p`, clientId `48s3rpim1847lvnfd8pce9glqh`, region `us-east-1`. Récupère aussi l'identityId Cognito (`us-east-1:…`) en appelant `cognito-identity`.
   - `getValidToken()` : lit `wattnow_session`, ré-auth si `expires_at < now + 60s`.
   - `createServerFn` **`getWattNowRealtime`** : appelle l'endpoint `lastValuesByDeviceType`, mappe les 5 devices, calcule conso/prod/delta, insère snapshot, retourne le payload typé.
5. **Front** : route `/energie` (sous `AppShell`) :
   - 5 cartes kW (Randa1, Randa2, Randa3, GE1, GE2)
   - bandeau **Delta** très visible
   - mini-graphe Recharts (60 derniers points = 5 min @ 5 s)
   - polling via `useQuery({refetchInterval: 5000})` ou `setInterval`
   - lien depuis `AppShell` (nouvel onglet "Énergie temps réel")
6. **Robustesse** :
   - cache token en DB (pas en mémoire — Worker éphémère)
   - retry login auto si endpoint retourne 401
   - log clair côté serveur
   - garde-fou : si l'endpoint timeout/erreur, on retourne la dernière snapshot connue + un flag `stale: true`

## Risques connus

- **`amazon-cognito-identity-js` sur Cloudflare Worker** : utilise crypto + BigInteger. Devrait fonctionner avec `nodejs_compat`, mais je le validerai avec `invoke-server-function` après déploiement. Si ça casse → fallback : implémenter SRP manuellement (~150 lignes) ou repasser sur le mode "token manuel".
- **WattNow peut changer ses endpoints** sans préavis (c'est un site interne `test.wattnow.io`). Si ça arrive, la page affichera "stale" et il faudra recapturer les requêtes.
- **Sécurité** : votre mot de passe sera stocké comme secret serveur (jamais exposé au navigateur), mais **changez-le après** puisqu'il a été partagé en clair dans le chat.

## Hors-scope de cette itération

- Pas de bouton "se reconnecter" en UI (fait auto en backend).
- Pas d'alerte sonore en cas de déficit (à demander si voulu).
- Pas d'export CSV des snapshots (faisable plus tard).

## Validation finale

Une fois déployé, je teste `getWattNowRealtime` via `invoke-server-function` et je vérifie que les chiffres correspondent à ceux du portail WattNow.

---

OK pour ce plan ? Si oui, je commence par demander les secrets WATTNOW_USERNAME/WATTNOW_PASSWORD puis je lance la migration.