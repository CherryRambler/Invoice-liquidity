const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
        required: true,
    },
    totalValue: {
        type: Number,
        required: true,
    },
    amountFunded: {
        type: Number,
        default: 0,
    },
    isFullyFunded: {
        type: Boolean,
        default: false,
    },
    investments: [
        {
            investor: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Investor',
            },
            amount: Number,
            investedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;