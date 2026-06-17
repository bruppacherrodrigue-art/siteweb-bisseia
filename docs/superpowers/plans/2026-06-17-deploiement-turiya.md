# Déploiement du site Turiya (pivot bisse-ia.ch) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le site vitrine multi-produit actuel de `bisse-ia.ch` par le nouveau site mono-produit **Turiya** (handoff déjà finalisé), recâblé sur l'infra réelle (VPS nginx+Traefik + formulaire n8n→Telegram).

**Architecture:** Le handoff `design_handoff_turiya_deploy` est un site statique autonome (CSS/JS inline, polices auto-hébergées). On l'intègre dans le repo Git `siteweb-bisseia`, on recâble le formulaire (Netlify Forms → webhook n8n existant en JSON), on génère les 6 polices `.woff2`, on retire l'adresse rue du JSON-LD de l'accueil, puis on remplace les fichiers servis par le conteneur `bisse-site` (bind-mount `/srv/bisse-ia/site/`) sur le VPS `cc-vps`, avec backup pour rollback.

**Tech Stack:** HTML/CSS/JS statique (zéro build) · nginx:alpine · Traefik v3.7 · n8n (webhook→Telegram) · Fontsource (npm, pour les `.woff2`) · SSH `cc-vps` (179.237.67.17).

---

## Contexte figé (découvertes — ne pas re-supposer)

- **Repo canonique** : `/home/jaybe/projects/bisse-ia` → origin `github.com/bruppacherrodrigue-art/siteweb-bisseia` (HTTPS). Contient aujourd'hui l'ANCIEN site (index.html + styles.css + script.js + mentions-legales.html).
- **Handoff source** : `/home/jaybe/bisse-ia/design_handoff_turiya_deploy/` (NON versionné). Fichiers : `index.html`, `mentions-legales.html`, `netlify.toml`, `robots.txt`, `sitemap.xml`, `og-image.png`, `fonts/FONTS.md`. ⚠️ Chaque fichier a un compagnon `:Zone.Identifier` (ADS Windows) à **exclure** de toute copie.
- **Polices manquantes** : 6 `.woff2` à générer — `sora-{300,400,600}.woff2`, `ibm-plex-mono-{400,500,600}.woff2` (latin). Référencés par `index.html` ET `mentions-legales.html`.
- **VPS serving** : conteneur `bisse-site` = `nginx:alpine`, mount `/srv/bisse-ia/site:/usr/share/nginx/html:ro`, réseau `proxy`. Compose : `/srv/bisse-ia/docker-compose.yml`. Remplacer les fichiers du mount est pris en compte **sans redémarrage** ; seules les modifs de labels Traefik exigent `docker compose up -d site`.
- **Traefik router `bisse-site`** : `Host(\`bisse-ia.ch\`) || Host(\`www.bisse-ia.ch\`)`, entrypoint `websecure`, TLS `letsencrypt`, middleware `bisse-www-redirect` (www→apex). Pas de middleware de headers de sécurité aujourd'hui.
- **Formulaire n8n** : workflow `PUoZk6x2SP9eDqsD` « Bisse IA — Formulaire contact (Webhook → Telegram) », actif. Webhook `POST /webhook/bisseia-contact`, `allowedOrigins: *`. Node Code : honeypot = `site_web` (si rempli → drop) ; validation : `nom`+`email`+`message` requis ; message Telegram lit `nom/entreprise/email/telephone/secteur/message`. Telegram chatId `5560705195`, credential `Telegram Bot — Bisse IA`.
- **Form Turiya (handoff)** : `id="contact-form"`, câblé Netlify (`data-netlify`, `netlify-honeypot="bot-field"`, hidden `form-name`, `action="/"`, body urlencoded). Champs : `nom`, `entreprise`, `email`, `message`. Honeypot actuel = `bot-field`.

## Décisions utilisateur (figées)

