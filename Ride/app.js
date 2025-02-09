const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const rideRoutes = require('./routes/ride');
const cookieParser = require('cookie-parser');
const connect = require('./DB/connect');
const rabbitmq = require("./services/rabbit");
connect();

rabbitmq.connect() ;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());
 

app.use("/",rideRoutes) ;


module.exports = app;
