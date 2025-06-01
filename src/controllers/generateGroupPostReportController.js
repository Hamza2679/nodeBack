const GroupPostReportService = require('../services/groupPostReportService');
const { 
  generateGroupPostExcelReport, 
  generateGroupPostPdfReport, 
  generateGroupPostDocxReport 
} = require('../utils/reportGenerators');

exports.generateGroupPostReport = async (req, res) => {
  // Admin check
//   if (!['admin', 'Admin'].includes(req.user.role)) {
//     return res.status(403).json({ error: 'Access denied' });
//   }

  console.log("Generating group post report with filters:", req.query);
  try {
    const { format } = req.params;
    console.log("Requested format:", format);

    // Extract filters from query
    const filters = {
      groupIds: req.query.groupIds,
      universityIds: req.query.universityIds,
      roles: req.query.roles,
      postStartDate: req.query.postStartDate,
      postEndDate: req.query.postEndDate,
      reportStartDate: req.query.reportStartDate,
      reportEndDate: req.query.reportEndDate,
      minReports: req.query.minReports,
      reason: req.query.reason,
      searchTerm: req.query.searchTerm
    };

    const reportedPosts = await GroupPostReportService.getReportedPostsForExport(filters);
    console.log("Number of reported posts fetched:", reportedPosts.length);

    let buffer, contentType, fileName;

    switch (format.toLowerCase()) {
      case 'pdf':
        buffer = await generateGroupPostPdfReport(reportedPosts);
        contentType = 'application/pdf';
        fileName = `reported-group-posts-${Date.now()}.pdf`;
        break;

      case 'xlsx':
        buffer = await generateGroupPostExcelReport(reportedPosts);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName = `reported-group-posts-${Date.now()}.xlsx`;
        break;

      case 'docx':
        buffer = await generateGroupPostDocxReport(reportedPosts);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileName = `reported-group-posts-${Date.now()}.docx`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid format specified' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error generating group post report:", error);
    res.status(500).json({ error: error.message });
  }
};