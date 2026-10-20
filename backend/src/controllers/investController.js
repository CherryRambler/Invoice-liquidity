const Token = require('../models/Token');
const Investor = require('../models/Investor');

const investInToken = async (req, res) => {
    try {
        const { name, email } = req.body;
        const amount = Number(req.body.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }

        const existing = await Token.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Token not found' });
        }

        let investor = await Investor.findOne({ email: email.toLowerCase().trim() });
        if (!investor) {
            investor = await Investor.create({ name, email });
        }

        const token = await Token.findOneAndUpdate(
            {
                _id: req.params.id,
                isFullyFunded: false,
                $expr: { $lte: [{ $add: ['$amountFunded', amount] }, '$totalValue'] },
            },
            {
                $inc: { amountFunded: amount },
                $push: { investments: { investor: investor._id, amount } },
            },
            { new: true }
        );

        if (!token) {
            return res.status(400).json({ message: 'Token is fully funded or amount exceeds what is still needed' });
        }

        if (token.amountFunded >= token.totalValue) {
            token.isFullyFunded = true;
            await token.save();
        }

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