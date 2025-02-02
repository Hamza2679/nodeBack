class User {
    constructor(id, firstName, lastName, email, password, universityId = null, profilePicture = null) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.universityId = universityId;
        this.profilePicture = profilePicture;
    }
}

module.exports = User;
