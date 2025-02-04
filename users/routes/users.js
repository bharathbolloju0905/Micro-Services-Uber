const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/User.authenticationControllers');
const middleware = require('../middleware/protected');

router.get('/', (req, res) => {
    res.send('Hello from users route');
});
router.post('/register', authControllers.register);
router.post('/login', authControllers.login);
router.get('/logout', authControllers.logout);
router.get('/profile',middleware.protected ,authControllers.profile);

module.exports = router;