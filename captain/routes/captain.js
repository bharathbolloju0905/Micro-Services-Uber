const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/captain.authenticationControllers');
const middleware = require('../middleware/protected');


router.get('/', (req, res) => {
    res.send('Hello from captain route');
});
router.post('/register', authControllers.register);
router.post('/login', authControllers.login);
router.get('/logout', authControllers.logout);
router.get('/profile',middleware.protected ,authControllers.profile);
router.patch('/toggle-availability',middleware.protected ,authControllers.toggle);
router.get('/new-ride',middleware.protected ,authControllers.waitForNewRide);

module.exports = router;