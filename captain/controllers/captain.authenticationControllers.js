const captainModel = require('../models/captain.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports.register = async (req, res) => {
   try {
    const { name, email, password } = req.body;
    const captain = await captainModel.findOne({ email });
    if (captain) {
      return res.status(400).json({ message: 'captain already exists' });
    }
    const hahshedPassword = await bcrypt.hash(password, 10);
    const newcaptain = await captainModel.create({
      name,
      email,
      password: hahshedPassword,
    });
    const token = jwt.sign({ id: newcaptain._id }, process.env.JWT_SECRET);
res.cookie('token', token);
delete newcaptain.password;
    res.status(201).json({ message: 'captain created successfully', newcaptain,token });
}
catch (error) {
    res.status(500).json({ message: error.message });
}
}

module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const captain = await captainModel.findOne({ email });
        if (!captain) {
            return res.status(400).json({ message: 'captain does not exist' });
        }
        const verifyPassword = await bcrypt.compare(password, captain.password);
        if (!verifyPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: captain._id }, process.env.JWT_SECRET);
       res.cookie('token', token);
        delete captain.password;
        res.status(200).json({ message: 'captain logged in successfully', captain, token });

    }catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports.logout = async(req, res) => {
    try {
       res.clearCookie('token');
        res.status(200).json({ message: 'captain logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}  

module.exports.profile = async(req, res) => {
   try{
    res.send(req.captain)
   }
   catch(err){
    res.status(500).json({message:err.message})
   }
}