const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

 if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access denied. No token provided",
            });
        }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({
                message: "User not found",
            });
        }

        req.user = user;

        next();

} catch (error) {
    return res.status(401).json({
    message: "Invalid or expired token",
        });
    }
};


const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {

 if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You do not have permission to access this resource",
            });
        }

        next();
    };
};


module.exports = {
    authMiddleware,
    roleMiddleware,
};