const eventReportService = require('../services/generateEventReportService');
const { 
  generateEventPdfReport, 
  generateEventExcelReport, 
  generateEventDocxReport 
} = require('../utils/reportGenerators');

exports.generateEventReport = async (req, res) => {
  console.log("Generating event report with filters:", req.query);
  try {
    const { format } = req.params;
    console.log("Requested format:", format);

    // Extract filters from query
    const filters = {
      universityIds: req.query.universityIds,
      eventTypes: req.query.eventTypes,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      isOnline: req.query.isOnline,
      groupId: req.query.groupId,
      searchTerm: req.query.searchTerm
    };

    const events = await eventReportService.getFilteredEvents(filters);
    console.log("Number of events fetched:", events.length);

    let buffer, contentType, fileName;

    switch (format.toLowerCase()) {
      case 'pdf':
        buffer = await generateEventPdfReport(events);
        contentType = 'application/pdf';
        fileName = `events-report-${Date.now()}.pdf`;
        break;

      case 'xlsx':
        buffer = await generateEventExcelReport(events);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName = `events-report-${Date.now()}.xlsx`;
        break;

      case 'docx':
        buffer = await generateEventDocxReport(events);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileName = `events-report-${Date.now()}.docx`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid format specified' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error generating event report:", error);
    res.status(500).json({ error: error.message });
  }
};