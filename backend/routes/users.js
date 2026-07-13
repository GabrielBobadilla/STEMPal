const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { uploadProfilePicture } = require('../middleware/upload');
const userController = require('../controllers/userController');

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.post('/profile/picture', authenticate, uploadProfilePicture(), userController.uploadProfilePicture);
router.put('/change-password', authenticate, userController.changePassword);
router.put('/theme', authenticate, userController.updateTheme);
router.put('/notifications', authenticate, userController.updateNotificationSettings);

module.exports = router;
