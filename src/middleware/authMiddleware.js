const jwt = require("jsonwebtoken");


exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: "Access Denied" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Invalid Authorization Format" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid Token" });
        }

        req.user = user;
        next();
    });
};

exports.verifyToken = (token) => {
    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user.userId); // ← Adjust this based on your payload
        }
      });
    });
  };
  

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