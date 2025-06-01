const ReportService = require('../services/reportService');
const { 
  generateReportedUsersExcelReport, 
  generateReportedUsersPdfReport, 
  generateReportedUsersDocxReport 
} = require('../utils/reportGenerators');

exports.generateReportedUsersReport = async (req, res) => {
  // Admin check
//   if (!['admin', 'Admin'].includes(req.user.role)) {
//     return res.status(403).json({ error: 'Access denied' });
//   }

  console.log("Generating reported users report with filters:", req.query);
  try {
    const { format } = req.params;
    console.log("Requested format:", format);

    // Extract filters from query
    const filters = {
      universityIds: req.query.universityIds,
      roles: req.query.roles,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      minReports: req.query.minReports,
      reason: req.query.reason
    };

    const reportedUsers = await ReportService.getReportedUsersForExport(filters);
    console.log("Number of reported users fetched:", reportedUsers.length);

    let buffer, contentType, fileName;

    switch (format.toLowerCase()) {
      case 'pdf':
        buffer = await generateReportedUsersPdfReport(reportedUsers);
        contentType = 'application/pdf';
        fileName = `reported-users-${Date.now()}.pdf`;
        break;

      case 'xlsx':
        buffer = await generateReportedUsersExcelReport(reportedUsers);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName = `reported-users-${Date.now()}.xlsx`;
        break;

      case 'docx':
        buffer = await generateReportedUsersDocxReport(reportedUsers);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileName = `reported-users-${Date.now()}.docx`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid format specified' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error generating reported users report:", error);
    res.status(500).json({ error: error.message });
  }
};