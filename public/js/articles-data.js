// articles-data.js — contenu complet des articles éditoriaux statiques
// (les reportages terrain photo/vidéo, eux, viennent de l'API /api/reportages)
//
// Chaque article correspond à une carte de la page d'accueil (héro, "à la une"
// ou grille). L'identifiant "id" doit rester synchronisé avec l'attribut
// data-id posé sur la carte correspondante dans index.html.

const STATIC_ARTICLES = {

  "rancongiciel-sante-europe": {
    title: "Une campagne de rançongiciel cible les prestataires de santé en Europe francophone",
    category: "cybercriminalite",
    categoryLabel: "Cybercriminalité",
    severity: "critical",
    severityLabel: "Alerte critique",
    date: "2026-07-26",
    readTime: "7 min",
    image: "assets/cyber_ransomware.png",
    excerpt: "Plusieurs cliniques et laboratoires signalent un chiffrement massif de leurs dossiers patients après l'exploitation d'un accès distant mal configuré.",
    body: [
      "Plusieurs cliniques et laboratoires d'analyses situés dans des zones francophones d'Europe ont signalé, en l'espace de quarante-huit heures, un chiffrement massif de leurs dossiers patients. Le point d'entrée identifié par les premières analyses est un accès de télémaintenance resté ouvert sur un serveur exposé, sans authentification renforcée.",
      "Les équipes techniques touchées décrivent un scénario désormais classique : reconnaissance discrète du réseau pendant plusieurs jours, exfiltration ciblée de documents sensibles, puis déclenchement du chiffrement en dehors des heures ouvrées pour retarder la détection. Une note de rançon, laissée sur les postes chiffrés, exige un paiement en cryptomonnaie sous quatre jours.",
      "Les autorités sanitaires locales recommandent aux établissements concernés d'isoler immédiatement les systèmes touchés, de ne pas éteindre les machines chiffrées afin de préserver les preuves, et de solliciter une équipe de réponse à incident avant toute tentative de restauration. Aucune preuve n'indique à ce stade que les données exfiltrées aient été mises en vente, mais la vigilance reste de mise dans les semaines à venir."
    ]
  },

  "faille-framework-web": {
    title: "Une faille critique découverte dans un framework web très répandu",
    category: "vulnerabilites",
    categoryLabel: "Vulnérabilités",
    severity: "warning",
    severityLabel: "Sévérité élevée",
    date: "2026-07-25",
    readTime: "5 min",
    image: "assets/cyber_code.png",
    excerpt: "La faille permettait à un attaquant non authentifié de contourner les contrôles d'accès sur les applications construites avec ce framework.",
    body: [
      "Une équipe de recherche indépendante a rendu publique une faille affectant un framework web utilisé par un grand nombre d'applications d'entreprise. Le défaut permettait à un attaquant non authentifié de contourner certains contrôles d'accès en manipulant un en-tête HTTP normalement filtré côté serveur.",
      "Selon l'avis de sécurité publié conjointement avec le correctif, l'exploitation ne nécessite aucune interaction de l'utilisateur et peut être automatisée à grande échelle. Plusieurs scans opportunistes ciblant des instances non corrigées ont déjà été observés sur internet dans les heures suivant la divulgation.",
      "Les équipes utilisant ce framework sont invitées à appliquer la mise à jour de sécurité sans délai, à vérifier leurs journaux d'accès pour toute activité suspecte sur les dernières semaines, et à envisager un pare-feu applicatif temporaire si une mise à jour immédiate n'est pas possible."
    ]
  },

  "mfa-obligatoire-administrations": {
    title: "L'authentification multifacteur devient obligatoire pour les administrations publiques",
    category: "reglementation",
    categoryLabel: "Réglementation",
    severity: "safe",
    severityLabel: "Bonne pratique",
    date: "2026-07-24",
    readTime: "4 min",
    image: "assets/cyber_shield.png",
    excerpt: "Le texte impose un déploiement de l'authentification multifacteur sur l'ensemble des accès sensibles d'ici la fin de l'année.",
    body: [
      "Un texte réglementaire récemment adopté impose désormais l'authentification multifacteur pour l'ensemble des accès sensibles des administrations publiques, qu'il s'agisse des messageries professionnelles, des accès à distance ou des interfaces d'administration des systèmes internes.",
      "La mesure fait suite à plusieurs incidents où des identifiants compromis, obtenus par hameçonnage ou réutilisés depuis des fuites de données antérieures, ont permis à des attaquants de pénétrer des réseaux administratifs sans jamais avoir à contourner de protection technique supplémentaire.",
      "Les organismes concernés disposent d'un délai jusqu'à la fin de l'année pour se mettre en conformité. Un accompagnement technique est prévu pour les structures les plus petites, qui manquent parfois des ressources internes nécessaires à ce type de déploiement."
    ]
  },

  "phishing-ia-techniques": {
    title: "Comment reconnaître les nouvelles techniques de phishing assistées par IA",
    category: "defense",
    categoryLabel: "Défense",
    severity: "info",
    severityLabel: "Sensibilisation",
    date: "2026-07-23",
    readTime: "6 min",
    image: "assets/cyber_phishing.png",
    excerpt: "Les modèles de génération de texte permettent aujourd'hui de produire des courriels de phishing quasiment indiscernables des communications légitimes.",
    body: [
      "Les modèles de génération de texte permettent aujourd'hui de produire des courriels de phishing quasiment indiscernables des communications légitimes, aussi bien dans la formulation que dans la mise en forme. Les fautes d'orthographe et les tournures maladroites, longtemps considérées comme des signaux d'alerte fiables, ne suffisent plus.",
      "Les campagnes les plus abouties s'appuient désormais sur des informations publiques glanées sur les réseaux professionnels pour personnaliser chaque message : nom du destinataire, poste occupé, projet en cours, voire nom d'un collègue réel. Cette personnalisation augmente sensiblement le taux de clic par rapport aux campagnes génériques.",
      "Face à cette évolution, les spécialistes recommandent de déplacer la vigilance du contenu du message vers son contexte : un lien de réinitialisation de mot de passe non sollicité, une urgence artificielle, ou une demande de validation financière hors procédure habituelle restent des signaux fiables, quelle que soit la qualité rédactionnelle du message."
    ]
  },

  "reseaux-industriels-acces-reventes": {
    title: "Un groupe de cybercriminels revend des accès à des réseaux industriels",
    category: "cybercriminalite",
    categoryLabel: "Cybercriminalité",
    severity: "critical",
    severityLabel: "Alerte critique",
    date: "2026-07-22",
    readTime: "5 min",
    image: "assets/cyber_network.png",
    excerpt: "Des accès initiaux à des réseaux d'automates industriels sont proposés à la vente sur des forums spécialisés, à des prix variant selon le secteur.",
    body: [
      "Des chercheurs spécialisés dans la surveillance des forums clandestins ont identifié une offre inhabituelle : des accès initiaux à des réseaux contenant des automates industriels, proposés à la vente par un courtier d'accès spécialisé. Les prix varient fortement selon le secteur d'activité et la taille de l'organisation touchée.",
      "Ce type de courtage n'implique pas nécessairement le groupe qui exploitera ensuite l'accès : il s'agit d'une étape intermédiaire d'un écosystème criminel de plus en plus structuré, où la compromission initiale et l'exploitation finale sont réalisées par des acteurs distincts.",
      "Les environnements industriels restent particulièrement exposés lorsque les réseaux de supervision ne sont pas cloisonnés du reste du système d'information. Les experts recommandent une ségrégation stricte des réseaux OT et IT, ainsi qu'une surveillance renforcée des accès distants utilisés par les prestataires de maintenance."
    ]
  },

  "phishing-bancaire-mobile": {
    title: "Recrudescence des attaques par hameçonnage ciblant les services bancaires mobiles",
    category: "cybercriminalite",
    categoryLabel: "Cybercriminalité",
    severity: "critical",
    severityLabel: "Alerte critique",
    date: "2026-07-21",
    readTime: "5 min",
    image: "assets/cyber_phishing.png",
    excerpt: "Des faux SMS imitant les banques francophones incitent les usagers à valider des transactions frauduleuses en quelques secondes.",
    body: [
      "Une vague de faux SMS imitant les principales banques francophones circule depuis plusieurs jours. Le message alerte l'usager d'une opération suspecte et l'invite à cliquer sur un lien pour la « bloquer », reproduisant à l'identique l'interface de connexion de sa banque.",
      "Une fois les identifiants saisis, la page factice les transmet en temps réel à l'attaquant, qui les utilise immédiatement pour se connecter au véritable site bancaire et déclencher une demande de code de confirmation par SMS — code que la victime, toujours persuadée d'agir pour sécuriser son compte, transmet elle-même sur le faux site.",
      "Les banques rappellent qu'aucune d'entre elles ne demande jamais de code de validation par un lien reçu par SMS, et encouragent leurs clients à toujours accéder à leur espace en ligne en tapant directement l'adresse dans le navigateur plutôt qu'en suivant un lien reçu."
    ]
  },

  "correctif-urgence-bibliotheque-compression": {
    title: "Correctif d'urgence publié pour une bibliothèque de compression très utilisée",
    category: "vulnerabilites",
    categoryLabel: "Vulnérabilités",
    severity: "warning",
    severityLabel: "Sévérité élevée",
    date: "2026-07-20",
    readTime: "4 min",
    image: "assets/cyber_code.png",
    excerpt: "La faille permettait une exécution de code à distance sur les serveurs n'ayant pas appliqué la dernière mise à jour.",
    body: [
      "Les mainteneurs d'une bibliothèque de compression de données, embarquée dans un très grand nombre de serveurs web et d'outils en ligne de commande, ont publié un correctif d'urgence après la découverte d'une faille d'exécution de code à distance.",
      "Le défaut résidait dans la gestion d'un en-tête de fichier malformé, qui provoquait un dépassement de tampon exploitable lors de la décompression. Un fichier spécialement conçu suffisait à déclencher l'exécution de code arbitraire sur les systèmes non corrigés.",
      "Compte tenu de la diffusion très large de cette bibliothèque, souvent embarquée comme dépendance indirecte, les équipes techniques sont invitées à vérifier l'ensemble de leur chaîne de dépendances plutôt que leurs seuls composants applicatifs directs."
    ]
  },

  "guide-segmentation-reseau-domestique": {
    title: "Guide pratique : segmenter son réseau domestique en cinq étapes simples",
    category: "defense",
    categoryLabel: "Défense",
    severity: "safe",
    severityLabel: "Bonne pratique",
    date: "2026-07-19",
    readTime: "6 min",
    image: "assets/cyber_network.png",
    excerpt: "Séparer objets connectés, invités et postes de travail réduit fortement la surface d'attaque en cas de compromission.",
    body: [
      "Séparer les appareils d'un même foyer selon leur niveau de confiance reste l'une des mesures les plus rentables pour limiter les conséquences d'une compromission. Un objet connecté vulnérable ne devrait jamais se trouver sur le même réseau que l'ordinateur utilisé pour les démarches bancaires.",
      "La plupart des routeurs grand public récents permettent de créer plusieurs réseaux Wi-Fi isolés les uns des autres : un réseau principal pour les appareils de confiance, un réseau « invités » pour les visiteurs, et un réseau dédié aux objets connectés (caméras, ampoules, assistants vocaux).",
      "Cinq étapes suffisent généralement : activer la fonction réseau invité du routeur, y basculer les objets connectés, désactiver la communication entre réseaux si l'option existe, renommer les réseaux sans indiquer le modèle du routeur, puis vérifier régulièrement la liste des appareils connectés à chaque réseau."
    ]
  },

  "courtier-donnees-localisation": {
    title: "Un courtier en données épinglé pour revente d'historiques de localisation",
    category: "vie-privee",
    categoryLabel: "Vie privée",
    severity: "info",
    severityLabel: "Vie privée",
    date: "2026-07-18",
    readTime: "5 min",
    image: "assets/cyber_shield.png",
    excerpt: "L'enquête révèle que des applications gratuites transmettaient des positions précises à des tiers publicitaires.",
    body: [
      "Une enquête menée par des journalistes spécialisés révèle qu'un courtier en données a collecté et revendu des historiques de localisation précis provenant de plusieurs applications mobiles gratuites, sans que les utilisateurs n'en aient une conscience claire au moment de l'installation.",
      "Les autorisations de localisation, souvent demandées pour des fonctionnalités annexes (météo locale, filtres photo géolocalisés), étaient exploitées en arrière-plan pour construire des profils de déplacement détaillés, ensuite proposés à des annonceurs et à d'autres courtiers en données.",
      "L'affaire relance le débat sur le consentement réel des utilisateurs face à des demandes d'autorisation formulées de façon volontairement vague. Les associations de défense de la vie privée recommandent de vérifier régulièrement, dans les paramètres du téléphone, quelles applications ont accès à la localisation en permanence plutôt qu'uniquement lors de l'utilisation."
    ]
  },

  "notification-incidents-24h": {
    title: "Nouvelle obligation de notification des incidents sous 24 heures pour les opérateurs critiques",
    category: "reglementation",
    categoryLabel: "Réglementation",
    severity: "info",
    severityLabel: "Réglementation",
    date: "2026-07-17",
    readTime: "4 min",
    image: "assets/cyber_shield.png",
    excerpt: "Le texte impose un signalement accéléré aux autorités compétentes dès la détection d'une compromission avérée.",
    body: [
      "Un nouveau texte réglementaire impose aux opérateurs d'infrastructures critiques — énergie, eau, transports, télécommunications — de notifier tout incident de sécurité avéré aux autorités compétentes dans un délai de vingt-quatre heures suivant sa détection, contre plusieurs jours auparavant.",
      "L'objectif affiché est de permettre une réponse coordonnée plus rapide en cas d'attaque touchant simultanément plusieurs opérateurs d'un même secteur, un scénario que les autorités jugent de plus en plus plausible au vu des tendances observées ces derniers mois.",
      "Les opérateurs concernés devront également transmettre, dans un second temps, un rapport détaillé sur la cause de l'incident et les mesures correctives engagées. Des sanctions financières sont prévues en cas de manquement répété à cette obligation de notification."
    ]
  },

  "fraude-facture-fournisseurs-industriels": {
    title: "Un réseau de fraude à la facture usurpe l'identité de fournisseurs industriels",
    category: "cybercriminalite",
    categoryLabel: "Cybercriminalité",
    severity: "warning",
    severityLabel: "Sévérité élevée",
    date: "2026-07-16",
    readTime: "5 min",
    image: "assets/cyber_phishing.png",
    excerpt: "Les cybercriminels interceptent des échanges de courriels pour rediriger discrètement des paiements vers de faux comptes.",
    body: [
      "Plusieurs entreprises du secteur industriel ont signalé des tentatives de fraude au virement particulièrement abouties, où les cybercriminels s'insèrent silencieusement dans un échange de courriels existant entre un client et son fournisseur habituel.",
      "Après avoir compromis l'une des deux boîtes de messagerie, les attaquants observent les échanges en cours pendant plusieurs semaines avant d'intervenir au moment le plus opportun : ils envoient une facture identique en apparence à l'originale, mais avec un nouveau relevé d'identité bancaire.",
      "La discrétion de la méthode — aucun nouveau contact, aucune urgence artificielle, un historique de conversation authentique — la rend particulièrement difficile à détecter. Les entreprises sont invitées à valider par téléphone tout changement de coordonnées bancaires, via un numéro connu à l'avance et non celui indiqué dans le courriel suspect."
    ]
  },

  "objets-connectes-mot-de-passe-defaut": {
    title: "Des objets connectés domestiques exposés par un mot de passe par défaut non modifiable",
    category: "vulnerabilites",
    categoryLabel: "Vulnérabilités",
    severity: "critical",
    severityLabel: "Alerte critique",
    date: "2026-07-15",
    readTime: "3 min",
    image: "assets/cyber_code.png",
    excerpt: "Un fabricant reconnaît qu'une partie de son parc de caméras reste accessible via des identifiants codés en dur.",
    body: [
      "Un fabricant de caméras de surveillance domestiques a confirmé qu'une partie de ses modèles les plus anciens conservait des identifiants d'administration codés en dur dans le micrologiciel, rendant leur modification impossible par l'utilisateur final.",
      "Des chercheurs en sécurité ont démontré qu'il était possible de retrouver ces identifiants en quelques minutes à partir d'une simple analyse du firmware disponible publiquement sur le site du fabricant, puis d'accéder au flux vidéo de n'importe quel appareil exposé directement sur internet.",
      "Le fabricant a annoncé travailler sur une mise à jour corrective, mais reconnaît que certains modèles plus anciens ne pourront pas être corrigés pour des raisons matérielles. Les utilisateurs de ces modèles sont invités à ne jamais exposer directement leur caméra sur internet et à passer systématiquement par une passerelle sécurisée."
    ]
  },

  "gestionnaire-mots-de-passe-rentable": {
    title: "Pourquoi un gestionnaire de mots de passe reste la mesure la plus rentable",
    category: "defense",
    categoryLabel: "Défense",
    severity: "safe",
    severityLabel: "Bonne pratique",
    date: "2026-07-14",
    readTime: "6 min",
    image: "assets/cyber_shield.png",
    excerpt: "Comparatif des solutions grand public et conseils pour migrer une équipe sans perturber les habitudes de travail.",
    body: [
      "Face à la multiplication des services en ligne, la réutilisation de mots de passe reste l'une des causes les plus fréquentes de compromission de compte. Un gestionnaire de mots de passe permet de générer et de retenir un mot de passe unique et complexe pour chaque service, sans effort de mémorisation.",
      "Les solutions grand public actuelles proposent toutes un remplissage automatique dans le navigateur, une synchronisation entre appareils, et une vérification qui alerte l'utilisateur si l'un de ses mots de passe apparaît dans une fuite de données connue.",
      "Pour une équipe entière, la migration se fait généralement mieux par vagues : commencer par les comptes les plus sensibles (messagerie professionnelle, outils d'administration), accompagner les premiers utilisateurs volontaires, puis élargir progressivement plutôt que d'imposer un changement global du jour au lendemain."
    ]
  }

};

// Pour un usage éventuel en dehors du navigateur (tests, etc.)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = STATIC_ARTICLES;
}
