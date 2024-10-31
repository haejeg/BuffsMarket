CREATE DATABASE users_db;
USE users_db;

CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
);
