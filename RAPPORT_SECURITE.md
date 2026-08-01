# Rapport de sécurité — Security IT

> **Mise à jour du 31/07/2026 : les correctifs ci-dessous ont été appliqués et testés** (voir le tableau de statut en bas de document). Ce rapport est conservé tel quel pour garder la trace de l'audit initial et du raisonnement derrière chaque correctif.

Audit du code réel du dépôt (`server.js`, `public/js/app.js`, `public/js/article.js`, `package.json`), au 29 juillet 2026. Aucune dépendance ne présente de faille connue (`npm audit` : 0 vulnérabilité).

---

## 🔴 CRITIQUE

### 1. L'extension de fichier n'est pas vérifiée — upload de fichier arbitraire possible

**Où :** `server.js`, fonction `filename` du `multer.diskStorage` (ligne ~70)

```js
filename: (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  cb(null, `${Date.now()}-${randomUUID()}${ext}`);
}
```

**Le problème :** le filtre de type (`fileFilter`) ne vérifie que `file.mimetype`, une valeur **déclarée par le client et donc falsifiable**. L'extension du fichier final, elle, vient du nom de fichier original — une donnée **totalement indépendante et elle aussi contrôlée par le client**.

Un attaquant peut donc envoyer une requête où :
- `Content-Type` de la partie = `image/png` (passe le filtre),
- nom de fichier original = `malveillant.html` (contenant du JavaScript).

Le serveur écrira alors un fichier `xxxxx.html` dans `/uploads/`, servi tel quel par `express.static` avec le bon en-tête `Content-Type: text/html`. **Le script s'exécute dans le navigateur, avec l'origine de votre propre site** (XSS stocké, persistant, sur votre domaine).

**Impact :** vol de jeton administrateur stocké en `localStorage`, défacement, hameçonnage depuis votre propre domaine — le pire type de XSS car il hérite de toute la confiance de `security-it.example`.

**Correctif :** ne jamais faire confiance à `originalname`. Dériver l'extension depuis le `mimetype` **déjà validé**, via une table de correspondance stricte :

```js
const EXT_BY_MIME = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
  "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov",
};
filename: (req, file, cb) => {
  const ext = EXT_BY_MIME[file.mimetype] || "";
  cb(null, `${Date.now()}-${randomUUID()}${ext}`);
}
```

---

## 🟠 ÉLEVÉ

### 2. XSS stocké via le champ `category` (non validé côté serveur, non échappé côté client)

**Où :** `server.js` ligne ~183 (`category` stocké tel quel) et `public/js/app.js` lignes 129 et 163 :

```js
<div class="card has-media" data-category="${item.category}">
```

`category` vient directement de `req.body.category`, sans vérification contre la liste des catégories valides. Il est ensuite réinjecté **sans échappement** dans un attribut HTML. Un jeton admin compromis (via la faille n°1, un hameçonnage, ou une négligence) permet d'y injecter `"><script>...</script>`, exécuté chez **tous les visiteurs** de la page d'accueil.

**Correctif :**
- Serveur : valider `category` contre une liste blanche (`['interventions','reportage-terrain','cybercriminalite','vulnerabilites','defense','vie-privee','reglementation']`), rejeter sinon.
- Client : passer `item.category` dans `escapeHtml()` avant de l'insérer, comme c'est déjà fait pour `title`, `excerpt` et `caption`.

### 3. Aucune protection contre le bruteforce sur `/api/login`

**Où :** `server.js`, route `POST /api/login`

Aucune limite de tentatives, aucun délai, aucun verrouillage. Avec un mot de passe unique partagé (et le mot de passe par défaut documenté publiquement dans le README), un script peut tester des milliers de mots de passe par minute sans être ralenti.

**Correctif :** ajouter `express-rate-limit` sur `/api/login` (ex. 5 tentatives / 15 minutes / IP), et faire échouer le démarrage du serveur (ou avertir bruyamment dans les logs) si `ADMIN_PASSWORD` n'a pas été changé.

### 4. Les jetons admin n'expirent jamais

**Où :** `server.js`, `const adminTokens = new Set()`

Un jeton reste valide indéfiniment tant que le serveur tourne — pas de durée de vie, pas d'expiration. Un jeton qui fuit (log, historique navigateur, faille n°1) reste exploitable jusqu'au prochain redémarrage du serveur.

**Correctif :** stocker `{ token, expiresAt }` et vérifier l'expiration dans `requireAdmin` (ex. 12h), ou passer à un vrai JWT signé avec expiration intégrée.

---

## 🟡 MOYEN

### 5. Comparaison du mot de passe non "constant-time"

`if (password !== ADMIN_PASSWORD)` — comparaison standard JavaScript, en théorie sensible à une attaque par mesure de temps (peu réaliste ici vu la latence réseau, mais correction triviale) :
```js
import { timingSafeEqual } from "crypto";
```

