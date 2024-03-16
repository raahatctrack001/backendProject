import apiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../services/cloudinary.services.js";
import apiResponse from "../utils/apiResponse.js";

const generateAccessAndRefreshToken = async(userId) => {
    try{
        const currentUser = User.findById(userId);
        const accessToken = currentUser.generateAccessToken();
        const refreshToken = currentUser.generateRefreshToken();

        currentUser.refreshToken = refreshToken;
        currentUser.save();
        return {accessToken, refreshToken};
    }catch(error){
        throw new apiError(500, 'something went wrong while generatign access and refresh token');
    }
}

export const registerUser = asyncHandler(async (req, res, next)=>{
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
    // console.log(req.body);
    const {fullName, username, email, password} = req.body;
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
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

    const currentUser = User.findOne({
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