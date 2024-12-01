#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://users_db_idl3_user:o0TBQ2FOpKMNfXF58E0lUbt96pDJr0ct@dpg-csvmck56l47c73dojvog-a.oregon-postgres.render.com/users_db_idl3"

# Execute each .sql file in the directory
for file in ../init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done