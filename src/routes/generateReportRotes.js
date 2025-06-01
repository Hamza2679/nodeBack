const express = require("express");
const router = express.Router();
const generateReport = require('../controllers/gererateReportController');
const eventReport = require('../controllers/generateEventReportController');
const reportedUsersReport = require('../controllers/generateReportedUsersController');
const groupPostReport = require('../controllers/generateGroupPostReportController');
const adminReport = require('../controllers/generateAdminReportController');

// User reports
router.get('/admin/users/filtered', generateReport.getFilteredUsers);
router.get('/admin/users/report/:format', generateReport.generateUserReport);

// Event reports
router.get('/admin/events/report/:format', eventReport.generateEventReport);

// Reported users reports
router.get('/admin/reported-users/report/:format', reportedUsersReport.generateReportedUsersReport);

// Reported group posts reports
router.get('/admin/reported-group-posts/report/:format', groupPostReport.generateGroupPostReport);

// Admin reports
router.get('/admin/dashboard/report/:format', adminReport.generateDashboardReport);
router.get('/admin/users/list/report/:format', adminReport.generateUserListReport);

module.exports = router;