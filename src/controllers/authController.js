const { registerUser } = require("../services/authService");

const signup = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const newUser = await registerUser(name, email, password);
        res.status(201).json({ message: "User registered", user: newUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = { signup };
