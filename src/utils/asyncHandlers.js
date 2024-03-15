const asyncHandler = (requestHandler)=>{
   return (req, res, next)=>{
        Promise.resolve(requestHandler(req, res, next))
        .catch((err)=>{
            next(err);
        })
    }
}
export default asyncHandler;















//using try and catch: another method is to do with promises
/*
export const asyncHandler = (fn) => async(req, res, next) =>{
    try{
        await fn();
    }
    catch(err){
        res.status(err.code || 500).json({
            success: false,
            message: err.message,
        });
    }
}
*/