const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: true,
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;