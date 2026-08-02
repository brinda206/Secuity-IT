// server.js
// Serveur Security IT : sert le site statique (public/) et expose une API
// pour publier des reportages terrain (photos / vidéos) via upload de fichiers.
//
// Démarrage :
//   npm install
//   npm start
// Puis ouvrir http://localhost:3000

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { randomUUID, createHash, timingSafeEqual } from "crypto";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data", "reportages.json");
const NEWSLETTER_FILE = path.join(__dirname, "data", "newsletter.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const PUBLIC_DIR = path.join(__dirname, "public");

// --- Préparation des dossiers/fichiers nécessaires ---
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf-8");
if (!fs.existsSync(NEWSLETTER_FILE)) fs.writeFileSync(NEWSLETTER_FILE, "[]", "utf-8");

// --- Authentification administrateur ---
// Volontairement simple : un mot de passe partagé + des jetons en mémoire avec
// expiration. Suffisant pour un usage interne à une petite équipe. Pour un
// usage à plusieurs rôles, remplacer par un vrai système de comptes.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeMe123!";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 heures
const adminTokens = new Map(); // token -> timestamp d'expiration (remis à zéro au redémarrage)

if (!process.env.ADMIN_PASSWORD) {
  console.warn(
    "\n⚠️  ATTENTION : ADMIN_PASSWORD n'est pas défini, le mot de passe par défaut est utilisé.\n" +
    "   Définissez-le avant toute mise en ligne : ADMIN_PASSWORD=\"...\" npm start\n"
  );
}

// Comparaison en temps constant, pour éviter qu'un attaquant ne déduise le mot
// de passe en mesurant le temps de réponse caractère par caractère. On hache
// d'abord les deux valeurs à une longueur fixe pour éviter aussi de fuiter
// leur longueur respective.
function safeCompare(a, b) {
  const hashA = createHash("sha256").update(String(a)).digest();
  const hashB = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(hashA, hashB);
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const expiresAt = token ? adminTokens.get(token) : null;

  if (!token || !expiresAt || expiresAt < Date.now()) {
    if (token && expiresAt) adminTokens.delete(token); // nettoyage d'un jeton expiré
    return res.status(401).json({ error: "Authentification administrateur requise." });
  }
  next();
}

// --- Petite "base de données" fichier JSON ---
function readReportages() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}
function writeReportages(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
}

// --- "Base de données" Newsletter ---
function readNewsletter() {
  try {
    return JSON.parse(fs.readFileSync(NEWSLETTER_FILE, "utf-8"));
  } catch {
    return [];
  }
}
function writeNewsletter(list) {
  fs.writeFileSync(NEWSLETTER_FILE, JSON.stringify(list, null, 2), "utf-8");
}

// --- Configuration Email (Nodemailer) ---
// Utilise un serveur SMTP local de test si aucune variable d'environnement n'est fournie,
// ou bien le SMTP de votre choix en production.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: process.env.SMTP_PORT || 2525,
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

async function notifySubscribers(article) {
  const subscribers = readNewsletter();
  if (subscribers.length === 0) return;

  const bccList = subscribers.join(", ");
  const articleUrl = `http://localhost:${PORT}/article.html?id=${article.id}`;

  try {
    await transporter.sendMail({
      from: '"Security IT" <newsletter@security-it.example>',
      to: '"Abonnés Security IT" <newsletter@security-it.example>', // fake 'to', use BCC for privacy
      bcc: bccList,
      subject: `Nouveau reportage : ${article.title}`,
      text: `Bonjour,\n\nUn nouvel article vient d'être publié sur Security IT :\n\n"${article.title}"\n${article.excerpt}\n\nLisez-le en intégralité ici : ${articleUrl}\n\nÀ bientôt !`,
      html: `<h2>Un nouvel article a été publié</h2><p><strong>${article.title}</strong></p><p>${article.excerpt}</p><p><a href="${articleUrl}">Lire l'article en ligne</a></p>`
    });
    console.log(`Notification envoyée à ${subscribers.length} abonnés.`);
  } catch (error) {
    console.error("Erreur lors de l'envoi des notifications par e-mail :", error);
  }
}

// --- Configuration de l'upload (Multer) ---
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 Mo par fichier
const GLOBAL_MAX_UPLOADS_SIZE = 2 * 1024 * 1024 * 1024; // 2 Go global

function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const stats = fs.statSync(path.join(dirPath, file));
      size += stats.size;
    }
  } catch (e) {
    console.error(e);
  }
  return size;
}

function checkUploadQuota(req, res, next) {
  const currentSize = getDirSize(UPLOADS_DIR);
  if (currentSize >= GLOBAL_MAX_UPLOADS_SIZE) {
    return res.status(403).json({ error: "Quota de stockage global atteint (2 Go). Impossible d'ajouter de nouveaux médias." });
  }
  next();
}