1. **Remplacement direct** de la prod (avec backup + rollback). Pas de staging.
2. **Formulaire → n8n→Telegram** (réutilise `bisseia-contact`).
3. **Tarif pilote « dès CHF 90.–/mois » conservé** tel quel.
4. **Accueil : « Sion · Valais » seul** → retirer `streetAddress`+`postalCode` du JSON-LD de `index.html`. ⚠️ L'adresse rue **reste** dans `mentions-legales.html` (obligation légale Impressum art. 3 LCD) — inchangée.

## Structure des fichiers (cible, dans le repo puis sur le VPS)

| Fichier | Action | Responsabilité |
|---|---|---|
| `index.html` | Remplacer (depuis handoff) + 3 éditions | Page Turiya. Éditions : form HTML, form JS, JSON-LD adresse |
| `mentions-legales.html` | Remplacer (depuis handoff, tel quel) | Impressum + confidentialité + droits nLPD |
| `fonts/*.woff2` | Créer (6 fichiers) | Polices auto-hébergées (Sora, IBM Plex Mono) |
| `og-image.png` | Copier (depuis handoff) | Image OpenGraph 1200×630 |
| `robots.txt`, `sitemap.xml` | Copier (depuis handoff) | SEO |
| `netlify.toml` | Copier (référence headers) — **non utilisé** sur VPS | Documentaire uniquement |
| `styles.css`, `script.js` | **Supprimer** | Ancien site (non référencés par Turiya) |
| `/srv/bisse-ia/docker-compose.yml` (VPS) | Modifier | Ajouter middleware Traefik `bisse-security-headers` |
| Workflow n8n `PUoZk6x2SP9eDqsD` | Modifier (node Code) | Retirer lignes `telephone`/`secteur` du message |

---

## Task 1 : Branche de travail dans le repo

**Files:**
- Repo: `/home/jaybe/projects/bisse-ia`

- [ ] **Step 1: Vérifier l'état propre du repo**

Run:
```bash
cd /home/jaybe/projects/bisse-ia && git remote -v && git status --short
```
Expected: remote `origin …/siteweb-bisseia.git` ; working tree clean.

- [ ] **Step 2: Créer la branche**

```bash
cd /home/jaybe/projects/bisse-ia && git checkout -b feat/pivot-turiya
```
Expected: `Switched to a new branch 'feat/pivot-turiya'`.

---

## Task 2 : Intégrer les fichiers du handoff dans le repo (hors polices)

**Files:**
- Create/Modify dans `/home/jaybe/projects/bisse-ia/` : `index.html`, `mentions-legales.html`, `og-image.png`, `robots.txt`, `sitemap.xml`, `netlify.toml`
- Delete : `styles.css`, `script.js`

- [ ] **Step 1: Copier les fichiers du handoff (en excluant les `:Zone.Identifier`)**

```bash
SRC=/home/jaybe/bisse-ia/design_handoff_turiya_deploy
DST=/home/jaybe/projects/bisse-ia
for f in index.html mentions-legales.html og-image.png robots.txt sitemap.xml netlify.toml; do
  cp "$SRC/$f" "$DST/$f"
done
ls -la "$DST"
```
Expected: les 6 fichiers présents, à jour. Aucun fichier `:Zone.Identifier` copié.

- [ ] **Step 2: Supprimer les fichiers de l'ancien site**

```bash
cd /home/jaybe/projects/bisse-ia && git rm styles.css script.js
```
Expected: `rm 'styles.css'` et `rm 'script.js'`.

- [ ] **Step 3: Vérifier qu'aucune référence à l'ancien CSS/JS ne subsiste**

```bash
cd /home/jaybe/projects/bisse-ia && grep -nE 'styles\.css|script\.js' index.html mentions-legales.html || echo "OK: aucune référence"
```
Expected: `OK: aucune référence` (le nouveau site est inline).

---

## Task 3 : Générer les 6 polices `.woff2` (Fontsource)

**Files:**
- Create: `/home/jaybe/projects/bisse-ia/fonts/{sora-300,sora-400,sora-600,ibm-plex-mono-400,ibm-plex-mono-500,ibm-plex-mono-600}.woff2`

- [ ] **Step 1: Télécharger les polices via Fontsource dans un dossier temporaire**

