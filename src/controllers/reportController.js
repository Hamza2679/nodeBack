// controllers/reportController.js
const ReportService = require('../services/reportService');

/**
 * Report a user (optionally tied to a message)
 */
// controllers/reportController.js

// 1️⃣ reportUser: drop messageId destructuring
exports.reportUser = async (req, res) => {
  try {
    const reporterId = req.user.userId;
    const { reportedId, reason } = req.body;

    if (!reportedId || !reason) {
      return res.status(400).json({ error: 'reportedId and reason are required' });
    }

    const report = await ReportService.createReport(
      reporterId,
      reportedId,
      reason
    );
    res.status(201).json({ report });
  } catch (error) {
    console.error('Report User Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 2️⃣ getAllReportedUsers and getReportsForUser stay the same


/**
 * (Admin-only) Fetch all reports for a particular user
 */
exports.getReportsForUser = async (req, res) => {
  try {
    // Optionally check req.user.role === 'admin' here
    const reportedId = req.params.userId;
    const reports = await ReportService.getReportsForUser(reportedId);
    res.status(200).json({ reports });
  } catch (error) {
    console.error('Get Reports Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
// controllers/reportController.js
exports.getAllReportedUsers = async (req, res) => {
  try {
    if (!['Admin','admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const users = await ReportService.getAllReportedUsers();
    res.status(200).json({ users });
  } catch (error) {
    console.error('Fetch reported users error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { actionTaken } = req.body;

    if (!actionTaken) {
      return res.status(400).json({ error: 'actionTaken is required' });
    }

    const report = await ReportService.resolveReport(reportId, req.user.userId, actionTaken);
    res.status(200).json({ report });
  } catch (error) {
    console.error('Resolve Report Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}