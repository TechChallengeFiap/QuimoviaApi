#!/bin/sh
set -eu

# Executar pela imagem da API: docker run --rm -i --network none --entrypoint sh IMAGEM < este-arquivo
entrypoint=/app/docker/entrypoint.sh
test_root=$(mktemp -d)
mkdir -p "$test_root/bin"

cat > "$test_root/bin/npx" <<'MOCK'
#!/bin/sh
attempts=0
if [ -f "$CASE_DIR/attempts" ]; then
  attempts=$(cat "$CASE_DIR/attempts")
fi
attempts=$((attempts + 1))
printf '%s' "$attempts" > "$CASE_DIR/attempts"
[ "$attempts" -ge "$SUCCEED_ON" ]
MOCK

cat > "$test_root/bin/npm" <<'MOCK'
#!/bin/sh
touch "$CASE_DIR/seed-started"
exit "$SEED_EXIT"
MOCK

cat > "$test_root/bin/sleep" <<'MOCK'
#!/bin/sh
exit 0
MOCK

chmod +x "$test_root/bin/"*
PATH="$test_root/bin:$PATH"
ADMIN_PASSWORD=validation-password
export PATH ADMIN_PASSWORD

run_case() {
  name=$1
  SUCCEED_ON=$2
  SEED_EXIT=$3
  expected_exit=$4
  expected_attempts=$5
  expected_api=$6
  CASE_DIR="$test_root/$name"
  mkdir -p "$CASE_DIR"
  export CASE_DIR SUCCEED_ON SEED_EXIT

  actual_exit=0
  sh "$entrypoint" sh -c 'touch "$CASE_DIR/api-started"' > "$CASE_DIR/output" 2>&1 || actual_exit=$?
  if [ "$actual_exit" -ne "$expected_exit" ] || [ "$(cat "$CASE_DIR/attempts")" -ne "$expected_attempts" ]; then
    cat "$CASE_DIR/output"
    echo "Falha: $name (saída $actual_exit)." >&2
    exit 1
  fi
  actual_api=no
  if [ -f "$CASE_DIR/api-started" ]; then actual_api=yes; fi
  if [ "$actual_api" != "$expected_api" ]; then
    echo "Falha: $name iniciou a API em estado inesperado." >&2
    exit 1
  fi
  echo "OK: $name"
}

run_case migration_succeeds_on_last_attempt 16 0 0 16 yes
run_case migration_exhausts_retries 99 0 1 16 no
run_case seed_failure_prevents_startup 1 42 42 1 no
