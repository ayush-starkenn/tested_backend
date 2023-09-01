const axios = require("axios");
require("dotenv").config();
const logger = require("../logger");
const pool = require("../config/db");

async function sendWhatsappMessage(phone) {
  const connection = await pool.getConnection();

  try {
    const whatsappUrl = process.env.WHATSAPP_URL;
    const accessToken = process.env.ACCESS_TOKEN; // Use environment variable for access token

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const messageData = {
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: { name: "hello_world", language: { code: "en_US" } },
      text: { body: "Hello from WhatsApp using Axios!" },
    };

    const response = await axios.post(whatsappUrl, messageData, { headers });
  } catch (error) {
    logger.error("sendWhatsappMessage error:", error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { sendWhatsappMessage };