### 6. Aucun en-tête de sécurité (Helmet absent)

Pas de `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, etc. Une CSP stricte aurait d'ailleurs limité l'impact de la faille n°1 (un fichier HTML uploadé n'aurait pas pu exécuter de script inline).

**Correctif :** `npm install helmet` puis `app.use(helmet())`.

### 7. HTTPS non forcé

Le mot de passe admin et les jetons circulent en clair si le site est exposé sans TLS. Déjà noté dans le README, mais c'est le vrai bloquant n°1 avant toute mise en ligne publique.

### 8. Pas de quota de stockage global

Chaque fichier est limité à 200 Mo, mais rien n'empêche un nombre illimité d'envois (par un compte admin compromis, cf. n°3/n°4) de remplir le disque du serveur (déni de service). À prévoir avant une mise en production : quota total, purge, ou stockage objet externe (S3, R2…) déjà recommandé dans le README pour d'autres raisons.

---

## 🟢 FAIBLE / bonnes pratiques

- **Gestion d'erreur trop large** (`server.js` fin de fichier) : toute erreur, pas seulement celles de Multer, retourne un 400 générique — masque de potentielles erreurs 500 réelles en logs de debug.
- **Pas d'intégrité (SRI)** sur le `<link>` Google Fonts chargé en CDN — risque très faible mais facile à corriger avec un attribut `integrity`.
- **`date` non validée côté serveur** : accepte n'importe quelle chaîne, pas seulement un format ISO — impact limité (affichage seulement) mais bonne pratique de valider.

---

## ✅ Ce qui est déjà bien fait

- Upload traité en **disque** (`diskStorage`), pas en mémoire → pas de risque d'épuisement mémoire par gros fichier.
- Noms de fichiers générés côté serveur (`Date.now()+randomUUID()`) → aucun risque de traversée de répertoire (`../../`) ni de collision.
- `POST /api/reportages` correctement protégé par jeton **côté serveur** (vérifié dans un audit précédent : refus en 401 sans jeton, y compris en appel direct hors interface).
- Échappement HTML systématique pour `title`, `excerpt`, `caption` dans `app.js` et `article.js` (seul `category` fait exception, cf. n°2).
- Aucune dépendance avec vulnérabilité connue (`npm audit` propre).
- Pas de CORS ouvert par défaut (API accessible uniquement en same-origin).

---

## Priorité d'action recommandée

| Ordre | Faille | Effort de correction |
|---|---|---|
| 1 | #1 — Extension de fichier non vérifiée | Faible (10 lignes) |
| 2 | #2 — XSS via `category` | Faible (validation + échappement) |
| 3 | #3 — Bruteforce login | Faible (1 dépendance) |
| 4 | #4 — Expiration des jetons | Moyen |
| 5 | #6 — Helmet | Très faible |
| 6 | #7 — HTTPS | Dépend de l'hébergement |

Je peux corriger les points #1, #2, #3, #5 et #6 directement dans le code maintenant si tu veux — ce sont tous des changements courts et sans risque de régression. Dis-moi si tu veux que je les applique.

---

## Statut des correctifs (mise à jour du 31/07/2026)

| # | Faille | Statut | Où |
|---|---|---|---|
| 1 | Extension de fichier non vérifiée | ✅ Corrigé | `server.js` — extension dérivée du `mimetype` validé via `EXTENSION_BY_MIME`, plus jamais du nom de fichier client |
| 2 | XSS via `category` | ✅ Corrigé | Validation serveur (`ALLOWED_CATEGORIES`) + échappement client (`escapeHtml`) dans `public/js/app.js` |
| 3 | Bruteforce sur `/api/login` | ✅ Corrigé | `express-rate-limit`, 8 tentatives / 15 min / IP |
| 4 | Jetons admin sans expiration | ✅ Corrigé | Jetons stockés avec `expiresAt`, durée de vie 12h |
| 5 | Comparaison mot de passe non constant-time | ✅ Corrigé | `crypto.timingSafeEqual` sur des hachages SHA-256 |
| 6 | Aucun en-tête de sécurité | ✅ Corrigé | `helmet` avec CSP personnalisée (autorise Google Fonts + styles en ligne du thème) |
| — | Date non validée | ✅ Corrigé au passage | Format `AAAA-MM-JJ` vérifié côté serveur |
| 7 | HTTPS non forcé | ⏳ À faire au déploiement | Voir le guide VPS (Certbot / Let's Encrypt) |
| 8 | Pas de quota de stockage global | ⏳ Non traité | Toujours d'actualité, cf. recommandations du rapport |

Tous les correctifs marqués ✅ ont été testés manuellement (upload avec extension falsifiée rejetée, catégorie avec balise `<script>` rejetée, rate limiting déclenché après 8 tentatives, en-têtes `Content-Security-Policy` / `X-Content-Type-Options` / `X-Frame-Options` bien présents dans les réponses).

