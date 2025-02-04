const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/users');
const cookieParser = require('cookie-parser');
const connect = require('./DB/connect');
connect();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());
 

app.use("/users",userRoutes) ;


module.exports = app;
