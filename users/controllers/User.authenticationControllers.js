const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { connect, subscribeQueue } = require("../services/rabbit");

let pendingRequests = [];

module.exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await userModel.create({
            name,
            email,
            password: hashedPassword,
        });
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
        res.cookie('token', token);
        delete newUser.password;
        res.status(201).json({ message: 'User created successfully', newUser, token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }
        const verifyPassword = await bcrypt.compare(password, user.password);
        if (!verifyPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.cookie('token', token);
        delete user.password;
        res.status(200).json({ message: 'User logged in successfully', user, token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports.logout = async (req, res) => {
    try {
        res.clearCookie('token');
        res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports.profile = async (req, res) => {
    try {
        console.log(req.user);
        res.send(req.user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports.acceptedRide = async (req, res) => {
    try {
        // Add the request to the pendingRequests array
        pendingRequests.push(res);

        // Set a timeout to handle the case where no ride is accepted within a certain time
        setTimeout(() => {
            const index = pendingRequests.indexOf(res);
            if (index !== -1) {
                pendingRequests.splice(index, 1);
                res.status(204).end();
            }
        }, 30000); // 30 seconds timeout
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Function to handle ride acceptance and notify pending requests
const handleAcceptedRide = (data) => {
    const ride = JSON.parse(data);
    while (pendingRequests.length > 0) {
        const res = pendingRequests.pop();
        res.status(200).json({ message: "Ride accepted", ride });
    }
};

(async () => {
    try {
        await connect();
        subscribeQueue("ride-accepted", handleAcceptedRide);
    } catch (error) {
        console.error('Failed to connect to RabbitMQ or subscribe to queue', error);
    }
})();