// CRITIQUE : l'extension du fichier stocké est dérivée UNIQUEMENT du type MIME
// déjà validé par fileFilter, jamais du nom de fichier fourni par le client
// (originalname). Sans cela, un fichier "photo.html" contenant du JavaScript
// pourrait être accepté avec un Content-Type falsifié à "image/png" et servi
// ensuite tel quel par express.static — un XSS stocké sur votre propre domaine.
const EXTENSION_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = EXTENSION_BY_MIME[file.mimetype] || "";
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const isAllowed =
      ALLOWED_IMAGE_TYPES.includes(file.mimetype) ||
      ALLOWED_VIDEO_TYPES.includes(file.mimetype);
    if (!isAllowed) {
      return cb(new Error("Type de fichier non autorisé (image ou vidéo uniquement)."));
    }
    cb(null, true);
  },
});

// --- En-têtes de sécurité ---
app.use(express.json());

// CSP personnalisée (pas les valeurs par défaut de Helmet) car le site utilise
// des attributs style="" en ligne (icônes SVG théméees) et charge Google Fonts.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        mediaSrc: ["'self'", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
  })
);

// --- Limitation du débit sur la connexion admin (protection anti-bruteforce) ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8, // 8 tentatives par IP sur la fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives de connexion. Réessayez dans quelques minutes." },
});

// --- CVE du jour : récupération automatique depuis le NVD (National Vulnerability Database) ---
// API publique, sans clé nécessaire (mais limitée à 5 requêtes/30s côté NVD) :
// on met donc en cache côté serveur pendant plusieurs heures, avec un verrou
// pour éviter plusieurs appels réseau simultanés si le cache expire pendant
// un pic de trafic.
const NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const CVE_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 heures
const cveCache = { data: null, fetchedAt: 0 };
let cveFetchInFlight = null;

function extractCvssScore(cveItem) {
  const metrics = cveItem.metrics || {};
  const source =
    metrics.cvssMetricV31?.[0] || metrics.cvssMetricV30?.[0] || metrics.cvssMetricV2?.[0];
  return source ? source.cvssData.baseScore : null;
}

function severityFromScore(score) {
  if (score == null) return "info";
  if (score >= 9) return "critical";
  if (score >= 7) return "warning";
  if (score >= 4) return "info";
  return "safe";
}

async function fetchCveOfTheDay() {
  const now = new Date();
  const pubEndDate = now.toISOString();
  const pubStartDate = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();

  const url = `${NVD_API_URL}?pubStartDate=${pubStartDate}&pubEndDate=${pubEndDate}&resultsPerPage=50`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`NVD a répondu ${res.status}`);

  const data = await res.json();
  const items = data.vulnerabilities || [];
  if (items.length === 0) throw new Error("Aucune CVE récente renvoyée par le NVD");

  // On choisit la CVE avec le score CVSS le plus élevé sur la période, pour un
  // effet "alerte du jour" plus parlant qu'une simple CVE au hasard.
  let best = null;
  let bestScore = -1;
  for (const entry of items) {
    const cve = entry.cve;
    const score = extractCvssScore(cve);
    if (score != null && score > bestScore) {
      bestScore = score;
      best = cve;
    }
  }
  if (!best) best = items[0].cve; // aucune n'a de score : on prend la plus récente

  const descriptionEn =
    best.descriptions?.find((d) => d.lang === "en")?.value || "Description non disponible.";

  return {
    id: best.id,
    description:
      descriptionEn.length > 260 ? descriptionEn.slice(0, 257) + "…" : descriptionEn,
    cvssScore: bestScore > 0 ? Math.round(bestScore * 10) / 10 : null,
    severity: severityFromScore(bestScore > 0 ? bestScore : null),
    publishedAt: best.published,
    sourceUrl: `https://nvd.nist.gov/vuln/detail/${best.id}`,
    fetchedAt: new Date().toISOString(),
  };
}

// --- GET /api/cve-of-the-day : CVE mise en avant, avec cache serveur ---
app.get("/api/cve-of-the-day", async (req, res) => {
  const isFresh = cveCache.data && Date.now() - cveCache.fetchedAt < CVE_CACHE_TTL;
  if (isFresh) return res.json(cveCache.data);

  try {
    // Évite les appels réseau concurrents si plusieurs requêtes arrivent
    // pendant que le cache est en train d'être rafraîchi.
    if (!cveFetchInFlight) {
      cveFetchInFlight = fetchCveOfTheDay().finally(() => {
        cveFetchInFlight = null;
      });
    }
    const fresh = await cveFetchInFlight;
    cveCache.data = fresh;
    cveCache.fetchedAt = Date.now();
    res.json(fresh);
  } catch (err) {
    console.error("Impossible de récupérer une CVE récente depuis le NVD :", err.message);
    if (cveCache.data) {
      // On sert la dernière version connue plutôt que de casser le widget.
      return res.json({ ...cveCache.data, stale: true });
    }
    res.status(502).json({ error: "Service de CVE temporairement indisponible." });
  }
});

