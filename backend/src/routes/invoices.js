const express = require('express');
const router = express.Router();
const {
    createInvoice,
    getInvoices,
    verifyInvoice,
    tokenizeInvoice,
    payoutInvoice,
    repayInvoice,
} = require('../controllers/invoiceController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('business'));

router.post('/', createInvoice);
router.get('/', getInvoices);
router.post('/:id/verify', verifyInvoice);
router.post('/:id/tokenize', tokenizeInvoice);
router.post('/:id/payout', payoutInvoice);
router.post('/:id/repay', repayInvoice);

module.exports = router;