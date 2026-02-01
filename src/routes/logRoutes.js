const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

router.post('/', logController.createLog);
router.get('/', logController.getLogs);

module.exports = router;
