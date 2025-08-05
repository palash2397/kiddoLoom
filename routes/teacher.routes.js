import { Router } from "express";
import {
    signupHandle,
    loginHandle,
    fogotPasswordHandle,
    verifyPasswordHandle,
    changePasswordHandle,
    

} from "../controllers/teacherController.js"

import {auth} from "../middlewares/auth.js"


const teacherRouter = Router();

teacherRouter.post("/register", signupHandle);
teacherRouter.post("/login", loginHandle);
teacherRouter.post("/forgot-password", fogotPasswordHandle);
teacherRouter.get("/verify-password/:id", verifyPasswordHandle);
teacherRouter.post("/change-password", changePasswordHandle);






export default teacherRouter;