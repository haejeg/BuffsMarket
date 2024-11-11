CREATE TABLE users (
    email VARCHAR(50) PRIMARY KEY NOT NULL, -- used to be username -- 
    password CHAR(60) NOT NULL,
    nickname VARCHAR(60) NOT NULL
);
