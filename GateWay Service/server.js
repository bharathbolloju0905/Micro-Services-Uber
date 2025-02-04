const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const expressProxy = require('express-http-proxy');
const PORT = process.env.PORT ;

app.use("/users", expressProxy('http://localhost:3001', {
    proxyReqPathResolver: req => `/users${req.url}`
}));

app.listen(PORT, () =>{ 
    console.log(`Server is running on port ${PORT}`) 
});