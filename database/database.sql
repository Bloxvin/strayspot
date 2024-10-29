CREATE DATABASE IF NOT EXISTS strayspotter_database;
USE strayspotter_database;

CREATE TABLE IF NOT EXISTS pictures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    latitude FLOAT,
    longitude FLOAT,
    date_taken DATE,
    postcode INT,
    district_no INT,
    district_name VARCHAR(20),
    cat_status Int
);

SELECT * FROM pictures;