import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from '../middlewares/multer.middleware.js';
import { verifyUser } from "../middlewares/auth.middleware.js";

//biggest bug till now:-  configure upload || multer then import 
//conciously to avoid further speed breaker

const router = Router();


//router.router('/location').post('controllerFunction');

router.route('/register').post(
    upload.fields(
        [{
            name: 'avatar', 
            maxCount: 1,
        },
         {
            name: 'coverImage',
            maxCount: 1,
         }]
    ), 
    registerUser)
router.route('/login').post(loginUser);
router.route('/logout').post(verifyUser, logoutUser);


export default router;