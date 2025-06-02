const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');

module.exports = {
  generateExcelReport: async (users) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');
    
    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'University ID', key: 'universityId', width: 20 },
      { header: 'Signup Date', key: 'createdAt', width: 20 }
    ];

    // Add data
    users.forEach(user => {
      worksheet.addRow({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        universityId: user.universityId,
        createdAt: user.createdAt.toISOString().split('T')[0]
      });
    });

    // Generate buffer
    return workbook.xlsx.writeBuffer();
  },

  generatePdfReport: (users) => {
    console.log("Generating PDF report for", users.length, "users");
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.fontSize(16).text('User Report', { align: 'center' });
      doc.moveDown();

      users.forEach(user => {
        doc.fontSize(12)
          .text(`Name: ${user.firstName} ${user.lastName}`)
          .text(`Email: ${user.email}`)
          .text(`University ID: ${user.universityId}`)
          .text(`Role: ${user.role}`)
          .text(`Signed Up: ${user.createdAt.toLocaleDateString()}`)
          .moveDown();
      });

      doc.end();
    });
  },

  generateDocxReport: async (users) => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "User Report",
                bold: true,
                size: 24,
              })
            ],
            alignment: "center"
          }),
          ...users.flatMap(user => [
            new Paragraph({
              text: `Name: ${user.firstName} ${user.lastName}`,
            }),
            new Paragraph({
              text: `Email: ${user.email}`,
            }),
            new Paragraph({
              text: `University ID: ${user.universityId}`,
            }),
            new Paragraph({
              text: `Role: ${user.role}`,
            }),
            new Paragraph({
              text: `Signed Up: ${user.createdAt.toLocaleDateString()}`,
            }),
            new Paragraph({
              text: "-".repeat(50),
            })
          ])
        ]
      }]
    });

    return Packer.toBuffer(doc);
  },

  


// Add these new functions to your existing reportGenerators module

generateEventExcelReport: async (events) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Events');
  
  // Add headers
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Event Name', key: 'name', width: 30 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Date & Time', key: 'datetime', width: 20 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Online', key: 'isOnline', width: 10 },
    { header: 'Organizer', key: 'organizer', width: 30 },
    { header: 'Organizer University', key: 'universityId', width: 20 },
    { header: 'Group ID', key: 'groupId', width: 15 }
  ];

  // Add data
  events.forEach(event => {
    worksheet.addRow({
      id: event.id,
      name: event.name,
      type: event.type,
      datetime: event.datetime.toISOString(),
      description: event.description,
      isOnline: event.isOnline ? 'Yes' : 'No',
      organizer: `${event.organizerFirstName} ${event.organizerLastName}`,
      universityId: event.organizerUniversityId,
      groupId: event.groupId || 'N/A'
    });
  });

  // Generate buffer
  return workbook.xlsx.writeBuffer();
},

generateEventPdfReport: (events) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    doc.fontSize(16).text('Event Report', { align: 'center' });
    doc.moveDown();

    events.forEach(event => {
      doc.fontSize(12)
        .text(`Event: ${event.name} (${event.type})`)
        .text(`Date: ${event.datetime.toLocaleString()}`)
        .text(`Organizer: ${event.organizerFirstName} ${event.organizerLastName}`)
        .text(`University: ${event.organizerUniversityId}`)
        .text(`Online: ${event.isOnline ? 'Yes' : 'No'}`)
        .text(`Group: ${event.groupId || 'N/A'}`)
        .moveDown()
        .text(`Description: ${event.description}`)
        .moveDown()
        .text('-'.repeat(50))
        .moveDown();
    });

    doc.end();
  });
},

