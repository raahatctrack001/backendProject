import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

/*
handle 5 middlewares first in app.js
1.cors
2.express.json() and set limit
3.express.urlencoded() and set limit
4.express.static() to add static files in public folder
5.cookieParser 
*/
//for cross origin resource sharing: i.e. restrict your access to backend toward some restricted location only
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true, //why?
}));

//middleware to handle data coming in json format at limit if data is exceeding 16 kb
app.use(express.json({limit: "16kb"}));

//to handle data coming from url like slug(+), slug(%) i.e. handles url encoding and limit to 16Kb only
app.use(express.urlencoded({
    extended: true,
    limit: "16kb",
}));

//all the static files like image pdf etc lies in folder named public
app.use(express.static("public"));

//handles the cookie of server
app.use(cookieParser);

/* ###########################seggregation#################################*/
//import router;
import userRouter from './routes/user.routes.js';


//router declaration
app.use('/users', userRouter); //now control goes to userRouter in routes folder i.e. user.routes.js


// http://localhost:8000/api/v1/users/register i.e. /api/v1/user is prefix

export { app };