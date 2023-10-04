const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const nodemailer = require("nodemailer");
const logger = require("../logger");
const pool = require("../config/db");

const app = express();

// Set up body parser middleware to parse JSON requests
app.use(bodyParser.json());
// const vapidKeys = webpush.generateVAPIDKeys();
// console.log('VAPID public key:', vapidKeys.publicKey);
// console.log('VAPID private key:', vapidKeys.privateKey);
// Configure VAPID keys
const vapidKeys = {
  publicKey: 'BAP9DtdApxAyWJdlfv8IyJfyb-fZjVdc3bxl2MMg5OQX-3ktbn1xJ19w5Kt78mAWEDNiTVyQ_35j9qnFtOa1r2Y',
  privateKey: 'FHm_UHy36u3AeYqJY_YbO2XWZj1DrxX52c-4C4CXex0',
};

webpush.setVapidDetails('mailto:rohitshekhawat@starkenn.com', vapidKeys.publicKey, vapidKeys.privateKey);


// Route for sending push notifications
const notification =  (req, res, next) => {
  const subscription = req.body.subscription;
  const notificationPayload = {
    title: 'Notification Title',
    body: 'Notification Body',
    icon: 'icon.png',
  };

  webpush
    .sendNotification(subscription, JSON.stringify(notificationPayload))
    .then(() => {
      res.status(200).send('Notification sent successfully.');
    })
    .catch((error) => {
      console.error('Error sending push notification:', error);
      res.status(500).send('Error sending push notification.');
    });
}

module.exports = { notification };