generateEventDocxReport: async (events) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "Event Report",
              bold: true,
              size: 24,
            })
          ],
          alignment: "center"
        }),
        ...events.flatMap(event => [
          new Paragraph({
            text: `Event: ${event.name} (${event.type})`,
            heading: "Heading2",
          }),
          new Paragraph({
            text: `Date: ${event.datetime.toLocaleString()}`,
          }),
          new Paragraph({
            text: `Organizer: ${event.organizerFirstName} ${event.organizerLastName}`,
          }),
          new Paragraph({
            text: `University: ${event.organizerUniversityId}`,
          }),
          new Paragraph({
            text: `Online: ${event.isOnline ? 'Yes' : 'No'}`,
          }),
          new Paragraph({
            text: `Group: ${event.groupId || 'N/A'}`,
          }),
          new Paragraph({
            text: `Description: ${event.description}`,
          }),
          new Paragraph({
            text: "",
          }),
          new Paragraph({
            text: "-".repeat(50),
          }),
          new Paragraph({
            text: "",
          })
        ])
      ]
    }]
  });

  return Packer.toBuffer(doc);
},

// Add these new functions to your existing reportGenerators module

generateReportedUsersExcelReport: async (reportedUsers) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reported Users');
  
  // Add headers
  worksheet.columns = [
    { header: 'User ID', key: 'userId', width: 10 },
    { header: 'First Name', key: 'firstName', width: 20 },
    { header: 'Last Name', key: 'lastName', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Role', key: 'role', width: 15 },
    { header: 'University ID', key: 'universityId', width: 20 },
    { header: 'Report Count', key: 'reportCount', width: 15 },
    { header: 'First Reported', key: 'firstReportedAt', width: 20 },
    { header: 'Last Reported', key: 'lastReportedAt', width: 20 },
    { header: 'Reasons', key: 'reasons', width: 50 }
  ];

  // Add data
  reportedUsers.forEach(user => {
    worksheet.addRow({
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      universityId: user.universityId,
      reportCount: user.reportCount,
      firstReportedAt: user.firstReportedAt.toISOString().split('T')[0],
      lastReportedAt: user.lastReportedAt.toISOString().split('T')[0],
      reasons: user.reasons.join(', ')
    });
  });

  // Generate buffer
  return workbook.xlsx.writeBuffer();
},