// --- POST /api/newsletter : inscription à la newsletter ---
const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 inscriptions max par IP par heure
  message: { error: "Trop de tentatives d'inscription. Réessayez plus tard." },
});

app.post("/api/newsletter", newsletterLimiter, (req, res) => {
  const { email } = req.body;
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Adresse e-mail invalide." });
  }

  const list = readNewsletter();
  if (list.includes(email.toLowerCase())) {
    return res.status(409).json({ error: "Cet e-mail est déjà inscrit." });
  }

  list.push(email.toLowerCase());
  writeNewsletter(list);
  
  res.status(201).json({ message: "Inscription confirmée avec succès." });
});

app.use(express.static(PUBLIC_DIR));
app.use("/uploads", express.static(UPLOADS_DIR));

// --- POST /api/login : connexion administrateur (mot de passe -> jeton) ---
app.post("/api/login", loginLimiter, (req, res) => {
  const { password } = req.body || {};
  if (!password || !safeCompare(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "Mot de passe incorrect." });
  }
  const token = randomUUID();
  adminTokens.set(token, Date.now() + TOKEN_TTL_MS);
  res.json({ token, expiresIn: TOKEN_TTL_MS });
});

// --- POST /api/logout : invalide le jeton fourni ---
app.post("/api/logout", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) adminTokens.delete(token);
  res.json({ ok: true });
});

// --- GET /api/reportages : liste des reportages, plus récents en premier ---
app.get("/api/reportages", (req, res) => {
  const list = readReportages().sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  res.json(list);
});

