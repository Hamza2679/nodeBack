const AdminService = require('../services/adminService');

exports.getDashboardStats = async (req, res) => {
  try {
    const [userStats, contentStats] = await Promise.all([
      AdminService.getUserStatistics(),
      AdminService.getContentStatistics()
    ]);
    res.json({ success: true, data: { userStats, contentStats } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const result = await AdminService.deleteUser(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: result
    });

  } catch (error) {
    console.error('Delete error:', error);

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to delete user',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const reports = await AdminService.getReports(parseInt(page), parseInt(limit));
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionTaken } = req.body;
    if (!actionTaken) return res.status(400).json({ success: false, message: "actionTaken is required" });

    const report = await AdminService.resolveReport(id, req.user.id, actionTaken);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const users = await AdminService.getUsers(parseInt(page), parseInt(limit), search);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be a boolean" });
    }
    const user = await AdminService.updateUserStatus(id, isActive);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, error: "Role is required" });
    }

    const updatedUser = await AdminService.updateUserRole(id, role);
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Role update error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No updates provided" });
    }
    const user = await AdminService.updateUserDetails(id, updates);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.softDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AdminService.softDeleteUser(id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.deletePostAsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: "Reason is required"
      });
    }

    const result = await AdminService.deletePostAsAdmin(id, req.user.id, reason);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      data: result
    });

  } catch (error) {
    console.error('Delete Post Error:', error);

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to delete post',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.sendPushNotification = async (req, res) => {
  try {
    const { title, message, userIds, segments } = req.body;

    const response = await AdminService.sendPushNotification({
      title,
      message,
      userIds: userIds || [],
      segments: segments || []
    });

    res.status(response.statusCode).json({
      success: true,
      message: 'Notification sent successfully',
      data: response.body
    });

  } catch (error) {
    console.error('Push Notification Error:', error);

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to send notification',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Add actual password reset logic
    res.status(200).json({
      success: true,
      message: 'Password reset initiated'
    });

  } catch (error) {
    console.error('Password Reset Error:', error);

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to initiate password reset',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};