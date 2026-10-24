const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Token = require('../models/Token');
const { sendUpiPayment } = require('../services/upiService');

const DISCOUNT_RATE = 0.05;
const GSTIN_REGEX = /^(0[1-9]|[12][0-9]|3[0-8])[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

// Finds the invoice and confirms the logged-in business owns it.
// If something is wrong it sends the error response itself and returns null.
const loadOwnedInvoice = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(404).json({ message: 'Invoice not found' });
        return null;
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
        res.status(404).json({ message: 'Invoice not found' });
        return null;
    }

    // Invoices created before accounts existed have no owner.
    if (!invoice.owner || !invoice.owner.equals(req.user._id)) {
        res.status(403).json({ message: 'You do not own this invoice' });
        return null;
    }

    return invoice;
};

// Moves the invoice from one status to the next in a single atomic update, so two
// simultaneous requests (e.g. a double-click) can't both run the side effects.
// Returns the updated invoice, or null if the status had already changed.
const advanceStatus = (invoice, from, to, extra = {}) =>
    Invoice.findOneAndUpdate(
        { _id: invoice._id, status: from },
        { status: to, ...extra },
        { returnDocument: 'after' }
    );

const alreadyChanged = (res) =>
    res.status(409).json({ message: 'Invoice status changed by another request. Please refresh' });

const createInvoice = async (req, res) => {
    try {
        const { gstin, invoiceAmount, dueDate } = req.body;

        // Below ₹1 the discounted funding target rounds to ₹0, and a token nobody can invest in never funds.
        const amount = typeof invoiceAmount === 'number' || typeof invoiceAmount === 'string'
            ? Number(invoiceAmount)
            : NaN;
        if (!Number.isFinite(amount) || amount < 1) {
            return res.status(400).json({ message: 'Invoice amount must be at least ₹1' });
        }

        if (gstin !== undefined && typeof gstin !== 'string') {
            return res.status(400).json({ message: 'GSTIN must be text' });
        }

        if (!dueDate || Number.isNaN(new Date(dueDate).getTime())) {
            return res.status(400).json({ message: 'A valid due date is required' });
        }

        const invoice = await Invoice.create({
            owner: req.user._id,
            businessName: req.user.name,
            gstin,
            invoiceAmount: amount,
            dueDate,
        });

        res.status(201).json(invoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ owner: req.user._id }).sort({ createdAt: -1 });

        // Attach funding progress so the business can see when "Receive funds" will work.
        const tokens = await Token.find({ invoice: { $in: invoices.map((invoice) => invoice._id) } })
            .select('invoice amountFunded totalValue isFullyFunded');
        const fundingByInvoice = new Map(tokens.map((token) => [token.invoice.toString(), {
            amountFunded: token.amountFunded,
            totalValue: token.totalValue,
            isFullyFunded: token.isFullyFunded,
        }]));

        res.status(200).json(invoices.map((invoice) => ({
            ...invoice.toObject(),
            funding: fundingByInvoice.get(invoice._id.toString()) ?? null,
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const verifyInvoice = async (req, res) => {
    try {
        const invoice = await loadOwnedInvoice(req, res);
        if (!invoice) return;

        if (invoice.status !== 'pending') {
            return res.status(400).json({ message: 'Invoice is not in pending status' });
        }

        const problems = [];

        if (!invoice.gstin) {
            problems.push('GSTIN is missing');
        } else if (!GSTIN_REGEX.test(invoice.gstin)) {
            problems.push('GSTIN format is invalid');
        }

        if (invoice.dueDate <= new Date()) {
            problems.push('Due date must be in the future');
        }

        if (problems.length > 0) {
            return res.status(400).json({ message: problems.join('. ') });
        }

        const verified = await advanceStatus(invoice, 'pending', 'verified', { verifiedAt: new Date() });
        if (!verified) return alreadyChanged(res);

        res.status(200).json(verified);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const tokenizeInvoice = async (req, res) => {
    try {
        const invoice = await loadOwnedInvoice(req, res);
        if (!invoice) return;

        if (invoice.status !== 'verified') {
            return res.status(400).json({ message: 'Invoice must be verified before tokenizing' });
        }

        if (!(await advanceStatus(invoice, 'verified', 'tokenized'))) return alreadyChanged(res);

        const fundingTarget = Math.round(invoice.invoiceAmount * (1 - DISCOUNT_RATE));

        try {
            const token = await Token.create({
                invoice: invoice._id,
                totalValue: fundingTarget,
                faceValue: invoice.invoiceAmount,
                discountRate: DISCOUNT_RATE,
            });
            res.status(201).json(token);
        } catch (error) {
            await advanceStatus(invoice, 'tokenized', 'verified');
            throw error;
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const payoutInvoice = async (req, res) => {
    try {
        const invoice = await loadOwnedInvoice(req, res);
        if (!invoice) return;

        if (invoice.status !== 'tokenized') {
            return res.status(400).json({ message: 'Invoice must be tokenized before payout' });
        }

        const token = await Token.findOne({ invoice: invoice._id });

        if (!token || !token.isFullyFunded) {
            return res.status(400).json({ message: 'Token must be fully funded before payout' });
        }

        const funded = await advanceStatus(invoice, 'tokenized', 'funded');
        if (!funded) return alreadyChanged(res);

        try {
            const payment = await sendUpiPayment(invoice.businessName, token.amountFunded);
            res.status(200).json({ invoice: funded, payment });
        } catch (error) {
            await advanceStatus(invoice, 'funded', 'tokenized');
            throw error;
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const repayInvoice = async (req, res) => {
    try {
        const invoice = await loadOwnedInvoice(req, res);
        if (!invoice) return;

        if (invoice.status !== 'funded') {
            return res.status(400).json({ message: 'Invoice must be funded before repayment' });
        }

        const token = await Token.findOne({ invoice: invoice._id }).populate('investments.investor', 'name');

        if (!token) {
            return res.status(500).json({ message: 'No token found for this invoice' });
        }

        // Claim the status before paying anyone, so a repeated request can't pay investors twice.
        const repaid = await advanceStatus(invoice, 'funded', 'repaid');
        if (!repaid) return alreadyChanged(res);

        const faceValue = token.faceValue ?? token.totalValue;
        const payouts = [];

        for (const investment of token.investments) {
            // The investor is null if their account was deleted; they are still owed the money.
            const investorName = investment.investor?.name ?? 'Deleted investor';
            const owed = Math.round((investment.amount * faceValue / token.totalValue) * 100) / 100;
            const payment = await sendUpiPayment(investorName, owed);

            payouts.push({
                investorName,
                invested: investment.amount,
                received: owed,
                profit: Math.round((owed - investment.amount) * 100) / 100,
                transactionId: payment.transactionId,
            });
        }

        res.status(200).json({ invoice: repaid, payouts });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createInvoice,
    getInvoices,
    verifyInvoice,
    tokenizeInvoice,
    payoutInvoice,
    repayInvoice,
};