// --- GET /api/reportages/:id : détail d'un reportage (page article complète) ---
app.get("/api/reportages/:id", (req, res) => {
  const item = readReportages().find((r) => r.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Reportage introuvable." });
  res.json(item);
});

// --- DELETE /api/reportages/:id : suppression d'un reportage ---
app.delete("/api/reportages/:id", requireAdmin, async (req, res) => {
  try {
    const list = readReportages();
    const index = list.findIndex((r) => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Article introuvable." });
    }

    const item = list[index];
    
    // Supprimer les fichiers associés du système de fichiers
    const filesToDelete = [];
    if (item.mediaUrl) filesToDelete.push(path.join(__dirname, "public", item.mediaUrl));
    if (item.posterUrl) filesToDelete.push(path.join(__dirname, "public", item.posterUrl));
    if (item.gallery && item.gallery.length > 0) {
      item.gallery.forEach(g => {
        if (g.url) filesToDelete.push(path.join(__dirname, "public", g.url));
      });
    }

    for (const filePath of filesToDelete) {
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.warn(`[Avertissement] Impossible de supprimer le fichier ${filePath}:`, err.message);
      }
    }

    list.splice(index, 1);
    writeReportages(list);

    res.json({ success: true, message: "Article supprimé avec succès." });
  } catch (err) {
    console.error("Erreur DELETE:", err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression." });
  }
});

// --- PUT /api/reportages/:id : modification complète d'un reportage ---
app.put(
  "/api/reportages/:id",
  requireAdmin,
  checkUploadQuota,
  upload.fields([{ name: "media", maxCount: 1 }]),
  async (req, res) => {
    try {
      const list = readReportages();
      const index = list.findIndex((r) => r.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Article introuvable." });
      }

      const item = list[index];
      const { title, excerpt, body, category, date, caption } = req.body;
      
      let newMediaUrl = item.mediaUrl;
      let newGallery = item.gallery;

      // Si un nouveau média est envoyé, on remplace l'ancien
      if (req.files && req.files["media"] && req.files["media"][0]) {
        const file = req.files["media"][0];
        const publicUrl = `/uploads/${file.filename}`;
        
        // Supprimer l'ancien média physique
        if (item.mediaUrl) {
          const oldPath = path.join(__dirname, "public", item.mediaUrl);
          try {
            await fs.promises.unlink(oldPath);
          } catch (err) {
            console.warn(`Impossible de supprimer l'ancien fichier ${oldPath}:`, err.message);
          }
        }
        
        newMediaUrl = publicUrl;
        
        // On détermine le type en fonction du nouveau fichier
        if (file.mimetype.startsWith("video/")) {
          item.mediaType = "video";
          newGallery = []; // La galerie n'a pas de sens pour une vidéo simple
        } else {
          item.mediaType = "image";
          // S'il n'y avait qu'une seule image (ou pas de galerie), on remplace juste l'URL
          if (!newGallery || newGallery.length <= 1) {
            newGallery = [{ url: publicUrl }];
          } else {
            // S'il y avait une galerie de plusieurs images, on remplace la première
            newGallery[0].url = publicUrl;
          }
        }
      }

      // On met à jour les champs textuels si fournis dans la requête
      if (title !== undefined) item.title = title;
      if (excerpt !== undefined) item.excerpt = excerpt;
      if (body !== undefined) item.body = body;
      if (category !== undefined) item.category = category;
      if (date !== undefined) item.date = date;
      if (caption !== undefined) item.caption = caption;

      list[index] = {
        ...item,
        mediaUrl: newMediaUrl,
        gallery: newGallery,
      };

      writeReportages(list);
      res.json({ success: true, message: "Article mis à jour.", article: list[index] });
    } catch (err) {
      console.error("Erreur PUT:", err);
      res.status(500).json({ error: "Erreur serveur lors de la mise à jour." });
    }
  }
);

// --- POST /api/reportages : publication d'un nouveau reportage (multipart/form-data) ---
// Réservé à l'administrateur connecté (jeton requis, voir requireAdmin).
// Champs texte : title, excerpt, body (optionnel), category, date,
//                mediaType ("video" | "image"), caption
// Fichiers     : media (1 vidéo, ou 1 à 6 photos), poster (optionnel, image de couverture pour vidéo)
// --- Catégories valides ---
// Toute valeur de "category" hors de cette liste est rejetée : évite qu'une
// valeur non prévue (potentiellement du HTML/JS) ne soit stockée puis
// réinjectée dans la page d'accueil pour d'autres visiteurs.
const ALLOWED_CATEGORIES = [
  "interventions",
  "reportage-terrain",
  "cybercriminalite",
  "vulnerabilites",
  "defense",
  "vie-privee",
  "reglementation",
];

app.post(
  "/api/reportages",
  requireAdmin,
  checkUploadQuota,
  upload.fields([
    { name: "media", maxCount: 6 },
    { name: "poster", maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const { title, excerpt, body, category, date, mediaType, caption } = req.body;

      if (!title || !excerpt || !category || !date || !mediaType) {
        return res.status(400).json({ error: "Merci de compléter tous les champs obligatoires." });
      }
      if (!ALLOWED_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: "Catégorie invalide." });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date).getTime())) {
        return res.status(400).json({ error: "Date invalide (format attendu : AAAA-MM-JJ)." });
      }
      if (!["video", "image"].includes(mediaType)) {
        return res.status(400).json({ error: "Type de média invalide." });
      }

      const mediaFiles = req.files?.media;
      if (!mediaFiles || mediaFiles.length === 0) {
        return res.status(400).json({ error: "Merci de joindre au moins un fichier média." });
      }

      let mediaUrl = null;
      let posterUrl = null;
      let gallery = [];

      if (mediaType === "video") {
        const videoFile = mediaFiles.find((f) => ALLOWED_VIDEO_TYPES.includes(f.mimetype));
        if (!videoFile) {
          return res.status(400).json({ error: "Le fichier fourni n'est pas une vidéo valide." });
        }
        mediaUrl = `/uploads/${videoFile.filename}`;
        if (req.files?.poster?.[0]) {
          posterUrl = `/uploads/${req.files.poster[0].filename}`;
        }
      } else {
        const imageFiles = mediaFiles.filter((f) => ALLOWED_IMAGE_TYPES.includes(f.mimetype));
        if (imageFiles.length === 0) {
          return res.status(400).json({ error: "Merci de joindre au moins une photo valide." });
        }
        mediaUrl = `/uploads/${imageFiles[0].filename}`;
        gallery = imageFiles.map((f) => ({ url: `/uploads/${f.filename}` }));
      }

      const reportage = {
        id: randomUUID(),
        title: title.trim(),
        excerpt: excerpt.trim(),
        body: (body || "").trim(),
        category,
        date,
        mediaType,
        mediaUrl,
        posterUrl,
        gallery,
        caption: (caption || "").trim(),
        createdAt: new Date().toISOString(),
      };

      const list = readReportages();
      list.push(reportage);
      writeReportages(list);

      // Envoi de la notification aux abonnés en arrière-plan
      notifySubscribers(reportage);

      res.status(201).json(reportage);
    } catch (err) {
      console.error("Erreur lors de la publication :", err);
      res.status(500).json({ error: "Erreur serveur lors de l'enregistrement du reportage." });
    }
  }
);

// --- Gestion des erreurs Multer (fichier trop lourd, type refusé, etc.) ---
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ error: err.message || "Requête invalide." });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Security IT lancé sur http://localhost:${PORT}`);
});
