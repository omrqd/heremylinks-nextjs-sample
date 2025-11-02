const jwt = require('jsonwebtoken');
const fs = require('fs');

// Replace these with your values
const TEAM_ID = 'KB8ZMJ5Q6B';           // 10 characters
const CLIENT_ID = 'com.heremylinks.app';  // Your Service ID
const KEY_ID = 'C2MPP6X9PC';             // 10 characters
const KEY_FILE = './key.p8';    // Path to your .p8 file

// Read the private key
const privateKey = fs.readFileSync(KEY_FILE);

// Create the JWT
const token = jwt.sign(
  {},
  privateKey,
  {
    algorithm: 'ES256',
    expiresIn: '180d',
    issuer: TEAM_ID,
    header: {
      alg: 'ES256',
      kid: KEY_ID
    },
    audience: 'https://appleid.apple.com',
    subject: CLIENT_ID
  }
);

console.log(token);