const AdminService = require('../services/adminService');
const { 
  generateDashboardExcelReport,
  generateDashboardPdfReport,
  generateUserListExcelReport
} = require('../utils/reportGenerators');

exports.generateDashboardReport = async (req, res) => {
  // Admin check
//   if (!['admin', 'Admin'].includes(req.user.role)) {
//     return res.status(403).json({ error: 'Access denied' });
//   }

  try {
    const { format } = req.params;
    console.log("Requested format:", format);

    // Extract filters from query
    const filters = {
      universityIds: req.query.universityIds,
      roles: req.query.roles,
      userStartDate: req.query.userStartDate,
      userEndDate: req.query.userEndDate,
      contentStartDate: req.query.contentStartDate,
      contentEndDate: req.query.contentEndDate
    };

    const dashboardData = await AdminService.getDashboardReportData(filters);

    let buffer, contentType, fileName;

    switch (format.toLowerCase()) {
      case 'pdf':
        buffer = await generateDashboardPdfReport(dashboardData);
        contentType = 'application/pdf';
        fileName = `dashboard-report-${Date.now()}.pdf`;
        break;

      case 'xlsx':
        buffer = await generateDashboardExcelReport(dashboardData);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName = `dashboard-report-${Date.now()}.xlsx`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid format specified' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error generating dashboard report:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.generateUserListReport = async (req, res) => {
  // Admin check
//   if (!['admin', 'Admin'].includes(req.user.role)) {
//     return res.status(403).json({ error: 'Access denied' });
//   }

  try {
    const { format } = req.params;
    console.log("Requested format:", format);

    // Extract filters from query
    const filters = {
      universityIds: req.query.universityIds,
      roles: req.query.roles,
      isActive: req.query.isActive,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      searchTerm: req.query.searchTerm
    };

    const users = await AdminService.getDetailedUserReport(filters);

    let buffer, contentType, fileName;

    if (format.toLowerCase() === 'xlsx') {
      buffer = await generateUserListExcelReport(users);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileName = `user-list-${Date.now()}.xlsx`;
    } else {
      return res.status(400).json({ error: 'Invalid format specified' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error generating user list report:", error);
    res.status(500).json({ error: error.message });
  }
};