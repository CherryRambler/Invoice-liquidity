const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
    try {
        const header = req.headers.authorization || '';
        const [scheme, token] = header.split(' ');

        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({ message: 'Please log in' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-passwordHash');

        if (!user) {
            return res.status(401).json({ message: 'Account no longer exists' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Session expired or invalid. Please log in again' });
    }
};

const requireRole = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).json({ message: `Only ${role} accounts can do this` });
    }
    next();
};

module.exports = { authenticate, requireRole };