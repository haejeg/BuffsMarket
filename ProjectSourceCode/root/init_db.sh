#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://users_db_jjdd_user:SZNAD2loAVW7vjojTCuGI4N3Ffi3JejE@dpg-ct819bhu0jms73ati7hg-a.oregon-postgres.render.com/users_db_jjdd"

# Execute each .sql file in the directory
for file in init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done