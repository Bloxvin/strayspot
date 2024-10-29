/*
Project Title : StraySpotter
Project Description : A web service that utilizes Wasabi cloud, for people to share stray cat pictures.
  The data will be analysed to provide the insight of the stray cats.
Member : KIM JOWOON, KELVIN, ALEX
Date Started : 21.10.2024
Current version : 2.0
Version date : 24.10.2024
*/


const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, CreatePresignedUrlCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const {Readable} = require('stream');
const crypto = require('crypto');
const exifr = require('exifr');
const heicConvert = require('heic-convert');
const { insertDataToDB, fetchGPSByID } = require('./db.js');

require('dotenv').config();

const access_key_id = process.env.ACCESS_KEY_ID;
const secret_access_key_id = process.env.SECRET_ACCESS_KEY_ID;

const bucket_name = "catphotos"
const HOST = "192.168.6.17";

const app = express();

const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage: storage }).single('image'); // Name of the input field
const client_folder_name = "public";

var fileData;

const s3Client = new S3Client({
  region: 'ap-southeast-1', // Region, adjust as needed
  endpoint: 'https://s3.ap-southeast-1.wasabisys.com', // Wasabi endpoint
  credentials: {
    accessKeyId: access_key_id, // Your Wasabi access key
    secretAccessKey: secret_access_key_id, // Your Wasabi secret key
  },
});


async function convertHeicToJpg(inputBuffer) {

  // Extract EXIF data
  // const exifData = await exifr.parse(inputBuffer);

  // Convert HEIC to JPG
  const jpgBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG', // Output format
      quality: 1, // Quality from 0 to 1
  });

  // Optionally, you can write EXIF data back to the JPG file
  // (Use a library like exiftool-vendored for writing)

  // const tempJpgPath = tmp.tmpNameSync({ postfix: '.jpg' });
    
  // try {
  //     // Write the original JPEG buffer to the temporary file
  //     fs.writeFileSync(tempJpgPath, jpgBuffer);

  //     // Write the EXIF data to the temporary file
  //     await exiftool.write(tempJpgPath, exifData);

  //     // Read the modified JPEG file back into a buffer
  //     const modifiedJpegBuffer = fs.readFileSync(tempJpgPath);

  //     return modifiedJpegBuffer; // Return the modified JPEG buffer
  // } finally {
  //     // Cleanup: remove the temporary file
  //     fs.unlinkSync(tempJpgPath);
  // }

  return jpgBuffer; // Return the JPG buffer
}

// Function to create a 32-bit hash from a string
function create32BitHash(input) {
  // Create a SHA-256 hash of the input
  const hash = crypto.createHash('sha256');
  hash.update(input);

  // Get the full hash as a Buffer
  const fullHash = hash.digest();

  // Convert the first 4 bytes (32 bits) of the hash to a hexadecimal string
  const thirtyTwoBitHash = fullHash.readUInt32BE(0).toString(16).padStart(8, '0');

  return thirtyTwoBitHash;
}

function uploadData(fileData, res, unique_id) {

    console.log(fileData);
    // const providedFilename = req.body.filename; - For user input / Not used anyomre
    const params = {
      Bucket: bucket_name, // Your Wasabi bucket name
      Key: unique_id, // File name in S3
      Body: fileData,
    };

    try {
      const command = new PutObjectCommand(params);
      const data = s3Client.send(command);
      res.send(`File uploaded successfully at https://${bucket_name}.s3.wasabisys.com/${params.Key}`);
    } catch (s3Err) {
      return res.status(500).send(s3Err.message);
    }
}



app.use(express.static(path.join(__dirname, client_folder_name)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, client_folder_name, 'index.html'),); //(__dirname, client_folder_name, 'index.html'),);
});

app.post('/upload', async (req, res) => {

  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    if (!req.file) {
      return res.status(400).send('No file selected!');
    }
    

    // TO be deleted, generating temporary file name
    // const providedFilename = req.file.originalname;
    // let unique_id = create32BitHash(providedFilename);

    // Converting heic to jpg with metadata

    const exifData = await exifr.parse(req.file.buffer);
    console.log(exifData);
    insertDataToDB(exifData).then(picture_id => {
      console.log(picture_id); 

      if (req.file.mimetype == 'image/heic'){
        fileData = convertHeicToJpg(req.file.buffer).then(fileData => { 
            uploadData(fileData, res, 'k' + picture_id)  
        })
      } else { 
        fileData = req.file.buffer
        uploadData(fileData, res, 'k' + picture_id)  
      }
    }).catch(err => {
      console.error("Error inserting data:", err);
    });

  });
});


// List images in the bucket
app.get('/images', async (req, res) => {
    const params = {
      Bucket: bucket_name,
    };

    console.log(req.query);
    const maxKeys = req.query.maxKeys;
    console.log(maxKeys);
    try {
      const command = new ListObjectsV2Command(params);
      const data = await s3Client.send(command);
      
      const imageKeys = (data.Contents || []).map(item => item.Key);

      imageKeys.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10); // Extract number from key name
        const numB = parseInt(b.replace(/\D/g, ''), 10);
        return numB - numA; // Compare in descending order
      });

      res.json(imageKeys.slice(0,maxKeys));
    } catch (err) {
      return res.status(500).send(err.message);
    }
  });

  // Generate a pre-signed URL for accessing an image
  app.get('/image-url', async (req, res) => {

    const { key } = req.query;

    fetchGPSByID(key.slice(1)).then(data => {
      // Process the returned data here

      data_latitude = data[0].latitude ?? ""
      data_longitude = data[0].longitude ?? ""
      if (!key) {
        return res.status(400).send('Key is required');
      }
    
      const params = {
        Bucket: bucket_name,
        Key: key,
        Expires: 60 * 5, // URL expiration time in seconds
      };
    
      try {
        getSignedUrl(s3Client, new GetObjectCommand(params)).then(url => {
          res.json({
            url: url,
            latitude: data_latitude,
            longitude: data_longitude
        })
      });
      } catch (err) {
        return res.status(500).send(err.message);
      }
    }).catch(error => {
      // Handle any errors from select_data
      console.error('Error fetching data:', error);
    });
  });

// Handle the download
app.get('/download', async (req, res) => {
    const { key } = req.query; // Get the file key from query params
  
    const params = {
      Bucket: bucket_name, // Your Wasabi bucket name
      Key: key, // File key to download
    };
  
    try {
      const command = new GetObjectCommand(params);
      const { Body } = await s3Client.send(command);
  
      // Stream the file to the response
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(key)}"`);
      Body.pipe(res);
    } catch (s3Err) {
      return res.status(500).send(s3Err.message);
    }
  });

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});