```bash
TMP=$(mktemp -d) && cd "$TMP" && npm init -y >/dev/null 2>&1 && \
npm i @fontsource/sora @fontsource/ibm-plex-mono >/dev/null 2>&1 && \
echo "TMP=$TMP" && ls node_modules/@fontsource/sora/files/ | grep -E 'latin-(300|400|600)-normal.woff2' && \
ls node_modules/@fontsource/ibm-plex-mono/files/ | grep -E 'latin-(400|500|600)-normal.woff2'
```
Expected: liste les 6 fichiers `*-latin-{poids}-normal.woff2` pour Sora (300/400/600) et IBM Plex Mono (400/500/600). Noter la valeur `TMP=…`.

- [ ] **Step 2: Copier et renommer dans `fonts/`**

```bash
mkdir -p /home/jaybe/projects/bisse-ia/fonts
S=$TMP/node_modules/@fontsource/sora/files
M=$TMP/node_modules/@fontsource/ibm-plex-mono/files
D=/home/jaybe/projects/bisse-ia/fonts
cp "$S/sora-latin-300-normal.woff2" "$D/sora-300.woff2"
cp "$S/sora-latin-400-normal.woff2" "$D/sora-400.woff2"
cp "$S/sora-latin-600-normal.woff2" "$D/sora-600.woff2"
cp "$M/ibm-plex-mono-latin-400-normal.woff2" "$D/ibm-plex-mono-400.woff2"
cp "$M/ibm-plex-mono-latin-500-normal.woff2" "$D/ibm-plex-mono-500.woff2"
cp "$M/ibm-plex-mono-latin-600-normal.woff2" "$D/ibm-plex-mono-600.woff2"
```
(Si les noms Fontsource diffèrent, utiliser ceux listés au Step 1.)

- [ ] **Step 3: Vérifier les 6 fichiers**

```bash
cd /home/jaybe/projects/bisse-ia/fonts && ls -la *.woff2 && file *.woff2
```
Expected: 6 fichiers `.woff2`, taille > 0, type « Web Open Font Format (Version 2) ».

- [ ] **Step 4: Vérifier que chaque `@font-face` du HTML a son fichier**

```bash
cd /home/jaybe/projects/bisse-ia
for fpath in $(grep -ohE "fonts/[a-z0-9.-]+\.woff2" index.html mentions-legales.html | sort -u); do
  [ -f "$fpath" ] && echo "OK $fpath" || echo "MANQUANT $fpath"
done
```
Expected: 6 lignes `OK fonts/…`, aucun `MANQUANT`.

- [ ] **Step 5: Nettoyer le temporaire**

```bash
rm -rf "$TMP"
```

---

## Task 4 : Recâbler le formulaire — HTML (`index.html`)

**Files:**
- Modify: `/home/jaybe/projects/bisse-ia/index.html` (balise `<form>` et honeypot)

- [ ] **Step 1: Remplacer la balise `<form>` Netlify par une version neutre**

Remplacer :
```html
<form class="form reveal" id="contact-form" name="contact" method="POST" action="/" data-netlify="true" netlify-honeypot="bot-field">
  <input type="hidden" name="form-name" value="contact" />
  <p class="hp-field" aria-hidden="true"><label>Ne pas remplir&nbsp;: <input name="bot-field" tabindex="-1" autocomplete="off" /></label></p>
```
par :
```html
<form class="form reveal" id="contact-form" method="POST" action="https://n8n.bisse-ia.ch/webhook/bisseia-contact">
  <p class="hp-field" aria-hidden="true"><label>Ne pas remplir&nbsp;: <input name="site_web" tabindex="-1" autocomplete="off" /></label></p>
```
(Honeypot renommé `bot-field`→`site_web` pour matcher n8n ; attributs Netlify et hidden `form-name` retirés ; `action` pointe le webhook — sert aussi de repli no-JS et de source pour le `fetch`.)

- [ ] **Step 2: Vérifier**

```bash
cd /home/jaybe/projects/bisse-ia
grep -nE 'data-netlify|netlify-honeypot|form-name|bot-field' index.html && echo "RESTE DU NETLIFY — corriger" || echo "OK: Netlify retiré"
grep -n 'name="site_web"' index.html && grep -n 'action="https://n8n.bisse-ia.ch/webhook/bisseia-contact"' index.html
```
Expected: `OK: Netlify retiré` ; les deux `grep` finaux renvoient une ligne chacun.

