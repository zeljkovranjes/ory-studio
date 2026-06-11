#!/bin/sh
# Creates one database per Ory service in the shared dev cluster.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE DATABASE kratos;
  CREATE DATABASE hydra;
  CREATE DATABASE keto;
EOSQL
