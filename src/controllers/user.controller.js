import apiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../services/cloudinary.services.js";
import apiResponse from "../utils/apiResponse.js";
import jwt from 'jsonwebtoken';
import { upload } from "../middlewares/multer.middleware.js";
import { error } from "console";

const generateAccessAndRefreshToken = async(userId) => {
    try{
        const currentUser = await User.findById(userId); //whenever there's a communication between data base ASYNC AWAIT is mendatory otherwise you will end up your whole day finding bugs
        const accessToken = currentUser.generateAccessToken();
        const refreshToken = currentUser.generateRefreshToken();
        currentUser.refreshToken = refreshToken; //for refreshing the token once access token in expired

        currentUser.refreshToken = refreshToken;
        currentUser.save();
        return {accessToken, refreshToken};
    }catch(error){
        throw new apiError(500, 'something went wrong while generatign access and refresh token');
    }
}

export const registerUser = asyncHandler(async (req, res, _)=>{ 
    //_ = next when next isn't in use
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
   const {fullName, username, email, password} = req.body;
   
    if (
        [fullName, email, username, password].some(field => field?.trim() === "")
    ) {
        throw new apiError(400, "All fields are required")
    }
    //to check multiple case for same parameters then use parameters with $
    // $operator : [{file 1 to check}, {file 2 to check}, {file 3 to check} ...]
    //whhile talking to database always use await as it is in another continent: just kidding
    const isUserExist = await User.findOne({
        $or: [{email}, {username}]
    });
    if(isUserExist){
        throw new apiError(409, 'user with this credentials already exist');
    }
    //console.log(req.files);
    
    console.log(req.files)
    const avatarLocalFilePath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalFilePath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalFilePath = req.files.coverImage[0].path
    }
    
    
    if (!avatarLocalFilePath) {
        throw new apiError(400, "Avatar local file is required")
    }    
    const avatarCloudLink = await uploadOnCloudinary(avatarLocalFilePath)
    if (!avatarCloudLink) {
        throw new apiError(400, "Avatar cloud link is required")
    }
    
    const coverImageCloudLink = await uploadOnCloudinary(coverImageLocalFilePath);
    const newUser = await User.create({
        fullName,
        avatar: avatarCloudLink.url,
        coverImage: coverImageCloudLink?.url || '',
        email,
        password,
        username: username.toLowerCase(), 
    });

    const createdUser = await User.findById(newUser._id).select(
        '-password -refreshToken' //things not to select
        )
    console.log(createdUser);
    if(!createdUser){
        throw new apiError(500, 'something went wrong while registering user');
    }

    res.status(201).json(
        new apiResponse(200, createdUser, "User registration SUCCESSFUL")
        )
    });

export const loginUser = asyncHandler(async (req, res) =>{
    /* To Do's
        1. take form data and validate it
        2. check if use exist or not with username or email
        3. if exist fetch the data
        4. check password
        5. generate access and refresh token and send cookie
        6 send success response
    */

    const {username, email, password} = req.body;
    if(!username && !email){
        throw new apiError(400, 'username or email is required');
    }

    const currentUser = await User.findOne({ //await was missing and error was: current.isPasswordCorrect isn't a function
        $or: [{username}, {email}]
    });

    if(!currentUser){
        throw new apiError(404, 'User does not exist');
    }
    
    const isPasswordValid = currentUser.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new apiError(401, 'wrong credentials')
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(currentUser._id);
    const options = {
        httpOnly: true,
        secure: true,
    }
    const loggedInUser = await User.findById(currentUser._id).select('-password -refreshToken');

    return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
        new apiResponse(
            200,
            {
                loggedInUser, accessToken, refreshToken
            },
            'user logged in SUCCESSFULLY'
        )
    )
})

export const logoutUser = asyncHandler(async(req, res, next)=>{
    console.log('rq.user from logout controller', req.user)
    if(!req.user)
        // throw new apiError(500, 'no user found');
    await User.findByIdAndUpdate(
        req.user?._id, //from custom middleware
        // console.log(req.user._id)
        {
            $unset: {
                refreshToken: 1//unset it from database
            }
        },
        {
            new: true // return new updated data object
        }
        );
        
    const options = {
        httpOnly: true,
            secure: true
        }
        
    console.log('logout success');
    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(
            new apiResponse(200, {}, "User logout SUCCESSFUL")
        )

});
        
