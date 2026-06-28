const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/dashboard', authenticate, authorizeAdmin, adminController.getDashboardStats);
router.get('/users', authenticate, authorizeAdmin, adminController.getUsers);
router.put('/users/:id/role', authenticate, authorizeAdmin, adminController.updateUserRole);
router.delete('/users/:id', authenticate, authorizeAdmin, adminController.deleteUser);
router.get('/quiz-stats', authenticate, authorizeAdmin, adminController.getQuizStats);
router.get('/user-reports', authenticate, authorizeAdmin, adminController.getUserReports);
router.delete('/notes/:id', authenticate, authorizeAdmin, adminController.deleteNote);

module.exports = router;
