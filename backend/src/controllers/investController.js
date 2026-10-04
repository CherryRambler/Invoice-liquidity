const Token = require('../models/Token');
const Investor = require('../models/Investor');

const investInToken = async (req, res) => {
    try {
        const { name, email, amount } = req.body;
        const token = await Token.findById(req.params.id);

        if (!token) {
            return res.status(404).json({ message: 'Token not found' });
        }

        if (token.isFullyFunded) {
            return res.status(400).json({ message: 'This token is already fully funded' });
        }

        const remaining = token.totalValue - token.amountFunded;
        if (amount > remaining) {
            return res.status(400).json({ message: `Amount exceeds remaining need of ${remaining}` });
        }

        let investor = await Investor.findOne({ email });
        if (!investor) {
            investor = await Investor.create({ name, email });
        }

        token.investments.push({ investor: investor._id, amount });
        token.amountFunded += amount;

        if (token.amountFunded >= token.totalValue) {
            token.isFullyFunded = true;
        }

        await token.save();

        res.status(200).json(token);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getTokens = async (req, res) => {
    try {
        const tokens = await Token.find().populate('invoice');
        res.status(200).json(tokens);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { investInToken, getTokens };