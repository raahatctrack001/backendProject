import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import dotenv from 'dotenv'
dotenv.config({
    path: './.env'
})
//wherever you want to use environment variable make sure to config before taking that var like above there 
//without importing dotevn and configuring i tried to use env var and got 1 day debugging
//almost one day in this buy for not using process.env. and just writing variable name: try not to do this mistake again

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null
    try {
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type:'auto'
        })
        // file has been uploaded successfull
        
        // console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        // console.log(response);
        return response;

    } catch (error) {
        console.log(error.message);
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary}