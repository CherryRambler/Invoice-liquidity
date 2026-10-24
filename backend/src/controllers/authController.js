const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const signToken = (user) =>
    jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
});

const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if ([name, email, password].some((value) => typeof value !== 'string' || !value.trim())) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            return res.status(400).json({ message: 'Please enter a valid email address' });
        }

        if (!['business', 'investor'].includes(role)) {
            return res.status(400).json({ message: 'Role must be business or investor' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        // bcrypt ignores everything after 72 bytes, so a longer password would match any password sharing that prefix.
        if (Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(400).json({ message: 'Password must be at most 72 characters' });
        }

        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(409).json({ message: 'An account with this email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, passwordHash, role });

        res.status(201).json({ token: signToken(user), user: publicUser(user) });
    } catch (error) {
        // Two sign-ups with the same email at once can both pass the check above.
        if (error.code === 11000) {
            return res.status(409).json({ message: 'An account with this email already exists' });
        }
        res.status(400).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        const passwordOk = user && (await bcrypt.compare(password, user.passwordHash));

        if (!passwordOk) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({ token: signToken(user), user: publicUser(user) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const me = (req, res) => {
    res.status(200).json(publicUser(req.user));
};

module.exports = { register, login, me };