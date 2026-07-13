const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/dashboard', authenticate, requireAdmin, adminController.getDashboardStats);
router.get('/users', authenticate, requireAdmin, adminController.getUsers);
router.put('/users/:id/role', authenticate, requireAdmin, adminController.updateUserRole);
router.delete('/users/:id', authenticate, requireAdmin, adminController.deleteUser);
router.get('/quiz-stats', authenticate, requireAdmin, adminController.getQuizStats);
router.get('/user-reports', authenticate, requireAdmin, adminController.getUserReports);
router.delete('/notes/:id', authenticate, requireAdmin, adminController.deleteNote);

module.exports = router;
