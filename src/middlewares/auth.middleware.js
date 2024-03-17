import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js"; 

export const verifyUser = asyncHandler(async (req, res, next)=>{
    try {
        const token = req.cookie?.accessToken || req.header('Authorization')?.replace('Bearer ','');
    
        if(!token){
            throw new apiError(401, 'Access denied: Unauthorized');
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const currentUser = User.findById(decodedToken?._id).select('-password', '-refreshToken');
    
        if(!currentUser){
            throw new apiError(401, 'invalid token')
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new apiError(401, error.message || 'invalid access token')
    }
});