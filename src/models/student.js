class Student {
    constructor(id, firstName, middleName, lastName, email, phoneNumber, universityId, profilePictureUrl, createdAt) {
        this.id = id;
        this.firstName = firstName;
        this.middleName = middleName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.universityId = universityId;
        this.profilePictureUrl = profilePictureUrl;
        this.createdAt = createdAt;
    }
}

module.exports = Student;
