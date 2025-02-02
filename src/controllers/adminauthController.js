const adminAuthService = require('../services/adminAuthService');

exports.signup = async (req, res) => {
    const { firstName, lastName, email, password, universityId, role } = req.body;
    if (!firstName || !lastName || !email || !password || !universityId || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const admin = await adminAuthService.createAdmin(firstName, lastName, email, password, universityId, role);
        res.status(201).json(admin);
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
        const admin = await adminAuthService.loginAdmin(email, password);
        res.status(200).json(admin);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};