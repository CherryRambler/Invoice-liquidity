const mongoose = require('mongoose');
const Token = require('../models/Token');

// Investors should only see their own investments, not who else invested or how much.
const forInvestor = (token, userId) => {
    const data = token.toObject();
    data.investments = data.investments.filter(
        (investment) => investment.investor?.toString() === userId.toString()
    );
    return data;
};

const investInToken = async (req, res) => {
    try {
        const amount = Number(req.body.amount);

        if (!Number.isInteger(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Amount must be a whole number of rupees greater than zero' });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: 'Token not found' });
        }

        const existing = await Token.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Token not found' });
        }

        let token = await Token.findOneAndUpdate(
            {
                _id: req.params.id,
                isFullyFunded: false,
                $expr: { $lte: [{ $add: ['$amountFunded', amount] }, '$totalValue'] },
            },
            {
                $inc: { amountFunded: amount },
                $push: { investments: { investor: req.user._id, amount } },
            },
            { returnDocument: 'after' }
        );

        if (!token) {
            return res.status(400).json({ message: 'Token is fully funded or amount exceeds what is still needed' });
        }

        if (token.amountFunded >= token.totalValue) {
            token = await Token.findByIdAndUpdate(
                token._id,
                { isFullyFunded: true },
                { returnDocument: 'after' }
            );
        }

        res.status(200).json(forInvestor(token, req.user._id));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getTokens = async (req, res) => {
    try {
        const tokens = await Token.find()
            .populate('invoice', 'businessName dueDate status')
            .sort({ createdAt: -1 });
        res.status(200).json(tokens.map((token) => forInvestor(token, req.user._id)));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { investInToken, getTokens };
