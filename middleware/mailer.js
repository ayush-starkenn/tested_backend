const nodemailer = require("nodemailer");
const logger = require("../logger");
const pool = require("../config/db");
require("dotenv").config();

async function sendEmail(email, type, otp, first_name, company_name, modified_at) {
  const connection = await pool.getConnection();
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USERNAME_NOREPLY,
        pass: process.env.EMAIL_USERNAME_NOREPLY_PASS,
      },
    });

    if (type == 1) {
    {
      var subject = "Welcome";

      var body_html = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Stark-i</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
          <table style="line-height: 1.5em ;width: 100%; max-width: 600px; margin: 0 auto; background-color: #f1f1f1; color: #333;">
              <tr>
                  <td style="padding: 12px; text-align: center;">
                      <h2 style="font-size: 24px; text-align: center; margin: 0; padding: 0;">Welcome to Stark-i</h2>
                      <!--p style="font-size: 18px; text-align: center; margin: 0; padding: 0;"-->
                  </td>
              </tr>
              <tr>
              <td style="padding: 12px; text-align: center;">Advanced Telematics and Data Analytics Platform</td>
              <tr>
                  <td style="padding: 12px; font-size: 16px; text-align: left;">Hi Customer <br>To access the Stark-i Platform, you need to create a new password.</td>
              </tr>
              <tr>
                  <td style="padding: 12px; font-size: 16px; text-align: left;">Your Email is <strong>${email}</strong></td>
              </tr>
              <tr>
                  <td style="padding: 12px; font-size: 16px; text-align: left;">Default Password - <strong>qwerty</strong></td>
              </tr>
              <tr>
                  <td style="padding: 12px; text-align: center;">
                      <a href="" style="text-decoration: none;">
                          <button style="background-color: black; padding: 10px 12px; border-radius: 10px; color: white; font-weight: bold; text-decoration: none; display: inline-block; margin-top: 12px; margin-bottom: 40px;">Get Started</button>
                      </a>
                  </td>
              </tr>
              <tr>
                  <td style="font-family: 'montserrat' ;font-style: italic ;padding: 12px; text-align: center; font-weight: bold; font-size: 16px;">For security purposes, this link is valid for 7 days.</td>
              </tr>
              <tr>
                  <td style="padding: 12px; font-size: 16px; text-align: left;">In case of any issues, please get in touch with <a href="mailto:support@starkenn.com" style="text-decoration: none; color: blue; font-weight: bold;">support@starkenn.com</a></td>
              </tr>
              <tr>
                  <td style="padding: 12px; font-size: 16px; text-align: left;">This is a system-generated email. Please don't reply</td>
              </tr>
              
          <tr style="background-color: #333; color: white;"><td style=" text-align: center; padding: 10px; font-size: 14px;">Starkenn all rights reserved ❤</td></tr>
          </table>
      </body>
      </html>`
    }
  }

if (type == 2) {

  {
    var subject = "For Password Changed";

    var body_html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title> Your password is successfully changed!</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; height: 100vh;">
        <table style="line-height: 1.5em ;width: 100%; max-width: 600px; margin: 0 auto; background-color: #f1f1f1; height: 100vh; align-items: center; color: #333;">
            <tr>
                <td style="padding: 12px; text-align: center;">
                    <h2 style="font-size: 24px; text-align: center; margin: 0; padding: 0;">Password Changed for Stark-i.</h2>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">Hi ${first_name},  ${company_name}, your password has been changed successfully on ${modified_at} .Do not share with anyone. -Starkenn.</td>
            </tr>
            
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">If you have not raised this request or for any problem please contact us: <a href="mailto:support@starkenn.com" style="text-decoration: none; color: blue; font-weight: bold;">support@starkenn.com</a></td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">This is a system-generated email. Please don't reply</td>
            </tr>
            
        <tr style="background-color: #333; color: white;"><td style=" text-align: center; padding: 10px; font-size: 14px;">Starkenn | Gaikwad Information Technology Park, Aundh, Pune 411007 | Starkenn all rights reserved ❤</td></tr>
        </table>
    </body>
    </html>`
  }
}
    
