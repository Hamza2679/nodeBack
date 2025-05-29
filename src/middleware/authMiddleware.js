const jwt = require("jsonwebtoken");


exports.authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Missing or malformed Authorization header" });
    }

    const token = authHeader.split(' ')[1];
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user; // Attach decoded user to request
        next();
    } catch (err) {
        return res.status(401).json({ 
            message: err.name === 'TokenExpiredError' 
                ? "Token expired" 
                : "Invalid token" 
        });
    }
};

  exports.verifyToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.user?.id || decoded.userId; // Flexible to payloads
    } catch (err) {
        throw new Error("Invalid token");
    }
};

exports.authorizeRoles = (roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ message: "User not authenticated" });
    }

    const userRole = String(req.user.role).toLowerCase();
    const allowedRoles = roles.map(r => String(r).toLowerCase());

    if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
            message: `Role "${req.user.role}" is not permitted` 
        });
    }
    next();
};