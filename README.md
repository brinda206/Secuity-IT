# Security IT — Portail d'Actualités Cybersécurité

Security IT est une plateforme moderne dédiée à l'actualité de la cybersécurité et de la cybercriminalité. Conçue avec une approche **UI/UX Premium**, elle offre une expérience utilisateur fluide, immersive et sécurisée, tout en intégrant des fonctionnalités d'administration avancées.

---

## ✨ Expérience Utilisateur (UX) & Design (UI)

### 🎨 Design System "Cyber-Tech"
- **Esthétique Glassmorphism** : Utilisation d'effets de translucidité (`backdrop-filter`) et de flou pour une interface moderne, profonde et élégante, rappelant les interfaces futuristes des SOC (Security Operations Centers).
- **Thème Dynamique** : Bascule fluide entre le mode clair et le mode sombre via une icône animée (soleil/lune). L'interface s'adapte intelligemment pour garantir un confort de lecture optimal (textes contrastés, couleurs de surface ajustées dynamiquement).
- **Typographie Soignée** : Combinaison de polices modernes (*Space Grotesk*, *Inter*) pour la lisibilité, et de typographie monospace (*IBM Plex Mono*) pour un rendu "Tech" et professionnel.

### 🚀 Parcours de Publication Innovant (Wizard)
L'interface d'administration a été repensée pour minimiser la charge cognitive et maximiser l'efficacité :
- **Formulaire Multi-Étapes** : La création de reportages se fait via un assistant interactif en 3 étapes claires (Informations, Contenu, Médias), guidé par une barre de progression intuitive.
- **Drag & Drop Médias** : De larges zones de dépôt interactives remplacent les boutons classiques. La prévisualisation des images et vidéos est **instantanée**.
- **Validation Bienveillante (UX Writing)** : Les erreurs système austères sont remplacées par d'élégantes notifications "Toasts" animées. Les messages sont clairs, précis et guident l'utilisateur (ex: *"Veuillez remplir le champ obligatoire : Titre"*).

### 💫 Micro-Interactions & Fluidité
- **Animations Subtiles** : Effets d'apparition en douceur (Fade-in), transitions fluides entre les étapes du formulaire, et retours visuels au survol (lueurs cyan) pour encourager l'interaction.
- **Menu de Partage Intelligent** : Un menu d'actions ergonomique et stylisé, qui se masque automatiquement au défilement pour laisser toute la place au contenu éditorial.

---

## 🛠 Structure du projet

```
security-it/
├── server.js                    # Serveur Express + API (reportages + authentification)
├── package.json
├── data/
│   └── reportages.json          # Base de données locale (JSON)
├── uploads/                      # Fichiers médias (images, vidéos compressées)
└── public/                       # Frontend statique
    ├── index.html                # Page d'accueil avec Dashboard Admin
    ├── article.html               # Gabarit dynamique pour la lecture
    ├── a-propos.html              # Page corporate
    ├── assets/                   # Logos et ressources graphiques
    ├── css/style.css             # Design System complet (variables, composants)
    └── js/
        ├── theme.js               # Gestionnaire de thème clair/sombre
        ├── lightbox.js            # Visionneuse de médias immersive
        ├── article.js             # Logique des pages articles
        └── app.js                 # Cœur applicatif (Filtres, API, Wizard, Drag&Drop)
```

## ⚙️ Installation et démarrage

Prérequis : [Node.js](https://nodejs.org) (v18+).

```bash
cd security-it
npm install
npm start
```

Ouvrez ensuite **http://localhost:3000** dans votre navigateur.

---

## 🔒 Sécurité & Administration

La publication de contenu est strictement réservée à l'administrateur. Un bouton en forme de cadenas permet d'accéder au **Dashboard**.

**Mot de passe de développement : `contacter administrateur en cas de besoin`**

⚠️ À modifier impérativement avant toute mise en production via la variable d'environnement `ADMIN_PASSWORD` :
```bash
ADMIN_PASSWORD="votre-mot-de-passe-fort" npm start
```

### Mécanismes de Sécurité Intégrés :
- **Authentification par Token** : Validation côté serveur (`requireAdmin`) pour bloquer toute requête API non autorisée.
- **Protection Anti-Bruteforce** : Limite le nombre de tentatives de connexion via `express-rate-limit`.
- **Validation des Fichiers (MIME type)** : Empêche l'upload de scripts malveillants déguisés en images/vidéos.
- **Sécurisation des En-têtes** : Utilisation de `helmet` pour la politique de sécurité des contenus (CSP).

---

## 📡 Intégration NVD (CVE du jour)

Le site interroge automatiquement l'API publique de la **National Vulnerability Database (NVD)** américaine pour afficher, en temps réel, une vulnérabilité critique récente.
- **Mise en cache intelligente** : Les requêtes sont mises en cache côté serveur pendant 6 heures (`CVE_CACHE_TTL`) pour optimiser les temps de chargement et respecter les quotas de l'API.
- **Résilience** : En cas de coupure réseau, le dernier résultat connu est affiché avec un indicateur dédié.

---

## 📝 Contenu Éditorial & Médias

Deux types de contenus cohabitent :
1. **Les articles statiques ("À la une")** : Leurs données sont gérées dans `public/js/articles-data.js` pour des performances maximales.
2. **Les reportages terrain (Dynamiques)** : Alimentés par le Dashboard Admin, ils sont stockés dans `data/reportages.json` et acceptent des médias lourds (vidéos jusqu'à 200 Mo compressées à la volée, images converties en WebP).

*Note : Les vidéos de démonstration incluses sont sous licence CC0 (domaine public).*
