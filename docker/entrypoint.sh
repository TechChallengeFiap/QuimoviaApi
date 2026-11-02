#!/bin/sh
set -e

echo "==> [Quimovia API] Aplicando migrações do banco de dados (Prisma)..."
max_retries=15
counter=0
until npx prisma migrate deploy; do
  if [ "$counter" -eq "$max_retries" ]; then
    echo "==> [Quimovia API] Erro: Não foi possível aplicar migrações após $max_retries tentativas adicionais."
    exit 1
  fi
  counter=$((counter + 1))
  echo "==> [Quimovia API] Aguardando banco de dados para migração ($counter/$max_retries)..."
  sleep 2
done

if [ -n "$ADMIN_PASSWORD" ] && [ "${#ADMIN_PASSWORD}" -ge 8 ]; then
  echo "==> [Quimovia API] Executando seed de administrador inicial..."
  npm run migrate:seed
else
  echo "==> [Quimovia API] ADMIN_PASSWORD não configurado com ao menos 8 caracteres; pulando seed inicial."
fi

echo "==> [Quimovia API] Inicializando servidor..."
exec "$@"
