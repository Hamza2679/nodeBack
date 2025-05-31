const EventService = require("../services/eventService");
const CommentService = require("../services/commentService");
const { uploadToS3 } = require("../services/uploadService");
require("dotenv").config();

exports.createEvent = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Destructure raw values (all coming in as strings or undefined)
    let {
      name,
      type,
      datetime,
      description,
      isOnline: rawIsOnline,
      onlineLink,
      onlineLinkVisible: rawOnlineLinkVisible,
      groupId
    } = req.body;

    // Coerce string -> boolean
    const isOnline = (rawIsOnline === true || rawIsOnline === 'true');
    const onlineLinkVisible = (rawOnlineLinkVisible === true || rawOnlineLinkVisible === 'true');

    // Defaults
    // (onlineLink stays null/undefined if not provided)
    if (!onlineLink) {
      onlineLink = null;
    }

    // Validate required fields
    if (!name || !type || !datetime || !description) {
      return res.status(400).json({ error: "All required fields must be provided" });
    }

    // Validate online event
    if (isOnline && !onlineLink) {
      return res.status(400).json({ error: "Online link is required for online events" });
    }

    // --- file uploads unchanged ---
    let coverPhotoUrl = null;
    const imageUrls = [];

    if (req.files?.coverPhoto?.[0]) {
      const coverFile = req.files.coverPhoto[0];
      coverPhotoUrl = await uploadToS3(
        coverFile.buffer,
        coverFile.originalname,
        'social-sync-for-final'
      );
    }

    if (req.files?.eventImages) {
      for (const file of req.files.eventImages) {
        const url = await uploadToS3(
          file.buffer,
          file.originalname,
          'social-sync-for-final'
        );
        imageUrls.push(url);
      }
    }

    // Call the service with real booleans
    const newEvent = await EventService.createEvent(
      userId,
      name,
      type,
      new Date(datetime),
      description,
      coverPhotoUrl,
      imageUrls,
      isOnline,
      onlineLink,
      onlineLinkVisible,
      groupId || null
    );

    return res
      .status(201)
      .json({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    console.error("Create Event Error:", error);
    return res.status(500).json({ error: error.message });
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

exports.getEventsByGroup = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const events = await EventService.getEventsByGroup(groupId);
        res.status(200).json({ events });
    } catch (error) {
        console.error("Get Events by Group Error:", error);
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

        // Parse existing image URLs
        let existing = [];
        if (req.body.existingImages) {
            try {
                existing = JSON.parse(req.body.existingImages);
            } catch {
                return res.status(400).json({ error: "Invalid existingImages JSON" });
            }
        }

        // Build updates payload
        const updates = {};
        ["name", "type", "datetime", "description", "isOnline", "onlineLink", "onlineLinkVisible"].forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = field === "datetime" ? new Date(req.body.datetime) : req.body[field];
            }
        });

        // Handle coverPhoto upload
        if (req.files?.coverPhoto?.[0]) {
            const file = req.files.coverPhoto[0];
            updates.cover_photo_url = await uploadToS3(
                file.buffer,
                file.originalname,
                'social-sync-for-final'
            );
        }

        // Handle eventImages upload
        let newImgs = [];
        if (req.files?.eventImages) {
            newImgs = await Promise.all(
                req.files.eventImages.map((file) => 
                    uploadToS3(file.buffer, file.originalname, 'social-sync-for-final')
                )
            );
        }

        // Merge old + new images
        updates.image_urls = [...existing, ...newImgs];

        // Persist and respond
        const updatedEvent = await EventService.updateEvent(
            userId,
            req.params.id,
            updates
        );

        res.status(200).json({
            message: "Event updated successfully",
            event: updatedEvent,
        });
    } catch (error) {
        console.error("Update Event Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getOnlineLink = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const event = await EventService.getEventById(req.params.id);
        if (!event) return res.status(404).json({ error: "Event not found" });

        // Check if user is creator or admin
        if (event.userId === userId) {
            return res.status(200).json({ 
                onlineLink: event.onlineLink,
                isCreator: true
            });
        }

        // For non-creators, check if they're attending and link is visible
        const isAttending = await EventService.isUserAttending(userId, req.params.id);
        if (!isAttending || !event.onlineLinkVisible) {
            return res.status(403).json({ 
                error: "You must be attending to view this link",
                isCreator: false
            });
        }

        res.status(200).json({ 
            onlineLink: event.onlineLink,
            isCreator: false
        });
    } catch (error) {
        console.error("Get Online Link Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


// POST   /events/:eventId/comments
exports.addCommentToEvent = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { content } = req.body;
    const eventId = Number(req.params.eventId);

    if (!userId || !eventId || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // pass postId = null, eventId = <something>
    const comment = await CommentService.addComment(userId, null, eventId, content);
    return res.status(201).json({ message: "Comment added to event", comment });
  } catch (error) {
    console.error("Add Event Comment Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET    /events/:eventId/comments
exports.getCommentsByEvent = async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!eventId) {
      return res.status(400).json({ error: "Missing eventId" });
    }

    const comments = await CommentService.getCommentsByEvent(eventId);
    return res.status(200).json({ comments });
  } catch (error) {
    console.error("Get Event Comments Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.getEventsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const events = await EventService.getEventsByUserId(userId);
        res.status(200).json(events);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch events by user ID" });
    }
};