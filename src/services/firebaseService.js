// services/firebaseService.js
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '../config/firebase-service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://astu-social-57f7f-default-rtdb.firebaseio.com" 
});

const realtimeDb = admin.database();

module.exports = {
  realtimeDb
};
