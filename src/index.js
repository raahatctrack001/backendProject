import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { DB_NAME } from './constants.js';

dotenv.config();

const app = express();

//connecting to database
//effey
(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        app.on('error', (error)=>{
            console.log('ERR', error);
            throw error;
        });

        app.listen(process.env.PORT, ()=>{
            console.log(`server is up and running on ${process.env.PORT}`);
        })
    }
    catch(error){
        console.error("FAILED to connect databse", error);
        process.exit(1);
    }
})()

