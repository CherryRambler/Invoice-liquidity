const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    businessName: {
        type: String,
        required: true,
    },
    gstin: {
        type: String,
        uppercase: true,
        trim: true,
    },
    invoiceAmount: {
        type: Number,
        required: true,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'tokenized', 'funded', 'repaid'],
        default: 'pending',
    },
    verifiedAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;