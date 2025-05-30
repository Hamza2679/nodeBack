// controllers/groupPostReportController.js
const GroupPostReportService = require('../services/groupPostReportService');

exports.reportGroupPost = async (req, res) => {
  try {
    const reporterId = req.user.userId;
    const { postId, reason } = req.body;
    if (!postId || !reason) {
      return res.status(400).json({ error: 'postId and reason are required' });
    }
    const report = await GroupPostReportService.create(reporterId, postId, reason);
    res.status(201).json({ report });
  } catch (err) {
    console.error('Report Group Post Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getReportsForGroupPost = async (req, res) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    const reports = await GroupPostReportService.listForPost(postId);
    res.status(200).json({ reports });
  } catch (err) {
    console.error('Get Group Post Reports Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getAllReportedGroupPosts = async (req, res) => {
  try {
    if (req.user.role !== 'Admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const list = await GroupPostReportService.listAll();
    res.status(200).json({ reportedPosts: list });
  } catch (err) {
    console.error('Get All Reported Group Posts Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteGroupPostReport = async (req, res) => {
  try {
    if (req.user.role !== 'Admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const reportId = parseInt(req.params.reportId, 10);
    await GroupPostReportService.deleteReport(reportId);
    res.status(200).json({ message: 'Report deleted' });
  } catch (err) {
    console.error('Delete Group Post Report Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
/**
 * Admin-only: delete a reported group post and all its reports.
 */
exports.deleteGroupPostAndReports = async (req, res) => {
  try {
    if (req.user.role !== 'Admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const postId = parseInt(req.params.postId, 10);
    const success = await GroupPostReportService.deletePostAndReports(postId);

    if (!success) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(200).json({ message: 'Post and its reports deleted' });
  } catch (err) {
    console.error('Delete post+reports Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

