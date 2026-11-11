#!/bin/bash
# Import hebdomadaire du calendrier fédéral pour le site SKD Montfort-sur-Meu (macOS).
# Installé et planifié le vendredi à 12h par `castor events:schedule` (voir le README) :
#  1. démarre Ollama si besoin ;
#  2. lance `castor events:import` dans un worktree dédié, à jour de origin/main
#     (le checkout de travail n'est jamais touché) ;
#  3. s'il y a des changements, pousse la branche auto/import-events et ouvre (ou met à jour) la PR.
#
# Variables utiles pour tester :
#   DRY_RUN=1   lance l'import mais ne pousse rien et n'ouvre pas de PR
#   BASE=main   branche de départ
#   SKD_REPO    chemin du dépôt (fourni par l'agent launchd ; par défaut, le dépôt qui contient ce script)
set -uo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

REPO="${SKD_REPO:-$(cd "$(dirname "$0")/.." && pwd)}"
[ -d "$REPO/.git" ] || { echo "Dépôt introuvable : $REPO (définir SKD_REPO)"; exit 1; }
WT="$HOME/Library/Caches/skd-events-import/worktree"
BRANCH="auto/import-events"
BASE="${BASE:-main}"
DRY_RUN="${DRY_RUN:-0}"
OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"
OUTPUT="$(mktemp -t skd-events-import)"

log() { echo "$(date '+%F %T') $*"; }
notify() { osascript -e "display notification \"$1\" with title \"Import événements SKD\"" >/dev/null 2>&1 || true; }
fail() { log "ÉCHEC : $*"; notify "Échec : $*"; cleanup; exit 1; }
remove_worktree() {
    if [ -d "$WT" ]; then git -C "$REPO" worktree remove --force "$WT" >/dev/null 2>&1; fi
    git -C "$REPO" worktree prune
}
cleanup() { rm -f "$OUTPUT"; remove_worktree; }

log "début (base : $BASE, dry-run : $DRY_RUN)"

# --- 1. Ollama ---
if ! curl -sf -m 3 "$OLLAMA_URL/api/tags" >/dev/null; then
    log "Ollama n'est pas lancé, démarrage"
    open -a Ollama
    for _ in $(seq 60); do
        sleep 2
        curl -sf -m 3 "$OLLAMA_URL/api/tags" >/dev/null && break
    done
    curl -sf -m 3 "$OLLAMA_URL/api/tags" >/dev/null || fail "Ollama ne répond pas"
fi

# --- 2. Worktree à jour de origin/$BASE ---
git -C "$REPO" fetch --quiet --prune origin || fail "git fetch"
remove_worktree
mkdir -p "$(dirname "$WT")"
git -C "$REPO" worktree add --quiet --force -B "$BRANCH" "$WT" "origin/$BASE" || fail "création du worktree"
# Les dépendances Castor ne sont pas versionnées : on réutilise celles du checkout principal
ln -s "$REPO/.castor/vendor" "$WT/.castor/vendor"
cd "$WT" || fail "worktree introuvable"

log "import en cours"
castor events:import 2>&1 | tee "$OUTPUT"
[ "${PIPESTATUS[0]}" -eq 0 ] || fail "castor events:import"

if git diff --quiet -- src/content/config/events.json; then
    log "aucun changement, rien à faire"
    cleanup
    exit 0
fi

git add src/content/config/events.json
git commit --quiet -m "chore(events): Import federal calendar ($(date +%F))" || fail "commit"
git --no-pager diff --stat HEAD~1

if [ "$DRY_RUN" = "1" ]; then
    log "dry-run : changements trouvés, rien n'est poussé"
    git --no-pager diff HEAD~1
    cleanup
    exit 0
fi

# Même contenu que la branche déjà poussée : inutile de repousser
if git fetch --quiet origin "$BRANCH" 2>/dev/null && git diff --quiet FETCH_HEAD HEAD -- src/content/config/events.json; then
    log "changements identiques à la branche $BRANCH déjà poussée, rien à faire"
    cleanup
    exit 0
fi

git push --quiet --force origin "$BRANCH" || fail "git push"

summary=$(grep -E 'nouvel\(s\) événement' "$OUTPUT" | tail -1)
body=$(printf 'Import automatique du [calendrier du comité départemental](https://sites.ffkarate.fr/illeetvilaine/calendrier/) via `castor events:import`.\n\n%s\n\nÀ relire avant de fusionner : doublons, catégories et titres sont extraits par un modèle local.' "$summary")

pr=$(gh pr list --head "$BRANCH" --state open --json url --jq '.[0].url')
if [ -n "$pr" ]; then
    gh pr comment "$pr" --body "Import du $(date +%F) : branche mise à jour. $summary" >/dev/null
    log "PR mise à jour : $pr"
else
    pr=$(gh pr create --base "$BASE" --head "$BRANCH" \
        --title "Import des événements du $(date +%d/%m/%Y)" --body "$body") || fail "création de la PR"
    log "PR créée : $pr"
fi
notify "Nouveaux changements : $pr"

cleanup
log "fin"
