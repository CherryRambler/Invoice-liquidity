const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices, tokenizeInvoice, payoutInvoice, repayInvoice } = require('../controllers/invoiceController');

router.post('/', createInvoice);
router.get('/', getInvoices);
router.post('/:id/tokenize', tokenizeInvoice);
router.post('/:id/payout', payoutInvoice);
router.post('/:id/repay', repayInvoice);

module.exports = router;