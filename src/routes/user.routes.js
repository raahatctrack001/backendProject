import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
const router = Router();

//router.router('/location').post('controllerFunction');

router.route('/register').post(registerUser)


export default router;