if (type == 3) {

  {
    var subject = "For Forgot Password OTP";

    var body_html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title> One-Time Password (OTP) for password re-set</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; height: 100vh;">
        <table style="line-height: 1.5em ;width: 100%; max-width: 600px; margin: 0 auto; background-color: #f1f1f1; height: 100vh; align-items: center; color: #333;">
            <tr>
                <td style="padding: 12px; text-align: center;">
                    <h2 style="font-size: 24px; text-align: center; margin: 0; padding: 0;">Password Reset Request for Stark-i</h2>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">Hi ${first_name}, ${company_name} , your OTP for Password reset on Stark-i is  ${otp}</td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">Please note, this OTP is valid only for 10 mins.</td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">Please do not share this One Time Password with anyone.</td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">If you have not raised this request or for any problem please contact us: <a href="mailto:support@starkenn.com" style="text-decoration: none; color: blue; font-weight: bold;">support@starkenn.com</a></td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">This is a system-generated email. Please don't reply</td>
            </tr>
            
        <tr style="background-color: #333; color: white;"><td style=" text-align: center; padding: 10px; font-size: 14px;">Starkenn | Gaikwad Information Technology Park, Aundh, Pune 411007 | Starkenn all rights reserved ❤</td></tr>
        </table>
    </body>
    </html>
    `
  }
}

if (type == 4) {

  {
    var subject = "For User Update";

    var body_html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title> Update on your Account details</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; height: 100vh;">
        <table style="line-height: 1.5em ;width: 100%; max-width: 600px; margin: 0 auto; background-color: #f1f1f1; height: 100vh; align-items: center; color: #333;">
            <tr>
                <td style="padding: 12px; text-align: center;">
                    <h2 style="font-size: 24px; text-align: center; margin: 0; padding: 0;">Congratulations! Your Stark-i is updated Successfully.</h2>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">Hi ${first_name},  ${company_name}, Your details have been successfully updates and you can see the changes now on stark-i platform.</td>
            </tr>
            
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">If you have not raised this request or for any problem please contact us: <a href="mailto:support@starkenn.com" style="text-decoration: none; color: blue; font-weight: bold;">support@starkenn.com</a></td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">This is a system-generated email. Please don't reply</td>
            </tr>
            
        <tr style="background-color: #333; color: white;"><td style=" text-align: center; padding: 10px; font-size: 14px;">Starkenn | Gaikwad Information Technology Park, Aundh, Pune 411007 | Starkenn all rights reserved ❤</td></tr>
        </table>
    </body>
    </html>
    `
  }
}
// console.log("first_name",first_name,);
// console.log("company_name",company_name,);
if (type == 5) {

  {
    var subject = "For Vehicle Alert";

    var body_html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title> Alert #1: Something Happened
        </title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; height: 100vh;">
        <table style="line-height: 1.5em ;width: 100%; max-width: 600px; margin: 0 auto; background-color: #f1f1f1; height: 100vh; align-items: center; color: #333;">
            <tr>
                <td style="padding: 12px; text-align: center;">
                    <h2 style="font-size: 24px; text-align: center; margin: 0; padding: 0;">Check this out ! you got an alert.</h2>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">Accident happened with the Driver/vehicle XYZ at[time].</td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">Location: Latitude->28.44 , Longitude->77.21</td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">Severity: high</td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">Speed: 150km/hr</td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">Gmap Url: https://google.maps/kha+jana+hai/paunch+gye</td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">Driver & Vehicle details: MH12VP2233</td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">Date and Time : 22-Aug-2022 01:12 PM</td>
            </tr>
    
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">To check the event please check out portal.</td>
            </tr>
            
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">For any support, please contact us: <a href="mailto:support@starkenn.com" style="text-decoration: none; color: blue; font-weight: bold;">support@starkenn.com</a></td>
            </tr>
            <tr>
                <td style="padding: 12px; font-size: 16px; text-align: left;">This is a system-generated email. Please don't reply</td>
            </tr>
            
        <tr style="background-color: #333; color: white;"><td style=" text-align: center; padding: 10px; font-size: 14px;">Starkenn | Gaikwad Information Technology Park, Aundh, Pune 411007 | Starkenn all rights reserved ❤</td></tr>
        </table>
    </body>
    </html>
    `
  }
}

    const msg = {
      from: process.env.EMAIL_USERNAME_NOREPLY,
      to: email,
      subject: subject,
      html: body_html,
    };

    await transporter.sendMail(msg);
  } catch (error) {
    logger.error("sendEmail error:", error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { sendEmail };
