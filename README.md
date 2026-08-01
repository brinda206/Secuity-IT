# Security IT — Portail d'actualités cybersécurité

Site d'actualités sur la cybersécurité et la cybercriminalité :

- charte graphique bleu ciel / bleu profond, avec le logo fourni intégré en en-tête et en pied de page,
- mode clair / sombre (bascule via une icône soleil ↔ lune animée),
- une page complète par article (bannière, texte intégral, galerie ou vidéo pour les reportages),
- des reportages terrain (interviews, photos) publiables en ligne via un formulaire d'upload,
- publication **réservée à l'administrateur**, avec une vraie vérification côté serveur (pas seulement un bouton caché),
- un backend Node.js/Express qui reçoit, valide et stocke les fichiers.

## Structure du projet

```
security-it/
├── server.js                    # Serveur Express + API (reportages + authentification)
├── package.json
├── data/
│   └── reportages.json          # "Base de données" des reportages (fichier JSON)
├── uploads/                      # Fichiers médias envoyés (créé au démarrage)
└── public/                       # Frontend statique
    ├── index.html                # Page d'accueil
    ├── article.html               # Gabarit de page article complète
    ├── a-propos.html              # Page de présentation de l'entreprise
    ├── assets/
    │   ├── logo-icon.png          # Logo recadré (icône seule, utilisée dans le site)
    │   └── logo-full.jpg          # Logo complet fourni (icône + texte, utilisé sur la page À propos)
    ├── css/style.css
    └── js/
        ├── theme.js               # Bascule jour/nuit (partagé, toutes les pages)
        ├── lightbox.js            # Visionneuse plein écran (partagée)
        ├── mobile-menu.js         # Menu mobile (article.html et a-propos.html)
        ├── articles-data.js       # Contenu complet des articles éditoriaux statiques
        ├── article.js             # Logique de la page article
        └── app.js                 # Page d'accueil : ticker, filtres, reportages, admin, publication
```

## Installation et démarrage

Prérequis : [Node.js](https://nodejs.org) version 18 ou plus récente.

```bash
cd security-it
npm install
npm start
```

Puis ouvrir **http://localhost:3000**.

## Connexion administrateur

La publication d'un reportage est réservée à l'administrateur. Un bouton en forme
de cadenas, dans l'en-tête, ouvre une fenêtre de connexion par mot de passe.

**Mot de passe par défaut : `contacter administrateur en cas de besoin`**

⚠️ À changer avant toute mise en ligne, via la variable d'environnement `ADMIN_PASSWORD` :

```bash
ADMIN_PASSWORD="votre-mot-de-passe-fort" npm start
```

Ou dans un fichier `.env` chargé par votre gestionnaire de process (PM2, Docker, etc.).

**Comment ça marche techniquement :**
1. `POST /api/login` avec le mot de passe → si correct, le serveur génère un jeton
   aléatoire et le renvoie.
2. Le navigateur garde ce jeton en mémoire locale et l'envoie dans l'en-tête
   `Authorization: Bearer <jeton>` à chaque appel à `POST /api/reportages`.
3. Le serveur vérifie ce jeton (middleware `requireAdmin` dans `server.js`) et
   **refuse la publication avec une erreur 401 si le jeton est absent ou invalide** —
   y compris si quelqu'un essaie d'appeler l'API directement sans passer par
   l'interface. Cacher le bouton "Publier" dans la page n'est qu'un confort
   visuel ; la vraie protection est là.
4. Un bouton "Déconnexion" invalide le jeton côté serveur.

**Limites de cette authentification (à connaître avant un déploiement public) :**
- Un seul mot de passe partagé, pas de comptes individuels.
- Les jetons valides sont stockés en mémoire : ils sont tous invalidés si le
  serveur redémarre (il faut alors se reconnecter).
- Le mot de passe transite en clair sur le réseau lors de la connexion : en
  production, **HTTPS est indispensable**.
- Pour un usage à plusieurs personnes avec des rôles différents, remplacer ce
  système par une vraie gestion de comptes (mots de passe hachés, base de
  données des utilisateurs, expiration des sessions).

## CVE du jour (mise à jour automatique)

Le widget « CVE du jour » de la barre latérale n'affiche plus une valeur codée
en dur : il interroge automatiquement l'API publique du **NVD** (National
Vulnerability Database, gérée par le NIST américain) pour afficher une
vulnérabilité récente et pertinente.

