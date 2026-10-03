const express = require('express');
const router = express.Router();
const { investInToken, getTokens } = require('../controllers/investController');

router.get('/tokens', getTokens);
router.post('/tokens/:id/invest', investInToken);

module.exports = router;