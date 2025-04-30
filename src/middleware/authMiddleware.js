const jwt = require("jsonwebtoken");

// Authentication middleware
exports.authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.userId,
      role: payload.role ? String(payload.role).toLowerCase() : undefined
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(403).json({ message: "Forbidden" });
  }
};

// Authorization middleware
exports.authorizeRoles = (roles) => (req, res, next) => {
  const allowed = roles.map(r => String(r).toLowerCase());
  console.log(
    "→ authorizeRoles sees req.user.role =", req.user?.role,
    "and normalized roles =", allowed
  );

  if (!req.user || !allowed.includes(req.user.role)) {
    return res
      .status(403)
      .json({ message: `Forbidden – insufficient role (saw "${req.user?.role}")` });
  }
  next();
};

// Utility to verify a raw token (e.g. in services)
exports.verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) reject(err);
      else resolve(payload.userId);
    });
  });
};