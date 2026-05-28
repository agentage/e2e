#!/usr/bin/env bash
# Create a temp Obsidian test vault with the built plugin installed + enabled,
# its data.json pointed at CouchDB, plus the host-side Obsidian config that
# opens the vault on launch. Without the host-side config Obsidian shows the
# vault picker and quits headlessly; without the per-vault and workspace stubs
# Obsidian's first-run code path bails before painting a window.
#
# Env overrides:
#   PLUGIN_ROOT  — built-plugin dir (main.js/manifest.json/styles.css);
#                  defaults to $GITHUB_WORKSPACE, then PWD.
#   VAULT        — vault directory (default /tmp/obsidian-test-vault).
#   VAULT_ID     — id used in obsidian.json (default citest).
#   COUCHDB_URL  — sync target (default http://localhost:5984).
#   COUCHDB_USER / COUCHDB_PASS / COUCHDB_DB — creds + db name.
set -euo pipefail

PLUGIN_ROOT="${PLUGIN_ROOT:-${GITHUB_WORKSPACE:-$PWD}}"
VAULT="${VAULT:-/tmp/obsidian-test-vault}"
VAULT_ID="${VAULT_ID:-citest}"
COUCHDB_URL="${COUCHDB_URL:-http://localhost:5984}"
COUCHDB_USER="${COUCHDB_USER:-admin}"
COUCHDB_PASS="${COUCHDB_PASS:-agentage}"
COUCHDB_DB="${COUCHDB_DB:-agentage-memory}"

PLUGIN_DIR="$VAULT/.obsidian/plugins/agentage-memory"
mkdir -p "$PLUGIN_DIR"

# Copy (don't symlink) the built artifacts so data.json lives in the vault, not
# in the plugin source checkout.
for f in main.js manifest.json styles.css; do
  cp "$PLUGIN_ROOT/$f" "$PLUGIN_DIR/$f"
done

cat > "$PLUGIN_DIR/data.json" <<EOF
{
  "serverUrl": "$COUCHDB_URL",
  "username": "$COUCHDB_USER",
  "password": "$COUCHDB_PASS",
  "dbName": "$COUCHDB_DB"
}
EOF

echo '["agentage-memory"]' > "$VAULT/.obsidian/community-plugins.json"
echo "# CI smoke" > "$VAULT/Welcome.md"
cat > "$VAULT/.obsidian/workspace.json" <<'WSEOF'
{ "main": { "id": "root", "type": "split", "children": [] }, "left": { "id": "left", "type": "split", "children": [] }, "right": { "id": "right", "type": "split", "children": [] }, "active": "root" }
WSEOF
echo '{}' > "$VAULT/.obsidian/appearance.json"

mkdir -p "$HOME/.config/obsidian"
TS=$(date +%s%3N)
cat > "$HOME/.config/obsidian/obsidian.json" <<EOF
{
  "vaults": {
    "$VAULT_ID": { "path": "$VAULT", "ts": $TS, "open": true }
  }
}
EOF
echo '{}' > "$HOME/.config/obsidian/$VAULT_ID.json"

ls -la "$PLUGIN_DIR" "$HOME/.config/obsidian/"
