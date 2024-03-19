import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js"; 

export const verifyUser = asyncHandler(async (req, _, next)=>{
    // console.log(req.cookies)
    // throw new apiError(401, 'Access denied: Unauthorized action');
    
    try {
        //cookies and not cookie also headers not header: it was a bug so keep in mind next time
        const token = req.cookies?.accessToken;
        // || req.headers('Authorization')?.replace('Bearer ', '');
        
        /*
        const token = req.cookies?.accessToken || req.headers('Authorization')?.replace('Bearer ','');
        task:  search for 2nd condition
        */
       if(!token){
           throw new apiError(401, 'Access denied: Unauthorized action');
        }
        
        
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // console.log('inside jwt verification', decodedToken);
        /* 
        decodedToken { detail of user with reference to created tokens from user model
            _id: '65f5de6715a01726f762a5fc',      
            email: 'user3@gmaiil.com',
            username: 'user3',
            fullName: 'user1',
            iat: 1710699590,
            exp: 1710785990
        }           
        
        */
       //now we have _id from decoded Token
       //bhai please please please await laga diya kar!!! 1 din poora chala gya tere chakkar me kutte!
       const currentUser =await User.findById(decodedToken?._id).select('-password -refreshToken');
       
       //if whole usermodel is coming as response of currentUser make sure to call function with await!
       
    //    console.log('decodedToken', currentUser);
       if(!currentUser){
           throw new apiError(401, 'invalid token')
        }
        req.user = currentUser;
        
        // throw new apiError(500, 'intentionally terminated program!');
        next(); 
    } catch (error) {
        //never assume the error just console.log it
        console.log(error)
        throw new apiError(401, 'Invalid token or No cookies received from the server')
    }
});