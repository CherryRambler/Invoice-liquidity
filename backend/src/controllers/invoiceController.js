const Invoice = require('../models/Invoice');

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

const Token = require('../models/Token');

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

module.exports = { createInvoice, getInvoices, tokenizeInvoice };

