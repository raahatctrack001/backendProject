import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from '../middlewares/multer.middleware.js';

//biggest bug till now:-  configure upload || multer then import 
//conciously to avoid further speed breaker

const router = Router();


//router.router('/location').post('controllerFunction');

router.route('/register').post(upload.any(), registerUser)


export default router;