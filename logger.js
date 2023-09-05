const winston = require("winston");
const { format } = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Use your preferred format
    format.printf(({ timestamp, level, message }) => {
      const istTimestamp = new Date(timestamp).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata", // Replace with your desired time zone
      });

      return `${istTimestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV === "production") {
  logger
    .clear()
    .add(new winston.transports.File({ filename: "production.log" }));
}

module.exports = logger;