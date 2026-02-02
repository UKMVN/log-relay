const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.post('/editLogIdCustom', userController.editLogIdCustom);
router.get('/me', userController.getMe);
router.post('/updateSettings', userController.updateSettings);

module.exports = router;
