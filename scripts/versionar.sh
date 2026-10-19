#!/usr/bin/env bash
# versionar.sh — calcula el próximo tag y lo crea + empuja.
#
# Esquema del proyecto:
#   feature grande  → minor:  v0.(N+1)    →  ./scripts/versionar.sh minor
#   fix:            → patch:  v0.N.(z+1)  →  ./scripts/versionar.sh fix
#   docs / chore / polish / iteraciones del mismo feature quedan sin tag.
#
# Uso:
#   ./scripts/versionar.sh            → muestra estado y qué vendría (no crea nada)
#   ./scripts/versionar.sh fix        → crea y empuja el próximo patch sobre HEAD
#   ./scripts/versionar.sh minor      → crea y empuja el próximo minor sobre HEAD
#
# A partir de la primera versión estable (v1.0) la cuenta es igual:
# fix → v1.0.x, feature grande → v1.1, y así.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

ultimo() {
  git tag --list 'v[0-9]*' | sort -V | tail -n 1
}

parse() { # $1 = tag → imprime: MAJOR MINOR PATCH (PATCH vacío si el minor no lo tiene)
  if [[ "$1" =~ ^v([0-9]+)\.([0-9]+)(\.([0-9]+))?$ ]]; then
    echo "${BASH_REMATCH[1]} ${BASH_REMATCH[2]} ${BASH_REMATCH[4]:-}"
  else
    echo "ERROR: tag '$1' no encaja con el esquema vX.Y(.Z)" >&2
    exit 1
  fi
}

proximo() { # $1: fix | minor → último tag válido, imprime el nuevo tag
  local action="$1"
  local MA MI PA
  read -r MA MI PA <<< "$(parse "$(ultimo)")"
  case "$action" in
    fix)
      if [ -z "$PA" ]; then PA=1; else PA=$((PA + 1)); fi
      echo "v${MA}.${MI}.${PA}" ;;
    minor)
      echo "v${MA}.$((MI + 1))" ;;
  esac
}

Accion="${1:-}"

if [ -n "$Accion" ] && [ "$Accion" != "fix" ] && [ "$Accion" != "minor" ]; then
  echo "Uso: $0 [fix|minor]  (sin argumento solo muestra el estado)" >&2
  exit 1
fi

U=$(ultimo)
read -r MA MI PA <<< "$(parse "$U")"

if [ -z "$Accion" ]; then
  echo "Último tag:    $U"
  echo "HEAD:          $(git log -1 --format='%h %s')"
  if git describe --tags --exact-match >/dev/null 2>&1; then
    echo "(HEAD ya tiene tag: $(git describe --tags --exact-match))"
  fi
  echo "Próximo fix:   $(proximo fix)"
  echo "Próximo minor: $(proximo minor)"
  echo
  echo "Para crear: $0 fix | $0 minor"
  exit 0
fi

if git describe --tags --exact-match >/dev/null 2>&1; then
  echo "ERROR: HEAD ya está tageado con $(git describe --tags --exact-match). No se tagea dos veces." >&2
  exit 1
fi

NUEVO=$(proximo "$Accion")
Asunto=$(git log -1 --format=%s)

git tag -a "$NUEVO" -m "$NUEVO — $Asunto"
git push origin "$NUEVO"
echo "Creado y empujado: $NUEVO (HEAD $(git rev-parse --short HEAD))"
