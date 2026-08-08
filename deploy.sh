#!/usr/bin/env bash
# Déploiement du site vitrine vers cc-vps:/srv/bisse-ia/site/
# Usage : ./deploy.sh [--dry-run]
set -euo pipefail

DEST=cc-vps:/srv/bisse-ia/site/
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/"

# Tout ce qui n'est pas le site public. --delete-excluded est indispensable :
# sans lui, rsync PROTÈGE les fichiers exclus déjà présents sur le serveur
# au lieu de les supprimer.
EXCLUDES=(
  .git .gitignore .claude .agents
  docs README.md nginx-bisse-ia.conf skills-lock.json netlify.toml deploy.sh
)

args=(-avz --delete --delete-excluded)
for e in "${EXCLUDES[@]}"; do args+=(--exclude "$e"); done
[[ "${1:-}" == "--dry-run" ]] && args+=(--dry-run)

rsync "${args[@]}" "$SRC" "$DEST"

# nginx sert du statique : aucun restart nécessaire.
[[ "${1:-}" == "--dry-run" ]] && exit 0

echo
echo "Vérification — les fichiers hors-site doivent être en 404 :"
for p in "${EXCLUDES[@]}"; do
  [[ "$p" == .git || "$p" == .claude || "$p" == .agents ]] && continue
  printf '  %-24s %s\n' "$p" "$(curl -s -o /dev/null -m 10 -w '%{http_code}' "https://bisse-ia.ch/$p")"
done
echo "Le site doit être en 200 :"
for p in "" web.html securite.html reseaux.html mentions-legales.html robots.txt sitemap.xml; do
  printf '  %-24s %s\n' "/$p" "$(curl -s -o /dev/null -m 10 -w '%{http_code}' "https://bisse-ia.ch/$p")"
done
