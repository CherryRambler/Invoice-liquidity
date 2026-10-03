const Invoice = require('../models/Invoice');
const Token = require('../models/Token');
const { sendUpiPayment } = require('../services/upiService');

const createInvoice = async (req, res) => {
    try {
        const { businessName, invoiceAmount, dueDate } = req.body;

        const invoice = await Invoice.create({
            businessName,
            invoiceAmount,
            dueDate,
        });

        res.status(201).json(invoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find();
        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const tokenizeInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (invoice.status !== 'pending') {
            return res.status(400).json({ message: 'Invoice is not in pending status' });
        }

        const token = await Token.create({
            invoice: invoice._id,
            totalValue: invoice.invoiceAmount,
        });

        invoice.status = 'tokenized';
        await invoice.save();

        res.status(201).json(token);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const payoutInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (invoice.status !== 'tokenized') {
            return res.status(400).json({ message: 'Invoice must be tokenized before payout' });
        }

        const token = await Token.findOne({ invoice: invoice._id });

        if (!token || !token.isFullyFunded) {
            return res.status(400).json({ message: 'Token must be fully funded before payout' });
        }

        const payment = await sendUpiPayment(invoice.businessName, token.amountFunded);

        invoice.status = 'funded';
        await invoice.save();

        res.status(200).json({ invoice, payment });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const repayInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (invoice.status !== 'funded') {
            return res.status(400).json({ message: 'Invoice must be funded before repayment' });
        }

        const token = await Token.findOne({ invoice: invoice._id }).populate('investments.investor');

        const payouts = [];

        for (const investment of token.investments) {
            const payment = await sendUpiPayment(investment.investor.name, investment.amount);
            payouts.push({
                investorName: investment.investor.name,
                amount: investment.amount,
                transactionId: payment.transactionId,
            });
        }

        invoice.status = 'repaid';
        await invoice.save();

        res.status(200).json({ invoice, payouts });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { createInvoice, getInvoices, tokenizeInvoice, payoutInvoice, repayInvoice };