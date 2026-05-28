# Bisse IA — Mise en ligne avec Claude Code

Site vitrine pour **Bisse IA** (agents IA & automatisation pour PME valaisannes, Sion / Valais). Cette archive contient le site **prêt à déployer** — pas de build step, pas de framework, juste du HTML/CSS/JS statique.

---

## 📦 Contenu

```
handoff_bisse-ia/
├── README.md              ← ce fichier
├── index.html             ← page d'accueil (hero + sections)
├── mentions-legales.html  ← Impressum + politique de confidentialité (nLPD)
├── styles.css             ← tous les styles
└── script.js              ← interactions (canvas hero, bisse-thread, splash, ROI, FAQ, etc.)
```

Total : **4 fichiers**, ~80&nbsp;KB. Aucune dépendance npm, aucun build. Fonts chargées via Google Fonts CDN.

---

## 🚀 Mise en ligne — options recommandées

Le site est 100&nbsp;% statique. Toutes les options ci-dessous fonctionnent. **Infomaniak est recommandé** pour rester cohérent avec le discours "données 100&nbsp;% suisses" du site.

### Option 1 — Infomaniak (Hébergement Suisse, cohérent avec la marque) ⭐

1. Acheter un hébergement Web (Pack Mail Web ou Hosting) chez [infomaniak.com](https://www.infomaniak.com/fr/hebergement).
2. Pointer le domaine `bisse-ia.ch` (à acheter chez Infomaniak ou ailleurs) sur l'hébergement.
3. Uploader les 4 fichiers (`index.html`, `mentions-legales.html`, `styles.css`, `script.js`) à la racine via FTP/SFTP (identifiants dans Manager Infomaniak).
4. Activer **Let's Encrypt** (HTTPS gratuit) dans le panneau.

➡️ Délai&nbsp;: ~30 minutes une fois le domaine acheté.

### Option 2 — Netlify / Vercel / Cloudflare Pages (déploiement Git)

Plus rapide à itérer, gratuit, mais hébergement hors Suisse (donc à mentionner dans la politique de confidentialité).

```bash
# Initialiser un repo Git dans le dossier
git init
git add .
git commit -m "Initial deploy"

# Netlify CLI
npx netlify deploy --prod --dir .

# OU Vercel
npx vercel --prod

# OU Cloudflare Wrangler
npx wrangler pages deploy . --project-name=bisse-ia
```

➡️ Délai&nbsp;: ~5 minutes. URL temporaire fournie immédiatement, puis pointer `bisse-ia.ch` via DNS.

### Option 3 — Serveur dédié Infomaniak (souverain)

Pour les promesses "self-hosted Genève" du site, un VPS Infomaniak (à partir de ~10&nbsp;CHF/mois) avec Caddy ou Nginx&nbsp;:

```bash
# Sur le VPS
sudo apt install caddy
sudo nano /etc/caddy/Caddyfile
```

```
bisse-ia.ch, www.bisse-ia.ch {
  root * /var/www/bisse-ia
  file_server
  encode gzip zstd
}
```

```bash
sudo systemctl reload caddy
# upload des 4 fichiers dans /var/www/bisse-ia
```

Caddy gère HTTPS automatiquement via Let's Encrypt.

---

## 🔧 Checklist avant mise en ligne

Quelques éléments à vérifier ou compléter&nbsp;:

### À remplir (placeholders dans `mentions-legales.html`)
- [ ] **Numéro de registre du commerce** une fois l'inscription au RC du Valais effectuée
- [ ] **Numéro TVA** si dépassement du seuil de 100'000 CHF
- [ ] **Adresse postale complète** (actuellement&nbsp;: "Sion · Valais · Suisse")
- [ ] **Identité du responsable du contenu** (actuellement&nbsp;: "Direction Bisse IA")
- [ ] Créer la boîte email `dpo@bisse-ia.ch` (référencée comme délégué à la protection des données)
- [ ] Créer la boîte email `contact@bisse-ia.ch`

### À configurer côté DNS
- [ ] Acheter le domaine `bisse-ia.ch` (recommandé&nbsp;: Infomaniak ou Hostpoint)
- [ ] Configurer les enregistrements&nbsp;: `A` ou `CNAME` vers l'hébergement choisi
- [ ] Activer **DNSSEC** si possible
- [ ] Activer **HTTPS** (Let's Encrypt sur la plupart des hébergeurs)
- [ ] Tester avec [ssllabs.com](https://www.ssllabs.com/ssltest/) (viser une note A+)

### À configurer côté site
- [ ] Le **formulaire de contact** (section `#contact` dans `index.html`) est actuellement **inerte** — il faut le brancher à&nbsp;:
  - Un service no-code&nbsp;: [Formspree](https://formspree.io), [Web3Forms](https://web3forms.com), [Formspark](https://formspark.io)
  - **OU** un endpoint backend custom
  - **OU** Infomaniak forms (intégré à l'hébergement)
- [ ] Ajouter **`<meta property="og:image">`** + image OpenGraph (1200×630px) dans `<head>` pour les partages sociaux
- [ ] Ajouter un **favicon** (`favicon.ico` + `apple-touch-icon.png`)
- [ ] Optionnel&nbsp;: ajouter un compteur de fréquentation respectueux de la vie privée (Plausible auto-hébergé ou Cloud — déjà mentionné dans la politique de confidentialité)

### Performance & SEO
- [ ] Compresser les fichiers en gzip/brotli côté serveur (Caddy/Infomaniak le font automatiquement)
- [ ] Vérifier la note Lighthouse (cible&nbsp;: 90+ Performance, 100 Accessibilité)
- [ ] Soumettre le sitemap à Google Search Console (créer `sitemap.xml` si désiré)

---

## 🎨 Stack technique

- **HTML5 vanilla** — aucun framework, aucun bundler
- **CSS3** — variables CSS, grid, flex, animations, mix-blend-mode, backdrop-filter
- **JavaScript vanilla** — Canvas API (hero water animation), SVG path animation (bisse-thread), Intersection Observer (reveal on scroll), pas de jQuery
- **Google Fonts** — Fraunces (serif), Inter Tight (sans), JetBrains Mono (mono)
- **Pas de framework JS / pas de build step** — édition directe possible

---

## 📝 Modifications courantes

| Quoi changer | Où |
|---|---|
| Couleurs (grenat, ocre, crème) | `styles.css` lignes 7-25 (variables `:root`) |
| Copy du hero (titre, slogan, promesse) | `index.html` section `<header class="hero-motion">` |
| Cas d'usage (cartes) | `index.html` section `#cas-usage` |
| FAQ | `index.html` section `#faq` |
| Email/téléphone | chercher `contact@bisse-ia.ch` et `+41779246978` dans tous les fichiers |
| Animation du fil bisse | `script.js` fonction `buildPath()` et `tickThread()` |
| Mentions légales (Impressum) | `mentions-legales.html` section `#impressum` |

---

## 🛡️ Conformité nLPD (Loi suisse sur la protection des données)

Le site est déjà aligné sur la **nLPD du 1er septembre 2023**&nbsp;:
- Impressum complet (art. 3 al. 1 let. s LCD)
- Politique de confidentialité avec 9 sections obligatoires
- Liste des sous-traitants et hébergement
- Liste des droits (accès, rectification, effacement, opposition, portabilité, retrait du consentement, plainte au PFPDT)
- Email du délégué à la protection des données (`dpo@bisse-ia.ch`)
- Politique des cookies (techniques + analytiques)
- Mesures de sécurité documentées

⚠️ Avant la mise en ligne&nbsp;:
- Si tu utilises **un service hors Suisse pour le formulaire de contact** (Formspree, Mailgun, etc.), ajoute-le à la liste des sous-traitants dans `mentions-legales.html` section "Sous-traitants".
- Si tu actives un outil d'analyse (Plausible, Matomo), idem.

---

## 🤖 Pour Claude Code

Quand tu déploies ce site, garde en tête&nbsp;:

1. **C'est du statique, pas du React** — pas besoin de `npm install`, pas de webpack/vite. `index.html` est servi tel quel.
2. **Toutes les anims sont en CSS/JS vanilla** — surtout, ne pas "moderniser" en framework, ça casserait tout le système d'animations du bisse.
3. **Le canvas du hero** (`#hmCanvas`) et le **SVG bisse-thread** sont les deux pièces visuelles centrales — bien tester sur mobile (responsive intégré, mais à vérifier).
4. **Le formulaire de contact est inerte** — il faut le brancher avant la mise en prod, sinon les demandes d'audit se perdent.
5. **Les liens vers `mentions-legales.html` doivent rester relatifs** — ne pas hardcoder de domaine.

---

## 📞 Contact projet

- Email&nbsp;: `contact@bisse-ia.ch` (à créer)
- Téléphone&nbsp;: +41 77 924 69 78
- Basé à&nbsp;: Sion, Valais

---

*Dernière mise à jour&nbsp;: 28 mai 2026*
