const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Token not provided" });

    if (token.startsWith("Bearer ")) {
      token = token.slice(7);
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.approve) {
      return res.status(403).json({ message: "Access denied: User not approved" });
    }

    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
