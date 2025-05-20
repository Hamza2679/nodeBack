const EventService = require("../services/eventService");
const { uploadToS3 } = require("../services/uploadService");

exports.createEvent = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { name, type, datetime, description } = req.body;
        let coverPhotoUrl = null;
        const imageUrls = [];

        // Handle Cover Photo Upload
        if (req.files?.coverPhoto?.[0]) {
            const coverFile = req.files.coverPhoto[0];
            coverPhotoUrl = await uploadToS3(coverFile.buffer, coverFile.originalname, 'social-sync-for-final');
        }

        // Handle Event Images Upload
        if (req.files?.eventImages) {
            for (const file of req.files.eventImages) {
                const url = await uploadToS3(file.buffer, file.originalname, 'social-sync-for-final');
                imageUrls.push(url);
            }
        }

        // Validate required fields
        if (!name || !type || !datetime || !description) {
            return res.status(400).json({ error: "All required fields must be provided" });
        }

        const newEvent = await EventService.createEvent(
            userId,
            name,
            type,
            new Date(datetime),
            description,
            coverPhotoUrl,
            imageUrls
        );

        res.status(201).json({ message: "Event created successfully", event: newEvent });
    } catch (error) {
        console.error("Create Event Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getEvents = async (req, res) => {
    try {
        const events = await EventService.getAllEvents();
        res.status(200).json({ events });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await EventService.getEventById(req.params.id);
        if (!event) return res.status(404).json({ error: "Event not found" });
        res.status(200).json({ event });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.getEventsByType = async (req, res) => {
    try {
      const type = req.params.type;
      const events = await EventService.getEventsByType(type);
      
      if (!events || events.length === 0) {
        return res.status(404).json({ error: "No events found for this category" });
      }
      
      res.status(200).json({ events });
    } catch (error) {
      console.error("Get Events by Type Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

exports.deleteEvent = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const success = await EventService.deleteEvent(userId, req.params.id);
        if (!success) return res.status(404).json({ error: "Event not found or unauthorized" });
        
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Delete Event Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.updateEvent = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // 1) Grab old URLs from the client
    let existing = [];
    if (req.body.existingImages) {
      try {
        existing = JSON.parse(req.body.existingImages);
      } catch(_) {
        return res.status(400).json({ error: "Invalid existingImages JSON" });
      }
    }

    // 2) Build updates object
    const updates = {};
    ['name', 'type', 'datetime', 'description'].forEach(f => {
      if (req.body[f]) {
        updates[f] = f === 'datetime'
          ? new Date(req.body.datetime)
          : req.body[f];
      }
    });

    // 3) Cover photo
    if (req.files?.coverPhoto?.[0]) {
      const file = req.files.coverPhoto[0];
      updates.cover_photo_url = await uploadToS3(
        file.buffer, file.originalname, 'your-bucket-name'
      );
    }

    // 4) New gallery images
    let newImgs = [];
    if (req.files?.eventImages) {
      newImgs = await Promise.all(
        req.files.eventImages.map(f =>
          uploadToS3(f.buffer, f.originalname, 'your-bucket-name')
        )
      );
    }

    // 5) Merge old + new
    updates.image_urls = [...existing, ...newImgs];

    // 6) Persist
    const updatedEvent = await EventService.updateEvent(
      userId, req.params.id, updates
    );
    res.status(200).json({ message: "Event updated successfully", event: updatedEvent });

  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({ error: error.message });
  }
};
