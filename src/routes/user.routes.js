import { Router } from "express";
import { 
    changeCurrentPassword, 
    getCurrentUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    updateAccountDetails,
    updateAvatar,
    updateCoverImage
} from "../controllers/user.controller.js";
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
router.route('/refresh-token').post(refreshAccessToken);
router.route('/change-current-password').post(verifyUser, changeCurrentPassword);
router.route('/current-user').get(verifyUser, getCurrentUser);
router.route('/update-account-details').patch(verifyUser, updateAccountDetails);
router.route('/update-avatar').post(verifyUser, upload.single('avatar'), updateAvatar);
router.route('/update-cover-image').post(verifyUser, upload.single('coverImage'), updateCoverImage)


export default router;