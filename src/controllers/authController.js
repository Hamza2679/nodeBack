const authService = require('../services/authService');
exports.initiateSignup = async (req, res) => {
    try {
        const { universityId } = req.body;
        const response = await authService.initiateSignup(universityId);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.verifySignupOTP = async (req, res) => {
    try {
        const { universityId, otp } = req.body;
        const result = await authService.verifySignupOTP(universityId, otp);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.completeSignup = async (req, res) => {
    try {
        const { universityId, password, firstName, lastName, email } = req.body;
        const result = await authService.completeSignup(
            universityId, 
            password, 
            firstName, 
            lastName, 
            email
        );
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.signup = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const user = await authService.createUser(firstName, lastName, email, password);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const result = await authService.deleteUser(id);
        res.status(200).json({ message: "User deleted successfully", result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



exports.signin = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await authService.loginUser(email, password);
        res.status(200).json(user);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};



exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const response = await authService.sendOTP(email);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required." });
  }

  try {
    const result = await authService.verifyOTP(email, otp);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: "Email and new password required." });
  }

  try {
    const result = await authService.resetPassword(email, newPassword);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
};


exports.getAllUsers = async (req, res) => {
    try {
        const users = await authService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const user = await authService.getUserById(id);
        res.status(200).json(user);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};


exports.editProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { firstName, lastName, email, universityId } = req.body;
        let profilePictureUrl = null;

        // Handle Profile Picture Upload
        if (req.file) {
            try {
                profilePictureUrl = await authService.uploadProfilePicture(req.file);
            } catch (uploadError) {
                console.error("S3 Upload Error:", uploadError);
                return res.status(500).json({ error: "Failed to upload profile picture" });
            }
        }

        // Update User Data
        const updatedUser = await authService.updateUser(userId, {
            firstName,
            lastName,
            email,
            universityId,
            profilePicture: profilePictureUrl,
        });

        return res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Edit Profile Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