**Comment ça marche :**
1. Le serveur (`server.js`, fonction `fetchCveOfTheDay`) interroge le NVD pour
   les CVE publiées dans les 8 derniers jours, et retient celle avec le score
   CVSS le plus élevé sur la période.
2. Le résultat est mis en cache côté serveur pendant **6 heures**
   (`CVE_CACHE_TTL`), pour rester sous la limite de 5 requêtes/30s imposée par
   le NVD sans clé d'API, et pour ne pas ralentir chaque chargement de page.
3. Le frontend (`public/js/app.js`, fonction `loadCveOfTheDay`) appelle
   `GET /api/cve-of-the-day` au chargement et remplit le widget : identifiant,
   description, score CVSS, couleur de la barre selon la sévérité, et un lien
   vers la fiche complète sur le site du NVD.
4. **En cas d'échec** (NVD indisponible, pas de connexion internet sortante) :
   le serveur renvoie la dernière valeur connue en cache si elle existe
   (avec un indicateur `stale`), sinon une erreur propre — le reste du site
   continue de fonctionner normalement.

⚠️ **Note pour cet environnement de développement** : le NVD n'a pas pu être
testé en conditions réelles ici car le bac à sable de génération n'autorise
les connexions sortantes que vers une liste restreinte de domaines
(npm, GitHub…). Sur ton VPS, une fois déployé avec un accès internet normal,
l'appel fonctionnera sans configuration supplémentaire. Le comportement de
repli en cas d'échec réseau a, lui, été testé et fonctionne correctement.

Si tu préfères filtrer sur un mot-clé précis (ex. seulement les CVE
touchant Node.js ou WordPress) plutôt que "la plus grave de la semaine",
c'est un ajustement simple de la requête envoyée au NVD — demande-le-moi.

## Sécurité

Un audit de sécurité complet a été réalisé et les correctifs suivants sont
déjà appliqués dans ce code :
- Extension de fichier dérivée du type MIME validé (empêche l'upload de
  fichiers exécutables déguisés en images/vidéos)
- Validation stricte de la catégorie et de la date sur `POST /api/reportages`
- Protection anti-bruteforce sur `/api/login` (`express-rate-limit`)
- Jetons administrateur avec expiration (12h)
- Comparaison du mot de passe en temps constant
- En-têtes de sécurité (`helmet`) avec une Content-Security-Policy adaptée

Le détail complet, y compris les points restants à traiter avant une mise en
ligne publique (HTTPS, quota de stockage), est dans `RAPPORT_SECURITE.md`.

## Mode sombre

La bascule jour/nuit (icône soleil ↔ lune dans l'en-tête) fonctionne sur
**toutes** les pages du site — accueil, articles, et page À propos — via le
fichier partagé `public/js/theme.js` et des variables CSS communes
(`public/css/style.css`). La préférence choisie est mémorisée et réappliquée
automatiquement à chaque page suivante.

## Page « À propos »

`public/a-propos.html` présente Security IT : mission, piliers (Sensibiliser /
Protéger / Innover, repris du logo), quelques repères chiffrés, les services
proposés et une section équipe. Le contenu (chiffres, descriptions d'équipe)
est un exemple à personnaliser avec vos informations réelles avant toute mise
en ligne — la section équipe utilise des rôles génériques plutôt que des noms,
à adapter selon votre organisation.

## Articles d'intervention (avec vidéo)

Trois exemples de reportages d'intervention (rançongiciel chez un cabinet
comptable, tentative d'intrusion chez une PME industrielle, panne provoquée
par un logiciel malveillant dans une clinique) ont été ajoutés dans
`data/reportages.json`, catégorie `interventions`, chacun avec une vidéo
associée. Ils apparaissent :
- dans la grille de la page d'accueil (filtre **« Interventions »**, aussi
  accessible directement depuis le menu principal),
- avec leur page article complète (lecteur vidéo, texte intégral),
- et peuvent être complétés par d'autres du même type via le formulaire de
  publication (option **« Intervention Security IT »** dans le menu déroulant
  des catégories).

