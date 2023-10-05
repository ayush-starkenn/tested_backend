const jwt = require("jsonwebtoken");
require("dotenv").config();

const authentication = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Use optional chaining to avoid errors if header is missing

  if (!token) {
    return res.status(401).json({ error: "Authentication token missing" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    req.decoded = decoded;
    if (err) {
      return res
        .status(401)
        .json({ error: "Authentication failed", details: err.message });
    } else {
      // Token is valid, continue with the next middleware
      next();
    }
  });
};

module.exports = { authentication };