generateReportedUsersPdfReport: (reportedUsers) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    doc.fontSize(16).text('Reported Users Summary', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`);
    doc.text(`Total Reported Users: ${reportedUsers.length}`);
    doc.moveDown();

    reportedUsers.forEach(user => {
      doc.fontSize(12)
        .text(`User: ${user.firstName} ${user.lastName} (ID: ${user.userId})`)
        .text(`Email: ${user.email} | Role: ${user.role} | University: ${user.universityId}`)
        .text(`Reports: ${user.reportCount} | First: ${user.firstReportedAt.toLocaleDateString()} | Last: ${user.lastReportedAt.toLocaleDateString()}`)
        .text(`Reasons: ${user.reasons.join(', ')}`)
        .moveDown()
        .text('-'.repeat(50))
        .moveDown();
    });

    doc.end();
  });
},

generateReportedUsersDocxReport: async (reportedUsers) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "Reported Users Summary",
              bold: true,
              size: 24,
            })
          ],
          alignment: "center"
        }),
        new Paragraph({
          text: `Generated on: ${new Date().toLocaleDateString()}`,
        }),
        new Paragraph({
          text: `Total Reported Users: ${reportedUsers.length}`,
        }),
        ...reportedUsers.flatMap(user => [
          new Paragraph({
            text: `User: ${user.firstName} ${user.lastName} (ID: ${user.userId})`,
            heading: "Heading2",
          }),
          new Paragraph({
            text: `Email: ${user.email}`,
          }),
          new Paragraph({
            text: `Role: ${user.role} | University ID: ${user.universityId}`,
          }),
          new Paragraph({
            text: `Total Reports: ${user.reportCount}`,
          }),
          new Paragraph({
            text: `First Reported: ${user.firstReportedAt.toLocaleDateString()} | Last Reported: ${user.lastReportedAt.toLocaleDateString()}`,
          }),
          new Paragraph({
            text: `Reasons: ${user.reasons.join(', ')}`,
          }),
          new Paragraph({
            text: "",
          }),
          new Paragraph({
            text: "-".repeat(50),
          }),
          new Paragraph({
            text: "",
          })
        ])
      ]
    }]
  });

  return Packer.toBuffer(doc);
},

generateGroupPostExcelReport: async (reportedPosts) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reported Group Posts');
  
  // Add headers
  worksheet.columns = [
    { header: 'Post ID', key: 'postId', width: 10 },
    { header: 'Post Text', key: 'postText', width: 40 },
    { header: 'Created At', key: 'postCreatedAt', width: 20 },
    { header: 'Group', key: 'groupName', width: 25 },
    { header: 'Author', key: 'authorName', width: 25 },
    { header: 'Author Email', key: 'authorEmail', width: 30 },
    { header: 'University ID', key: 'universityId', width: 20 },
    { header: 'Report Count', key: 'reportCount', width: 15 },
    { header: 'First Reported', key: 'firstReportedAt', width: 20 },
    { header: 'Last Reported', key: 'lastReportedAt', width: 20 },
    { header: 'Reasons', key: 'reasons', width: 50 }
  ];

  // Add data
  reportedPosts.forEach(post => {
    worksheet.addRow({
      postId: post.postId,
      postText: post.postText,
      postCreatedAt: post.postCreatedAt.toISOString().split('T')[0],
      groupName: post.groupName,
      authorName: `${post.author.firstName} ${post.author.lastName}`,
      authorEmail: post.author.email,
      universityId: post.author.universityId,
      reportCount: post.reportCount,
      firstReportedAt: post.firstReportedAt.toISOString().split('T')[0],
      lastReportedAt: post.lastReportedAt.toISOString().split('T')[0],
      reasons: post.reasons.join(', ')
    });
  });

  // Generate buffer
  return workbook.xlsx.writeBuffer();
},

generateGroupPostPdfReport: (reportedPosts) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    doc.fontSize(16).text('Reported Group Posts Summary', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`);
    doc.text(`Total Reported Posts: ${reportedPosts.length}`);
    doc.moveDown();

    reportedPosts.forEach(post => {
      doc.fontSize(12)
        .text(`Post ID: ${post.postId} (Group: ${post.groupName})`)
        .text(`Created: ${post.postCreatedAt.toLocaleDateString()}`)
        .text(`Author: ${post.author.firstName} ${post.author.lastName} (${post.author.email})`)
        .text(`University: ${post.author.universityId}`)
        .text(`Reports: ${post.reportCount} | First: ${post.firstReportedAt.toLocaleDateString()} | Last: ${post.lastReportedAt.toLocaleDateString()}`)
        .moveDown()
        .text(`Post Content: ${post.postText}`)
        .moveDown()
        .text(`Reasons: ${post.reasons.join(', ')}`)
        .moveDown()
        .text('-'.repeat(50))
        .moveDown();
    });

    doc.end();
  });
},

generateGroupPostDocxReport: async (reportedPosts) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "Reported Group Posts Summary",
              bold: true,
              size: 24,
            })
          ],
          alignment: "center"
        }),
        new Paragraph({
          text: `Generated on: ${new Date().toLocaleDateString()}`,
        }),
        new Paragraph({
          text: `Total Reported Posts: ${reportedPosts.length}`,
        }),
        ...reportedPosts.flatMap(post => [
          new Paragraph({
            text: `Post ID: ${post.postId} (Group: ${post.groupName})`,
            heading: "Heading2",
          }),
          new Paragraph({
            text: `Created: ${post.postCreatedAt.toLocaleDateString()}`,
          }),
          new Paragraph({
            text: `Author: ${post.author.firstName} ${post.author.lastName} (${post.author.email})`,
          }),
          new Paragraph({
            text: `University: ${post.author.universityId}`,
          }),
          new Paragraph({
            text: `Total Reports: ${post.reportCount}`,
          }),
          new Paragraph({
            text: `First Reported: ${post.firstReportedAt.toLocaleDateString()} | Last Reported: ${post.lastReportedAt.toLocaleDateString()}`,
          }),
          new Paragraph({
            text: "Post Content:",
          }),
          new Paragraph({
            text: post.postText,
          }),
          new Paragraph({
            text: `Reasons: ${post.reasons.join(', ')}`,
          }),
          new Paragraph({
            text: "",
          }),
          new Paragraph({
            text: "-".repeat(50),
          }),
          new Paragraph({
            text: "",
          })
        ])
      ]
    }]
  });

  return Packer.toBuffer(doc);
},

