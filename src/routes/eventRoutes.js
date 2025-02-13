const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const { authenticateToken } = require("../middleware/authMiddleware"); // Add authentication middleware
const upload = require("../middleware/multer"); // Configure multer for file uploads

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     description: Create a new event with optional cover photo and additional images.
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the event.
 *                 example: "Tech Conference"
 *               type:
 *                 type: string
 *                 description: The type of the event.
 *                 example: "Conference"
 *               datetime:
 *                 type: string
 *                 format: date-time
 *                 description: The date and time of the event.
 *                 example: "2023-12-25T10:00:00Z"
 *               description:
 *                 type: string
 *                 description: The description of the event.
 *                 example: "Annual tech conference"
 *               coverPhoto:
 *                 type: string
 *                 format: binary
 *                 description: The cover photo for the event.
 *               eventImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional images for the event (up to 4).
 *     responses:
 *       201:
 *         description: Event created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Event created successfully"
 *                 event:
 *                   $ref: "#/components/schemas/Event"
 *       400:
 *         description: Bad request. Missing required fields.
 *       401:
 *         description: Unauthorized. Authentication required.
 *       500:
 *         description: Internal server error.
 *     security:
 *       - BearerAuth: []
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
 * /api/events:
 *   get:
 *     summary: Get all events
 *     description: Retrieve a list of all events.
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of events.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Event"
 *       500:
 *         description: Internal server error.
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
 *         example: 1
 *     responses:
 *       200:
 *         description: Event details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Event"
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/:id", eventController.getEventById);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event by ID
 *     description: Delete a specific event by its ID.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Event deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Event deleted successfully"
 *       404:
 *         description: Event not found or unauthorized.
 *       500:
 *         description: Internal server error.
 *     security:
 *       - BearerAuth: []
 */
/**
 * @swagger
 * /api/events/type/{type}:
 *   get:
 *     summary: Get events by category/type
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         example: "Conference"
 *     responses:
 *       200:
 *         description: List of events in the specified category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Event"
 *       404:
 *         description: No events found for this category
 *       500:
 *         description: Internal server error
 */
router.get("/type/:type", eventController.getEventsByType);
router.delete("/:id", authenticateToken, eventController.deleteEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an event by ID
 *     description: Update details of a specific event by its ID.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The updated name of the event.
 *                 example: "Updated Tech Conference"
 *               type:
 *                 type: string
 *                 description: The updated type of the event.
 *                 example: "Workshop"
 *               datetime:
 *                 type: string
 *                 format: date-time
 *                 description: The updated date and time of the event.
 *                 example: "2023-12-26T10:00:00Z"
 *               description:
 *                 type: string
 *                 description: The updated description of the event.
 *                 example: "Updated description"
 *               coverPhoto:
 *                 type: string
 *                 format: binary
 *                 description: The updated cover photo for the event.
 *               eventImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Updated additional images for the event (up to 4).
 *     responses:
 *       200:
 *         description: Event updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Event updated successfully"
 *                 event:
 *                   $ref: "#/components/schemas/Event"
 *       400:
 *         description: Bad request. Missing required fields.
 *       401:
 *         description: Unauthorized. Authentication required.
 *       404:
 *         description: Event not found or unauthorized.
 *       500:
 *         description: Internal server error.
 *     security:
 *       - BearerAuth: []
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

module.exports = router;