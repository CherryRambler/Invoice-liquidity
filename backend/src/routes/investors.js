const express = require('express');
const router = express.Router();
const { investInToken, getTokens } = require('../controllers/investController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/tokens', authenticate, requireRole('investor'), getTokens);
router.post('/tokens/:id/invest', authenticate, requireRole('investor'), investInToken);

module.exports = router;