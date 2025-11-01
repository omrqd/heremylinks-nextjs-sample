const jwt = require('jsonwebtoken');
const fs = require('fs');

// Replace these with your actual values
const TEAM_ID = 'KB8ZMJ5Q6B'; // 10-character Team ID
const CLIENT_ID = 'com.heremylinks.web'; // Your Services ID
const KEY_ID = '6C9S834K7S'; // 10-character Key ID
const PRIVATE_KEY_PATH = './Key.p8'; // Path to your downloaded .p8 file

// Read the private key
const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

// Generate JWT token (valid for 6 months)
const token = jwt.sign(
  {
    iss: TEAM_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15777000, // 6 months
    aud: 'https://appleid.apple.com',
    sub: CLIENT_ID,
  },
  privateKey,
  {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: KEY_ID,
    },
  }
);

console.log('Apple Client Secret (JWT):');
console.log(token);