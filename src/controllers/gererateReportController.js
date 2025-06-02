const reportService = require('../services/generateReportService');
// Also ensure these report generators are imported:
const { generatePdfReport, generateExcelReport, generateDocxReport } = require('../utils/reportGenerators'); // or wherever they are defined

exports.generateUserReport = async (req, res) => {
  console.log("Generating user report with filters:", req.query);
  try {
    const { format } = req.params;
    console.log("Requested format:", format);

    // Use the service method instead of trying to call the controller
    const filters = {
      universityIds: req.query.universityIds,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      roles: req.query.roles,
      email: req.query.email,
      name: req.query.name
    };

    const users = await reportService.getFilteredUsers(filters);
    console.log("Number of users fetched:", users.length);

    let buffer, contentType, fileName;

    switch (format.toLowerCase()) {
      case 'pdf':
        buffer = await generatePdfReport(users);
        console.log("PDF report generated");
        contentType = 'application/pdf';
        fileName = `users-report-${Date.now()}.pdf`;
        break;

      case 'xlsx':
        buffer = await generateExcelReport(users);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName = `users-report-${Date.now()}.xlsx`;
        break;

      case 'docx':
        buffer = await generateDocxReport(users);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileName = `users-report-${Date.now()}.docx`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid format specified' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: error.message });
  }
};
// authController.js
exports.getFilteredUsers = async (req, res) => {
  try {
    const filters = {
      universityIds: req.query.universityIds,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      roles: req.query.roles,
      email: req.query.email,
      name: req.query.name
    };

    const users = await reportService.getFilteredUsers(filters);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};