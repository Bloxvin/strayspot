// Functions interacting with the database
module.exports = {
  insertDataToDB, fetchRecentPhotoID, createDBConnection, countPicturesToday, fetchGPSByID
}
const mysql = require('mysql2');
require('dotenv').config();

// THE ADDRESS AND CAT STAUTS TO BE UPDATED
function insertDataToDB(metadata) {
  const connection = createDBConnection()
  let data = {
    latitude : metadata.latitude,
    longitude : metadata.longitude,
    date : metadata.CreateDate ?? "9999-12-30",
    postcode : 123,
    district_no : 12,
    district_name : 'TEST',
    cat_status : 1,
  };

  return new Promise((resolve, reject) => {
    connection.query(
      `INSERT INTO pictures (latitude, longitude, date_taken, postcode, 
      district_no, district_name, cat_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.latitude, data.longitude, data.date, data.postcode, data.district_no, data.district_name, data.cat_status],
      (err, results) => {
        if (err) { reject(err);} 
        else { resolve(results.insertId); }
        connection.end();
      })
  })
}


function fetchRecentPhotoID(number = 4) {
  const connection = createDBConnection();
  
  return new Promise((resolve, reject) => {
    // A query to fetch recent photo ids from the DB
    connection.query(
      `SELECT id FROM pictures ORDER BY id DESC LIMIT ?`, [number],
      (err, results) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(results);
        }
        connection.end();
      }
    );
  });
}


function fetchGPSByID(id) {
  return new Promise((resolve, reject) => {
    const connection = createDBConnection();

    // A query to select data from the table
    connection.query(
      `SELECT latitude, longitude FROM pictures WHERE id = ?`, 
      [id], // Pass `id` as an array for parameter binding
      function (err, results) {
        // Ends the connection
        connection.end();
        if (err) {
          return reject(err); // Reject the promise with the error
        }
        resolve(results); // Resolve the promise with the results
      }
    );
  });
}

  
function countPicturesToday() {
  const connection = createDBConnection();
  
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT COUNT(id) as count FROM pictures WHERE date_taken = CURDATE();`,
      (err, results) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          const count = results[0].count;
          resolve(count);
        }
        connection.end();
      }
    );
  })
}

//TODO: Instead of reconnecting everytime, cConnect once the app starts
function createDBConnection() {
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'strayspotter_database',
    password: process.env.DB_PASSWORD,
  });
  return connection;
}