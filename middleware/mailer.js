require("dotenv").config();
const nodemailer = require("nodemailer");
const logger = require("../logger");
const pool = require("../config/db");
//const net = require("net");

// // OTP generation function
// function generateOTP() {
//   const otp = Math.floor(Math.random() * 1000000);
//   return otp;
// }

// // SMTP server configuration
// const smtpServer = {
//   host: "starkenn.com", // Replace with your SMTP server host
//   port: 25, // Standard SMTP port
// };

//     // Create a connection to the SMTP server
// const client = net.createConnection(smtpServer, () => {
//   console.log("Connected to SMTP server");
// }); 

// Send email function
async function sendEmail(email, otp) {

     const connection = await pool.getConnection();
  try {
    // Fetch user information by email
    const [userRows] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (userRows.length === 0) {
      throw new Error("User not found.");
    }

    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USERNAME_NOREPLY,
        pass: process.env.EMAIL_USERNAME_NOREPLY_PASS,
      },
    });


    // var body_html = `<!DOCTYPE html>
    // <html>
    //     <head>
    //         <!-- <title></title> -->
    //         <!-- <link rel="stylesheet" href="index.css"> -->
    //         <!-- <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
    //         <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    //         <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //         <script
    //         src="https://otp.jquery.com/jquery-3.6.0.min.js"
    //         integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4="
    //         crossorigin="anonymous"></script> -->
    //         <style>
    //             .card{
    //               /* background-image: url(.${process.env.TESTSERVER_STARKENN_URL}/uploads/emailAssets/bg-img.png); */
    //               /* height:600px; */
                  
    //             }
    //             .card1{
    //                 margin-top: 20px;
    //             }
    //             .card-background{
    //               /* background-image: url(${process.env.TESTSERVER_STARKENN_URL}/uploads/emailAssets/bg-img.png); */
    //               /* background-size: 400px auto; */
    //               background-repeat: no-repeat;
    //             }
    //             .logo{
    //               background-image: url(${process.env.TESTSERVER_STARKENN_URL}/uploads/emailAssets/img1.png);
    //               background-repeat: no-repeat;
    //               background-position: 50% 0%;
    //               width: 700px;
    //               margin-left: -30px;
    //             }
    //             .parent-div{
    //               position: relative;
    //               display:flex;
    //               justify-content: center;
    //             }
    //             .bottom-img{
    //               width: 700px;
    //               margin-top: 30px;
    //             }
    //             .text-top-left {
    //               position: absolute;
    //               top: 30px;
    //               text-align: center;
    //             }
    //             .rectangle{
    //               height:auto;
    //               background-color: #88A4F0;
    //               padding: 5px;
    //               border-radius: 7px;
    //               font-weight: 700;
    //               font-size: 14px;
    //             }
    //             .mail-img > img{
    //               width: 200px;
    //             }
    
    //             /* without bootstrap cdn work */
    //             .mt-4, .mt-3, .mt-2, .mt-5{
    //               margin-top: 20px;
    //             }
    //             .col-sm-4{
    //               width:700px;
    //               height:auto;
    //             }
    //             .rectangle{
    //               text-align: center;
    //               width: 80%;
    //               margin-left: 9%;
    //             }
    //             .mail-img{
    //               text-align: center;
    //               margin-top: 40px;
    //             }
    //             .button{
    //               text-align: center;
    //             }
    //             .card-body{
    //               width:90%;
    //               padding-left:30px;
    //             }
    //             h6{
    //               text-align: center;
    //               font-weight: 700;
    //               font-size: 15px;
    //               padding-top: 20px;
    //             }
    //             .img1{
    //               width: 400px;
    //               margin-top: 55px;
    //             }
    //             .rectanle-sm{
    //               height:40px;
    //               width:200px;
    //               background-color: #000000;
    //               font-size: 18px;
    //               padding: 2px 20px;
    //               border: 1px solid #083DCC;
    //             }
    //             .rect{
    //               height:30px;
    //               width:200px;
    //               background-color: #000000;
    //               font-size: 15px;
    //               padding: 2px 1px 2px 10px;
    //               border: 1px solid #083DCC;
    //             }
    //             .rect1{
    //               height:30px;
    //               width:200px;
    //               background-color: #FFFFFF;
    //               font-size: 15px;
    //               padding: 2px 70px;
    //             }
    //             .social-img{
    //               margin:auto;
    //             }
    //             .social-imgs{
    //               height:30px;
    //             }
    
    //         </style>
    //     </head>
    //     <body style="margin-left:15px;margin-right:15px;">
    //         <div class="row">
    //             <div class="col-sm-4" style="margin:auto;text-align: center;">
    //                 <div class="card card1">
    //                   <div class="card-background">
    //                     <div class="card-body">
    //                       <div class="logo">
    //                       <div class="mt-4">
    //                         <img class="img1" src="${process.env.TESTSERVER_STARKENN_URL}/uploads/emailAssets/Starkenn-logo.png" alt="">
    //                         <h1 style="margin-top:60px;font-size:30px;color:#000000">Dear Customer,</h1>
    //                         <p style="margin-top:-13px;font-size:20px;color:#000000">Thank you for being a part of Starkenn.</p>
    //                         <p style="margin-top:-13px;font-size:20px;color:#000000">We have received your request for reset your Login Password of your Starkenn account. </p>
    //                         <p style="margin-top:-13px;font-size:20px;color:#000000">Your One Time Password (OTP) is </p>
    //                       </div>
                          
    //                       <div style="margin-top:-40px">
    //                        <div style="display:flex;">
    //                           <div style="width:20%"><img src="${process.env.TESTSERVER_STARKENN_URL}/uploads/emailAssets/left-img.png" alt=""></div>
    //                           <div style="width:60%"><h1 style="margin-top:25%;font-size:30px;color:#000000">${otp}</h1></div>
    //                           <div style="width:20%"><img src="${process.env.TESTSERVER_STARKENN_URL}/uploads/emailAssets/right-img.png" alt="" style="margin-left: -47px;"></div>
    //                        </div>
    //                        <div>
    //                         <p style="margin-top: -50px;font-size:20px;color:#000000">This OTP will be valid for the next 10 minutes after receiving this email.For the security of your account, please do not share your OTP with anyone.</p>
    //                         <p style="margin-top: -50px;font-size:20px;color:#000000">If you didn't initiate this request or have any queries regarding it, kindly connect to ${process.env.EMAIL_USERNAME}.</p>
    //                         <div class="text-center">
    //                           <h4 style="font-size:20px;color:#000000"> &nbsp;&nbsp;<span style="">Sincerely,</span></h4>
    //                           <h4 style="font-size:20px;color:#000000"> &nbsp;&nbsp;<span style="">Starkenn Team</span></h4> 
    //                         </div>
    //                        </div>
    
    //                       </div>
    // <div style="color:#000000;margin-top: -7px;">
    //                             <p>Keep your account safe from phishing attacks. <br>
    //                               Set your phishing otp,<span style="font-weight:700">here.</span></p>
    //                           </div>
    //  <div >
    //                             <div>
    //                               <h1 style="color:#FFFFFF;margin-top: -7px;"><span class="rect">Anti-phishing &nbsp;&nbsp;<span class="rect1"></span></h1>
    //                             </div>
    //                           </div>
                         
    //                       <img class="bottom-img" src="${process.env.TESTSERVER_STARKENN_URL}/uploads/emailAssets/bottom-bg-img.png" alt="">
    //                           <div class="social-img" style="margin-top:20px;margin-bottom:20px">
    //                             <img class="social-imgs" src="${process.env.TESTSERVER_STARKENN_URL}/uploads/emailAssets/social-img1.png" alt="">&nbsp;&nbsp;&nbsp;&nbsp;
    //                             <img class="social-imgs" src="${process.env.TESTSERVER_STARKENN_URL}/uploads/emailAssets/social-img2.png" alt="">&nbsp;&nbsp;&nbsp;&nbsp;
    //                             <img class="social-imgs" src="${process.env.TESTSERVER_STARKENN_URL}/uploads/emailAssets/social-img3.png" alt="">&nbsp;&nbsp;&nbsp;&nbsp;
    //                             <img class="social-imgs" src="${process.env.TESTSERVER_STARKENN_URL}/uploads/emailAssets/social-img4.png" alt="">&nbsp;&nbsp;&nbsp;&nbsp;
    //                             <img class="social-imgs" src="${process.env.TESTSERVER_STARKENN_URL}/uploads/emailAssets/social-img5.png" alt="">&nbsp;&nbsp;&nbsp;&nbsp;
    //                             <img class="social-imgs" src="${process.env.TESTSERVER_STARKENN_URL}/uploads/emailAssets/social-img6.png" alt="">&nbsp;&nbsp;&nbsp;&nbsp;
    //                             <img class="social-imgs" src="${process.env.TESTSERVER_STARKENN_URL}/uploads/emailAssets/social-img7.png" alt="">&nbsp;&nbsp;&nbsp;&nbsp;
    //                           </div>
    //                         </div>
    //                       </div>
    //                       </div>
    //                     </div>
    //                   </div>
    //                 </div>
    //             </div>
    //         </div>
    //     </body>
    // </html>`



    // Compose the email message
    const msg = {
      from: process.env.EMAIL_USERNAME_NOREPLY,
      to: email,
      subject: "Testing",
     // html: body_html
      html: `<h3>Authentication otp is</h3><h1 style='font-weight:bold;'>${otp}</h1>`,
    };

    // Send the email
    await transporter.sendMail(msg);

  } catch (error) {
    logger.error("sendEmail error:", error);
    throw error;
      } finally {
        connection.release();
    }
};

// // Handling connection close
// client.on("end", () => {
//   console.log("Disconnected from SMTP server");
// });

module.exports = { sendEmail };
 