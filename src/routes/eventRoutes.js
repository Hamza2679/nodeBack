const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const { authenticateToken } = require("../middleware/authMiddleware");
const multer = require("multer");
const rsvpController = require('../controllers/rsvpController');


// Configure multer to use memory storage
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management APIs
 */

/**
 * @swagger
 * /api/events/create:
 *   post:
 *     summary: Create a new event
 *     description: Create a new event with optional cover photo and additional images.
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Tech Conference"
 *               type:
 *                 type: string
 *                 example: "Conference"
 *               datetime:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-12-25T10:00:00Z"
 *               description:
 *                 type: string
 *                 example: "Annual tech conference"
 *               coverPhoto:
 *                 type: string
 *                 format: binary
 *               eventImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Bad request (missing required fields)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/create",
  authenticateToken, // Add authentication middleware
  upload.fields([
    { name: "coverPhoto", maxCount: 1 }, // Single cover photo
    { name: "eventImages", maxCount: 4 }, // Up to 4 additional images
  ]),
  eventController.createEvent
);

/**
 * @swagger
 * /api/events/getallevents:
 *   get:
 *     summary: Get all events
 *     description: Retrieve a list of all events.
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of events
 *       500:
 *         description: Internal server error
 */
router.get("/getallevents", eventController.getEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get an event by ID
 *     description: Retrieve details of a specific event by its ID.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", eventController.getEventById);

/**
 * @swagger
 * /api/events/type/{type}:
 *   get:
 *     summary: Get events by type
 *     description: Retrieve events by their type/category.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of events by type
 *       404:
 *         description: No events found for this type
 *       500:
 *         description: Internal server error
 */
router.get("/type/:type", eventController.getEventsByType);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event by ID
 *     description: Delete a specific event by its ID.
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found or unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenticateToken, eventController.deleteEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an event by ID
 *     description: Update details of a specific event by its ID.
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               datetime:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               coverPhoto:
 *                 type: string
 *                 format: binary
 *               eventImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Bad request (missing required fields)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found or unauthorized
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  authenticateToken, // Add authentication middleware
  upload.fields([
    { name: "coverPhoto", maxCount: 1 }, // Single cover photo
    { name: "eventImages", maxCount: 4 }, // Up to 4 additional images
  ]),
  eventController.updateEvent
);

/**
 * @swagger
 * /api/events/{eventId}/rsvp:
 *   post:
 *     summary: RSVP to an event
 *     description: RSVP as a user to a specific event.
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [going, interested, not_going]
 *                 example: going
 *     responses:
 *       200:
 *         description: RSVP successful
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.post(
  '/:eventId/rsvp',
  authenticateToken,
  rsvpController.rsvp
);

/**
 * @swagger
 * /api/events/{eventId}/rsvps:
 *   get:
 *     summary: List RSVPs for an event
 *     description: Retrieve all RSVPs for a specific event.
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of RSVPs
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.get(
  '/:eventId/rsvps',
  authenticateToken,
  rsvpController.listForEvent
);

/**
 * @swagger
 * /api/events/{eventId}/rsvp:
 *   get:
 *     summary: Get my RSVP for an event
 *     description: Retrieve the current user's RSVP for a specific event.
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: RSVP details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: RSVP not found
 */
router.get(
  '/:eventId/rsvp',
  authenticateToken,
  rsvpController.getMyRsvp
);

/**
 * @swagger
 * /api/events/{eventId}/rsvp:
 *   put:
 *     summary: Update my RSVP for an event
 *     description: Update the current user's RSVP for a specific event.
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [going, interested, not_going]
 *                 example: interested
 *     responses:
 *       200:
 *         description: RSVP updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: RSVP not found
 */
router.put(
  '/:eventId/rsvp',
  authenticateToken,
  rsvpController.update
);

/**
 * @swagger
 * /api/events/{eventId}/rsvp:
 *   delete:
 *     summary: Remove my RSVP for an event
 *     description: Remove the current user's RSVP for a specific event.
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: RSVP removed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: RSVP not found
 */
router.delete(
  '/:eventId/rsvp',
  authenticateToken,
  rsvpController.remove
);

/**
 * @swagger
 * /api/events/{eventId}/attendees:
 *   get:
 *     summary: List event attendees
 *     description: Retrieve a list of users attending a specific event.
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of attendees
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.get(
  '/:eventId/attendees',
  authenticateToken,
  rsvpController.listAttendees
);

/**
 * @swagger
 * /api/events/{id}/online-link:
 *   get:
 *     summary: Get online event link
 *     description: Retrieve the online meeting link for an event (if available and visible).
 *     tags: [Events]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Online link retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event or link not found
 */
router.get('/:id/online-link', authenticateToken, eventController.getOnlineLink);

/**
 * @swagger
 * /api/events/group/{groupId}:
 *   get:
 *     summary: Get events by group
 *     description: Retrieve all events for a specific group.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     responses:
 *       200:
 *         description: List of group events
 *       404:
 *         description: No events found for this group
 */
router.get('/group/:groupId', eventController.getEventsByGroup);
router.post("/:eventId/comments", authenticateToken, eventController.addCommentToEvent);
router.get("/:eventId/comments", authenticateToken, eventController.getCommentsByEvent);


module.exports = router;