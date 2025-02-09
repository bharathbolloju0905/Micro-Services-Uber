const jwt = require('jsonwebtoken');

module.exports.protected = async(req, res, next) => {
    const token = req.cookies.token || req.headers.authorization.split(' ')[1];
    if(!token) {
        console.log('token not found in Captain');
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.captain = decoded;
        next();
    } catch (error) {
        console.log('Error in Captain', error);
        return res.status(401).json({ message: 'Unauthorized' });
    }
};