export const refreshAccessToken = asyncHandler(async (req, res)=>{
    try {
        const incomingToken = req.cookies.refreshToken || req.body.refreshToken;
        if(!incomingToken){
            throw new apiError(401, 'Unauthorised request')
        }
            
    const decodedToken = jwt.verify(
        incomingToken,
        process.env.REFRESH_TOKEN_SECRET
    )
    const currentUser = await User.findById(decodedToken?._id)
    if(!currentUser){
        throw new apiError(401, 'invalid refresh token')
    }

    if(incomingToken !== currentUser.refreshToken){
        throw new apiError(401, 'refresh token is expired or used');
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(currentUser._id);
    const options = {
        httpOnly: true,
        secure: true
    }
    return res  
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', newRefreshToken, options)
    .json(
        new apiResponse(
            200, 
                {
                    accessToken, refreshToken: newRefreshToken
                },
                "access token refreshed"
            )
        )
    } catch (error) {
        console.log(error)
        throw new apiError(401, error.message || 'invalid refresh token')
    }
})

export const changeCurrentPassword = asyncHandler(async (req, res) =>{
    try {
        const {oldPassword, newPassword, confirmPassword} = req.body;
    
        if(newPassword !== confirmPassword){
            throw new apiError(401, 'Old password and Confirm password match FAILED');
        }
    
        const currentUser = await User.findById(req.user?._id);
        if(!currentUser){
            throw new apiError(400, "User doesn't found");
        }
    
        const user = await User.findById(req.user?._id)
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    
        if (!isPasswordCorrect) {
            throw new apiError(400, "Invalid old password")
        }
    
        user.password = newPassword
        await user.save({validateBeforeSave: false}) //validate password field only before running pre save hooks
        console.log('pasword changd succesfully!')
        return res
        .status(200)
        .json(new apiResponse(200, {}, "Password changed successfully"))
    } catch (error) {
        console.log(error);
    }
})

export const getCurrentUser = asyncHandler(async(req, res)=>{
    console.log('inside get user controller', req.user)
    return res
    .status(200)
    .json(new apiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

export const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullName, email} = req.body;
    if(!fullName || !email){
        throw new apiError(400, 'All fields are required');
    }

    const currentUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true}
    ).select('-password')

    return res
    .status(200)
    .json(
        new apiResponse(200, currentUser, 'data update SUCCESS')
    );
})

export const updateAvatar = asyncHandler(async(req, res)=>{
    const avatarLocalFile = req.file;
    console.log(avatarLocalFile)
    if(!avatarLocalFile){
        throw new apiError(404, 'Avatar local file NOT FOUND!')
    }
    const avatarCloudLink = await uploadOnCloudinary(avatarLocalFile.path);
    if(!avatarCloudLink){
        throw new apiError(500, 'FAILED to upload file');
    }
    // throw new apiError(500, 'intentional termination');
    
    const currentUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatarCloudLink.url
            }
        }, 
        {
            new : true
        }
    ).select("-password");

    return res
    .status(200)
    .json(
        new apiResponse(200, currentUser, 'Avatar update SUCCESS')
    )
})

export const updateCoverImage = asyncHandler(async (req, res)=>{
    const coverImageLocalFilePath = req.file;
    if(!coverImageLocalFilePath){
        throw new apiError(404, 'cover image local file NOT FOUND');
    }

    const coverImageCloudLink = await uploadOnCloudinary(coverImageLocalFilePath.path);
    if(!coverImageCloudLink){
        throw new apiError(404, 'FAILED to upload cover image on cloudinary!')
    }
    console.log('coverImageUploadResponse', coverImageCloudLink)

    const currentUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImageCloudLink.url
            }            
        }
        ,
        {new : true}
    ).select('-password');

    return res
    .status(200)
    .json(
        new apiResponse(200, currentUser, 'Cover image upadate SUCCESS')
    )
})