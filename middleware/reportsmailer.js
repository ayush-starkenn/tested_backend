const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const logger = require("../logger");
const pool = require("../config/db");
require("dotenv").config();

// Define a function to send the reports via email
async function sendReportsByEmail(userEmail, reportData) {
    const connection = await pool.getConnection();
    try{
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
              user: process.env.EMAIL_USERNAME_NOREPLY,
              pass: process.env.EMAIL_USERNAME_NOREPLY_PASS,
            },
          });

  // Define email content and options
  const mailOptions = {
    from: process.env.EMAIL_USERNAME_NOREPLY,
    to: userEmail,
    subject: 'Daily/Weekly Reports',
    text: 'Attached are your daily/weekly reports.',
    attachments: [
      {
        filename: 'report.pdf', // Replace with your report file
        path: 'path-to-report.pdf', // Replace with the actual path to your report file
      },
    ],
  };

  // Send the email
  await transporter.sendMail(mailOptions);
} catch (error) {
  logger.error("sendEmail error:", error);
  throw error;
} finally {
  connection.release();
}
}

module.exports = { sendEmail };

// Schedule the reports to be sent daily at a specific time (e.g., 1:00 AM)
schedule.scheduleJob('0 1 * * *', () => {
    
    const dailyReportData = fetchDailyReportData();
    const userEmail = 'rohitshekhawat@starkenn.com';
    sendReportsByEmail(userEmail, dailyReportData);
  });
  
  // Schedule the reports to be sent weekly on Mondays at a specific time (e.g., 1:00 AM)
  schedule.scheduleJob('0 1 * * 1', () => {

    const weeklyReportData = fetchWeeklyReportData();
    const userEmail = 'rohitshekhawat@starkenn.com'; 
    sendReportsByEmail(userEmail, weeklyReportData);
  });