class Admin {
    constructor(id, firstName, lastName, email, password, universityId, role) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.universityId = universityId;
        this.role = role;
    }
}

module.exports = Admin;