import apiError from "../utils/apiError.js";
import asyncHandlers from "../utils/asyncHandlers.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../services/cloudinary.services.js";
import apiResponse from "../utils/apiResponse.js";
import { create } from "domain";

export const registerUser = asyncHandlers(async (req, res, next)=>{
    /* To Do's
    1. get data from frontend : check from user model and must include required fields
    2. handle edge cases
    3. check if user already exisits? i.e. duplicate key
    4. remove password and refresh token before sending data anywhere
    5. check for image and avatar
    6. upload them to cloudinary
    7. create user object: save it inside databse
    8. check if successfully saved or not
    9. return res;
    */

    const {username, email, password, fullName} = req.body;
    if(
        [username, email, password, fullName].some((field)=>field?.trim()==='')
    ){ //before sendgin parameters, check api error file
        throw new apiError(400, 'All fieds are required');
    }

    //to check multiple case for same parameters then use parameters with $
    // $operator : [{file 1 to check}, {file 2 to check}, {file 3 to check} ...]
    const isUserExist = User.findOne({
        $or: [{email}, {username}]
    });
    if(isUserExist){
        throw new apiError(409, 'user with this credentials already exist');
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    const avatarCloudLink = await uploadOnCloudinary(avatarLocalPath);
    if(!avatarCloudLink){
        throw new apiError(400, 'avatar upload FAILED');
    }

    const converImageCloudLink = await uploadOnCloudinary(coverImageLocalPath);
    
    
    const newUser = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: converImageCloudLink?.url || '',
        email,
        password,
        username: username.toLowerCase(), 
    });
    const createdUser = await User.findById(newUser._id).select(
        '-password -refreshToken' //things not to select
    )

    if(!createdUser){
        throw new apiError(500, 'something went wrong while registering user');
    }

    res.status(201).json(
        new apiResponse(200, createdUser, "User registration SUCCESSFUL")
    )
});
 
