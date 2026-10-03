const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices, tokenizeInvoice } = require('../controllers/invoiceController');

router.post('/', createInvoice);
router.get('/', getInvoices);
router.post('/:id/tokenize', tokenizeInvoice);

module.exports = router;