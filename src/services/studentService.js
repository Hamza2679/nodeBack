const pool = require("../config/db");
const Student = require("../models/student");

class StudentService {
    static async createStudent(data) {
        const {
            firstName, middleName, lastName,
            email, phoneNumber, universityId, profilePictureUrl
        } = data;

        const client = await pool.connect();
        try {
            // Normalize university ID to lowercase before saving
            const normalizedUniversityId = universityId.toLowerCase();

            const result = await client.query(
                `INSERT INTO students 
                (first_name, middle_name, last_name, email, phone_number, university_id, profile_picture_url) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, first_name, middle_name, last_name, email, phone_number, university_id, profile_picture_url, created_at`,
                [firstName, middleName, lastName, email, phoneNumber, normalizedUniversityId, profilePictureUrl]
            );

            const row = result.rows[0];
            return new Student(
                row.id,
                row.first_name,
                row.middle_name,
                row.last_name,
                row.email,
                row.phone_number,
                row.university_id,
                row.profile_picture_url,
                row.created_at
            );
        } catch (error) {
            throw new Error("Error creating student: " + error.message);
        } finally {
            client.release();
        }
    }

    static async getStudentByUniversityId(universityId) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT id, first_name, middle_name, last_name, email, phone_number, university_id, profile_picture_url, created_at
                 FROM students
                 WHERE LOWER(university_id) = LOWER($1)`, // case-insensitive search
                [universityId]
            );

            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return new Student(
                row.id,
                row.first_name,
                row.middle_name,
                row.last_name,
                row.email,
                row.phone_number,
                row.university_id,
                row.profile_picture_url,
                row.created_at
            );
        } catch (error) {
            throw new Error("Error fetching student: " + error.message);
        } finally {
            client.release();
        }
    }
}

module.exports = StudentService;