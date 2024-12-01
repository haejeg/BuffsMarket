#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://users_db_dr6j_user:SpfcBFsD1WAKl2Yeb2Loap059wH7txB4@dpg-ct5rp356l47c73fr6qq0-a.oregon-postgres.render.com/users_db_dr6j"

# Execute each .sql file in the directory
for file in ../init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done