Les vidéos utilisées sont des exemples libres de droits (domaine
`interactive-examples.mdx.dev`, vidéos CC0) à remplacer par vos propres rushs
avant une mise en ligne réelle.

## Pages articles complètes

Chaque carte du site (l'article à la une, les éléments "à la une", la grille,
les reportages terrain) mène désormais vers `article.html?id=...`, une page
dédiée affichant :

- le titre complet, la catégorie et le niveau de sévérité,
- une bannière (image pour les articles éditoriaux, vidéo ou galerie photo
  pour les reportages terrain),
- le texte intégral de l'article, pas seulement le résumé.

Deux sources de contenu alimentent ces pages :

- **Les 13 articles éditoriaux** (à la une, grille) : texte intégral écrit
  directement dans `public/js/articles-data.js`. Pour modifier ou ajouter un
  article, éditer ce fichier — chaque entrée est identifiée par une clé (ex.
  `"phishing-bancaire-mobile"`) qui doit correspondre à l'attribut
  `article.html?id=...` posé sur la carte correspondante dans `index.html`.
- **Les reportages terrain** (photo/vidéo publiés via le formulaire) : chargés
  dynamiquement depuis `GET /api/reportages/:id`. Le champ optionnel "Texte
  complet de l'article" du formulaire de publication alimente cette page ; si
  laissé vide, c'est le résumé qui s'affiche à la place.

## Comment fonctionne la publication d'un reportage

1. Se connecter en tant qu'administrateur (cadenas dans l'en-tête).
2. Le bouton **« Publier un reportage »** apparaît alors dans l'en-tête.
3. Remplir le formulaire : titre, catégorie, date, résumé, texte complet
   (optionnel), type de média (vidéo ou photo(s)), puis sélectionner le ou les
   fichiers.
4. À la soumission, le navigateur envoie une requête `POST /api/reportages`
   en `multipart/form-data`, avec le jeton administrateur en en-tête.
5. Le serveur valide les champs, le jeton, et le type de fichier (images :
   jpg/png/webp, vidéos : mp4/webm/mov), enregistre les fichiers dans
   `uploads/` avec un nom unique, et ajoute les métadonnées dans
   `data/reportages.json`.
6. La nouvelle carte apparaît immédiatement dans la grille, et sa page article
   complète est accessible tout de suite via `article.html?id=...`.

## Personnalisation rapide

- **Logo** : remplacer `public/assets/logo-icon.png` (utilisé dans le site) et
  `public/assets/logo-full.jpg` (logo complet, non utilisé par défaut mais
  disponible pour une affiche ou une page "à propos").
- **Couleurs / thème** : variables CSS en haut de `public/css/style.css`
  (`:root` pour le mode clair, `html[data-theme="dark"]` pour le mode sombre).
  Les couleurs de sévérité (critique/avertissement/sain) restent volontairement
  rouge/ambre/vert, indépendamment de la charte bleue, pour rester lisibles
  comme code couleur d'alerte.
- **Catégories** : à garder synchronisées à trois endroits : les boutons
  `.chip` dans `index.html`, le `<select id="pCategory">` du formulaire, et
  l'objet `CATEGORY_LABELS` (présent dans `public/js/app.js` et
  `public/js/article.js`).
- **Articles éditoriaux statiques** : contenu dans `public/js/articles-data.js`
  ; les cartes correspondantes sont dans `public/index.html`, section
  `#articlesGrid` (et le héro / "à la une" juste au-dessus).

## Autres limites à connaître

- **Stockage** : les métadonnées des reportages sont dans un simple fichier
  JSON. Pratique pour démarrer, à remplacer par une vraie base de données
  (PostgreSQL, MongoDB, SQLite…) si le volume de contenu grossit.
- **Taille des fichiers** : 200 Mo par vidéo, 15 Mo par image (côté client et
  serveur, constante `MAX_FILE_SIZE` dans `server.js`).
- **Hébergement des fichiers** : stockage local dans `uploads/`. Pour un vrai
  déploiement, envisager un stockage objet (S3, Cloudflare R2, etc.).
