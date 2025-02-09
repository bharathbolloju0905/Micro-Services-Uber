const jwt = require("jsonwebtoken");
const axios = require("axios");

module.exports.authenticate = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization.split(" ")[1];
    console.log(token);
    if (!token) {
        console.log('token not found in ride');
        
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const response = await axios.get(`http://localhost:3000/users/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = response ;
        const user = data.data;
        console.log(user);
        if (!user) {
            console.log('user not found in ride');
            
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.user = user;
        next();
    } catch (err) {
        console.log('Error in ride',err);
        
        return res.status(401).json({ message: "Unauthorized" });
    }
};

module.exports.authenticateCaptain = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization.split(" ")[1];
    if (!token) {
        console.log('token not found in captain of ride');
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const response = await axios.get(`http://localhost:3000/captain/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = response ;
        const captain = data.data;
        if (!captain) {
            console.log('captain not found in ride');
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.captain = captain;
        next();
    } catch (err) {
        console.log("Errror in captain Authentication in Ride",err) ;
        return res.status(401).json({ message: "Unauthorized" });
    }
}