// Add these new functions to your existing reportGenerators module

generateDashboardExcelReport: async (dashboardData) => {
  const workbook = new ExcelJS.Workbook();
  
  // User Stats Sheet
  const userSheet = workbook.addWorksheet('User Statistics');
  userSheet.columns = [
    { header: 'Metric', key: 'metric', width: 20 },
    { header: 'Value', key: 'value', width: 15 }
  ];
  userSheet.addRows([
    { metric: 'Total Users', value: dashboardData.userStats.totalUsers },
    { metric: 'Active Users', value: dashboardData.userStats.activeUsers },
    { metric: 'New Users (30 days)', value: dashboardData.userStats.newUsers }
  ]);

  // Content Stats Sheet
  const contentSheet = workbook.addWorksheet('Content Statistics');
  contentSheet.columns = [
    { header: 'Metric', key: 'metric', width: 20 },
    { header: 'Value', key: 'value', width: 15 }
  ];
  contentSheet.addRows([
    { metric: 'Total Posts', value: dashboardData.contentStats.totalPosts },
    { metric: 'Total Groups', value: dashboardData.contentStats.totalGroups },
    { metric: 'Total Events', value: dashboardData.contentStats.totalEvents },
    { metric: 'Pending Reports', value: dashboardData.contentStats.pendingReports }
  ]);

  // Generate buffer
  return workbook.xlsx.writeBuffer();
},

generateDashboardPdfReport: (dashboardData) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    doc.fontSize(16).text('Admin Dashboard Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text('User Statistics:', { underline: true });
    doc.text(`Total Users: ${dashboardData.userStats.totalUsers}`);
    doc.text(`Active Users: ${dashboardData.userStats.activeUsers}`);
    doc.text(`New Users (30 days): ${dashboardData.userStats.newUsers}`);
    doc.moveDown();

    doc.fontSize(12).text('Content Statistics:', { underline: true });
    doc.text(`Total Posts: ${dashboardData.contentStats.totalPosts}`);
    doc.text(`Total Groups: ${dashboardData.contentStats.totalGroups}`);
    doc.text(`Total Events: ${dashboardData.contentStats.totalEvents}`);
    doc.text(`Pending Reports: ${dashboardData.contentStats.pendingReports}`);
    doc.moveDown();

    doc.fontSize(10).text(`Report generated on: ${new Date().toLocaleString()}`);

    doc.end();
  });
},

generateUserListExcelReport: async (users) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Users');
  
  // Add headers
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'First Name', key: 'firstName', width: 20 },
    { header: 'Last Name', key: 'lastName', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Role', key: 'role', width: 15 },
    { header: 'University ID', key: 'universityId', width: 20 },
    { header: 'Join Date', key: 'createdAt', width: 20 },
    { header: 'Last Login', key: 'lastLogin', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Posts', key: 'postCount', width: 10 },
    { header: 'Groups', key: 'groupCount', width: 10 },
    { header: 'Events', key: 'eventCount', width: 10 }
  ];

  // Add data
  users.forEach(user => {
    worksheet.addRow({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      universityId: user.universityid,
      createdAt: user.created_at.toISOString().split('T')[0],
      lastLogin: user.last_login ? user.last_login.toISOString().split('T')[0] : 'Never',
      status: user.is_active ? 'Active' : 'Inactive',
      postCount: user.post_count,
      groupCount: user.group_count,
      eventCount: user.event_count
    });
  });

  // Generate buffer
  return workbook.xlsx.writeBuffer();
}
}