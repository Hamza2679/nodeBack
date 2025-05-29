const StudentService = require("../services/studentService");
const { uploadToS3 } = require("../services/uploadService");

exports.createStudent = async (req, res) => {
    try {
        const {
            firstName, middleName, lastName,
            email, universityId, phoneNumber
        } = req.body;

        if (!firstName || !lastName || !email || !universityId || !phoneNumber) {
            return res.status(400).json({ error: "Missing required student fields" });
        }

        let profilePictureUrl = null;
        if (req.file) {
            profilePictureUrl = await uploadToS3(
                req.file.buffer,
                req.file.originalname,
                "social-sync-for-final"
            );
        }

        const newStudent = await StudentService.createStudent({
            firstName,
            middleName,
            lastName,
            email,
            phoneNumber,
            universityId,
            profilePictureUrl
        });

        res.status(201).json({
            message: "Student created successfully",
            student: newStudent
        });
    } catch (error) {
        console.error("Create Student Error:", error.message);
        res.status(500).json({ error: "Failed to create student: " + error.message });
    }
};

exports.getStudentByUniversityId = async (req, res) => {
    try {
        const { universityId } = req.params;

        const student = await StudentService.getStudentByUniversityId(universityId);

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.status(200).json({ student });
    } catch (error) {
        console.error("Get Student Error:", error.message);
        res.status(500).json({ error: "Failed to get student: " + error.message });
    }
};