---

## Task 5 : Recâbler le formulaire — JS (`index.html`)

**Files:**
- Modify: `/home/jaybe/projects/bisse-ia/index.html` (bloc `<script>`, sous-bloc « contact form »)

- [ ] **Step 1: Remplacer le handler de soumission**

Remplacer le bloc existant (commentaire `/* contact form → POST (Netlify Forms) avec fallback visible */` jusqu'à la fermeture `}` du `if (form && formStatus)`) par :
```javascript
  /* contact form → POST JSON vers n8n (webhook bisseia-contact) + honeypot + fallback visible */
  var form = document.getElementById('contact-form');
  var formStatus = document.getElementById('form-status');
  if (form && formStatus) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      function showStatus(cls, html) {
        formStatus.hidden = false;
        formStatus.className = 'form-status ' + cls;
        formStatus.innerHTML = html;
      }
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      // Honeypot : si rempli, on simule le succès sans rien envoyer.
      if ((data.site_web || '').toString().trim()) {
        form.reset();
        showStatus('ok', 'Demande envoyée. Réponse sous un jour ouvré.');
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';
      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        showStatus('ok', 'Demande envoyée. Réponse sous un jour ouvré.');
      }).catch(function () {
        showStatus('err', 'L\'envoi n\'a pas abouti. Écrivez directement à <a href="mailto:admin@bisse-ia.ch">admin@bisse-ia.ch</a> ou appelez le <a href="tel:+41779246978">+41&nbsp;77&nbsp;924&nbsp;69&nbsp;78</a>.');
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = label;
      });
    });
  }
```
(Passe en `application/json` + body JSON, ajoute le court-circuit honeypot `site_web`, conserve les messages ok/err existants.)

- [ ] **Step 2: Vérifier**

```bash
cd /home/jaybe/projects/bisse-ia
grep -n "application/json" index.html && grep -n "data.site_web" index.html && grep -n "URLSearchParams" index.html && echo "RESTE urlencoded — corriger" || echo "OK: plus d'urlencoded"
```
Expected: une ligne `application/json`, une ligne `data.site_web`, et `OK: plus d'urlencoded` (le `grep URLSearchParams` ne matche rien).

---

## Task 6 : Retirer l'adresse rue du JSON-LD de l'accueil (décision #4)

**Files:**
- Modify: `/home/jaybe/projects/bisse-ia/index.html` (bloc JSON-LD `@graph` → `Organization` → `address`)

- [ ] **Step 1: Éditer le bloc `address`**

Remplacer :
```json
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Rue des Champs de Tabac 12",
        "postalCode": "1950",
        "addressLocality": "Sion",
        "addressRegion": "Valais",
        "addressCountry": "CH"
      },
```
par :
```json
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Sion",
        "addressRegion": "Valais",
        "addressCountry": "CH"
      },
```

- [ ] **Step 2: Vérifier — l'adresse rue ne doit plus figurer dans `index.html`, mais rester dans `mentions-legales.html`**

```bash
cd /home/jaybe/projects/bisse-ia
grep -c "Champs de Tabac" index.html        # attendu : 0
grep -c "Champs de Tabac" mentions-legales.html  # attendu : >= 1 (Impressum légal, inchangé)
```
Expected: `0` puis un nombre `>= 1`.

- [ ] **Step 3: Valider que le JSON-LD reste un JSON valide**

```bash
cd /home/jaybe/projects/bisse-ia
python3 - <<'PY'
import re, json, sys
html = open('index.html', encoding='utf-8').read()
blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
for i, b in enumerate(blocks):
    json.loads(b)
    print(f"JSON-LD #{i} valide")
PY
```
Expected: « JSON-LD #0 valide » (pas d'exception).

---

## Task 7 : Commit local de l'intégration

- [ ] **Step 1: Stage + commit**

```bash
cd /home/jaybe/projects/bisse-ia
git add -A
git status --short
git commit -m "feat: pivot bisse-ia.ch vers le site Turiya (form n8n, polices auto-hébergées, JSON-LD)"
```
Expected: commit créé ; `git status` montre `index.html`, `mentions-legales.html`, `fonts/` (6), `og-image.png`, `robots.txt`, `sitemap.xml`, `netlify.toml` ajoutés/modifiés et `styles.css`/`script.js` supprimés.

---

## Task 8 : Mettre à jour le workflow n8n (message Telegram propre)

**Files:**
- Modify: workflow n8n `PUoZk6x2SP9eDqsD`, node « Build message + honeypot »

- [ ] **Step 1: Mettre à jour le `jsCode` du node Code via MCP**

Outil: `mcp__n8n-mcp__n8n_update_partial_workflow` (id `PUoZk6x2SP9eDqsD`), opération de type `updateNode` sur le node `node-build`, nouveau `parameters.jsCode` :
```javascript
const item = $input.first().json;
const b = (item && item.body) ? item.body : (item || {});
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Honeypot anti-spam : si rempli, on droppe silencieusement.
if ((b.site_web || '').toString().trim().length > 0) { return []; }
// Validation minimale : nom + email + message requis
if (!String(b.nom || '').trim() || !String(b.email || '').trim() || !String(b.message || '').trim()) { return []; }
const text = [
  "🟢 <b>Nouvelle demande — bisse-ia.ch (Turiya)</b>",
  "",
  "<b>Nom :</b> " + esc(b.nom),
  "<b>Entreprise :</b> " + esc(b.entreprise || '—'),
  "<b>Email :</b> " + esc(b.email),
  "",
  "<b>Message :</b>",
  esc(b.message)
].join("\n");
return [{ json: { text } }];
```
(Retire les lignes `Téléphone`/`Secteur` absentes du nouveau form ; `entreprise` optionnelle → `—`.)

- [ ] **Step 2: Valider le workflow**

Outil: `mcp__n8n-mcp__n8n_validate_workflow` (id `PUoZk6x2SP9eDqsD`).
Expected: aucune erreur ; workflow toujours `active`.

---

## Task 9 : Backup VPS (site + compose) avant toute modification

**Files (VPS `cc-vps`):**
- Create: `/srv/bisse-ia/site.bak-pre-turiya-20260617/`, `/srv/bisse-ia/docker-compose.yml.bak-pre-turiya`

- [ ] **Step 1: Sauvegarder le dossier servi et le compose**

```bash
ssh cc-vps 'cp -a /srv/bisse-ia/site /srv/bisse-ia/site.bak-pre-turiya-20260617 && \
cp -a /srv/bisse-ia/docker-compose.yml /srv/bisse-ia/docker-compose.yml.bak-pre-turiya && \
ls -la /srv/bisse-ia/ | grep -E "site|docker-compose"'
```
Expected: `site.bak-pre-turiya-20260617/` et `docker-compose.yml.bak-pre-turiya` présents.

- [ ] **Step 2: Capturer l'empreinte HTTP actuelle (pour comparaison post-deploy)**

```bash
curl -sI https://bisse-ia.ch | head -1 ; curl -s https://bisse-ia.ch | grep -ioE '<title>[^<]*</title>'
```
Expected: `HTTP/2 200` + titre de l'ANCIEN site (« Agents IA & automatisation… »).

---

## Task 10 : Téléverser le nouveau bundle vers `/srv/bisse-ia/site/`

**Files (VPS):** remplace le contenu de `/srv/bisse-ia/site/`

- [ ] **Step 1: Synchroniser le repo vers le VPS (miroir, sans `.git` ni `docs`)**

```bash
cd /home/jaybe/projects/bisse-ia
rsync -av --delete \
  --exclude '.git' --exclude 'docs' --exclude 'README.md' --exclude '.gitignore' \
  ./ cc-vps:/srv/bisse-ia/site/
```
Expected: transfert de `index.html`, `mentions-legales.html`, `fonts/` (6 woff2), `og-image.png`, `robots.txt`, `sitemap.xml`, `netlify.toml` ; suppression de `styles.css` et `script.js` côté VPS.

- [ ] **Step 2: Vérifier le contenu déployé**

```bash
ssh cc-vps 'ls -la /srv/bisse-ia/site/ && echo "--- fonts ---" && ls /srv/bisse-ia/site/fonts/'
```
Expected: nouveaux fichiers présents ; `fonts/` contient les 6 `.woff2` ; plus de `styles.css`/`script.js`.

---

## Task 11 : Ajouter les en-têtes de sécurité (middleware Traefik)

**Files (VPS):** `/srv/bisse-ia/docker-compose.yml` (labels du service `site`)

- [ ] **Step 1: Ajouter le middleware headers + l'attacher au router**

Dans le bloc `labels:` du service `site`, ajouter (en portant les valeurs du `netlify.toml`) :
```yaml
      - "traefik.http.middlewares.bisse-security-headers.headers.stsSeconds=31536000"
      - "traefik.http.middlewares.bisse-security-headers.headers.stsIncludeSubdomains=true"
      - "traefik.http.middlewares.bisse-security-headers.headers.stsPreload=true"
      - "traefik.http.middlewares.bisse-security-headers.headers.frameDeny=true"
      - "traefik.http.middlewares.bisse-security-headers.headers.contentTypeNosniff=true"
      - "traefik.http.middlewares.bisse-security-headers.headers.referrerPolicy=strict-origin-when-cross-origin"
      - "traefik.http.middlewares.bisse-security-headers.headers.permissionsPolicy=geolocation=(), microphone=(), camera=()"
```
Puis modifier la ligne du middleware du router pour **chaîner** les deux (l'ordre conserve la redirection www→apex) :
```yaml
      - "traefik.http.routers.bisse-site.middlewares=bisse-www-redirect,bisse-security-headers"
```

- [ ] **Step 2: Appliquer (recrée le conteneur pour relire les labels)**

```bash
ssh cc-vps 'cd /srv/bisse-ia && docker compose up -d site && docker compose ps site'
```
Expected: `bisse-site` recréé, état `Up`/`running`.

---

## Task 12 : Vérification post-déploiement

- [ ] **Step 1: Page d'accueil = nouveau site Turiya**

```bash
curl -sI https://bisse-ia.ch | head -1
curl -s https://bisse-ia.ch | grep -ioE '<title>[^<]*</title>'
```
Expected: `HTTP/2 200` ; titre contient « Turiya ».

- [ ] **Step 2: Aucune fuite vers Google Fonts ; polices servies en 200**

```bash
curl -s https://bisse-ia.ch | grep -ciE 'fonts.googleapis|fonts.gstatic'   # attendu : 0
curl -sI https://bisse-ia.ch/fonts/sora-400.woff2 | head -1                 # attendu : 200
curl -sI https://bisse-ia.ch/fonts/ibm-plex-mono-400.woff2 | head -1        # attendu : 200
```
Expected: `0`, puis deux `HTTP/2 200`.

- [ ] **Step 3: En-têtes de sécurité présents**

```bash
curl -sI https://bisse-ia.ch | grep -iE 'strict-transport-security|x-frame-options|x-content-type-options|referrer-policy|permissions-policy'
```
Expected: les 5 en-têtes présents (HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy).

- [ ] **Step 4: Redirection www→apex + page légale + assets**

```bash
curl -sI https://www.bisse-ia.ch/ | grep -iE 'location|HTTP'     # attendu : 301 vers https://bisse-ia.ch/
curl -sI https://bisse-ia.ch/mentions-legales.html | head -1      # attendu : 200
curl -s https://bisse-ia.ch/mentions-legales.html | grep -ciE 'id="(impressum|confidentialite|droits)"'  # attendu : 3
curl -sI https://bisse-ia.ch/og-image.png | head -1               # attendu : 200
curl -sI https://bisse-ia.ch/sitemap.xml | head -1                # attendu : 200
```
Expected: 301 www→apex, mentions-legales 200, 3 ancres, og-image 200, sitemap 200.

- [ ] **Step 5: Adresse rue absente de l'accueil, présente sur la page légale**

```bash
curl -s https://bisse-ia.ch | grep -c "Champs de Tabac"                 # attendu : 0
curl -s https://bisse-ia.ch/mentions-legales.html | grep -c "Champs de Tabac"  # attendu : >= 1
```
Expected: `0` puis `>= 1`.

---

## Task 13 : Smoke test du formulaire de contact (n8n→Telegram réel)

- [ ] **Step 1: Envoyer une soumission de test directement au webhook**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://n8n.bisse-ia.ch/webhook/bisseia-contact \
  -H 'Content-Type: application/json' \
  -d '{"nom":"TEST déploiement Turiya","entreprise":"Bisse IA","email":"admin@bisse-ia.ch","message":"Smoke test post-pivot — à ignorer."}'
```
Expected: `200`.

- [ ] **Step 2: Confirmer la réception côté Telegram**

Action manuelle : vérifier que le message « 🟢 Nouvelle demande — bisse-ia.ch (Turiya) » est arrivé sur le Telegram (chatId `5560705195`), avec Nom/Entreprise/Email/Message et **sans** lignes Téléphone/Secteur.
Expected: message reçu, format propre.

- [ ] **Step 3: Vérifier le honeypot (doit être silencieusement ignoré)**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://n8n.bisse-ia.ch/webhook/bisseia-contact \
  -H 'Content-Type: application/json' \
  -d '{"nom":"bot","email":"bot@x.com","message":"spam","site_web":"http://spam"}'
```
Expected: `200` HTTP mais **aucun** message Telegram (drop honeypot).

---

## Task 14 : Pousser la branche + (optionnel) ouvrir une PR

- [ ] **Step 1: Pousser**

```bash
cd /home/jaybe/projects/bisse-ia && git push -u origin feat/pivot-turiya
```
Expected: branche poussée sur `origin`.

- [ ] **Step 2: Merge vers `main`** (au choix de l'utilisateur : PR GitHub ou merge direct)

```bash
cd /home/jaybe/projects/bisse-ia && git checkout main && git merge --no-ff feat/pivot-turiya -m "feat: pivot bisse-ia.ch vers Turiya" && git push origin main
```
Expected: `main` à jour avec le pivot Turiya.

---

## Rollback (si une vérification échoue)

```bash
# Restaurer les fichiers servis
ssh cc-vps 'rm -rf /srv/bisse-ia/site && cp -a /srv/bisse-ia/site.bak-pre-turiya-20260617 /srv/bisse-ia/site'
# Restaurer le compose (labels Traefik) et recréer le conteneur
ssh cc-vps 'cp -a /srv/bisse-ia/docker-compose.yml.bak-pre-turiya /srv/bisse-ia/docker-compose.yml && cd /srv/bisse-ia && docker compose up -d site'
# Vérifier le retour à l'ancien site
curl -s https://bisse-ia.ch | grep -ioE '<title>[^<]*</title>'
```
Le workflow n8n peut être restauré via `mcp__n8n-mcp__n8n_workflow_versions` (versionId précédent `cee2808c-4231-4c2c-93d3-33bf2a95b888`).

---

## Notes & risques

- **CORS** : le webhook n8n a `allowedOrigins: *` et l'ancien site faisait déjà du POST JSON dessus → pas de régression CORS attendue.
- **Permissions VPS** : `/srv/bisse-ia/` appartient à `deploy:deploy` (g+w). Si `rsync`/`cp` est refusé, exécuter via l'utilisateur `deploy` ou `sudo` selon les droits de l'utilisateur SSH.
- **MIME woff2** : `nginx:alpine` sert `font/woff2` par défaut (mime.types récent) — pas de config à ajouter.
- **`netlify.toml`** : laissé dans le repo à titre documentaire (valeurs des headers) ; **ignoré** par nginx/Traefik.
- **Adresse légale** : conservée dans `mentions-legales.html` par obligation (Impressum). Décision #4 limitée à l'accueil.
- **Date du backup** : le nom `site.bak-pre-turiya-20260617` est figé au 2026-06-17 ; adapter si l'exécution a lieu un autre jour.
