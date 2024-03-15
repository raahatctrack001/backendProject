import asyncHandlers from "../utils/asyncHandlers.js";

export const registerUser = asyncHandlers(async (req, res, next)=>{
    res.status(200).json({
        message: 'messsage from asyncHandler'
    });
});
 
