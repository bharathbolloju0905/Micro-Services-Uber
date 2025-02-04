const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports.register = async (req, res) => {
   try {
    const { name, email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hahshedPassword = await bcrypt.hash(password, 10);
    const newUser = await userModel.create({
      name,
      email,
      password: hahshedPassword,
    });
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
res.cookie('token', token);
delete newUser.password;
    res.status(201).json({ message: 'User created successfully', newUser,token });
}
catch (error) {
    res.status(500).json({ message: error.message });
}
}

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

    }catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports.logout = async(req, res) => {
    try {
       res.clearCookie('token');
        res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}  

module.exports.profile = async(req, res) => {
    res.send(req.user);
}