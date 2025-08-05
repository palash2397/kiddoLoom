import { Router } from "express";
 import {auth} from "../middlewares/auth.js"
import {
    registerHandle,
    loginHandle,
    fogotPasswordHandle,
    verifyPasswordHandle,
    changePasswordHandle,
    addChildHandle
}  from "../controllers/parentController.js";



const parenRouter = Router()


parenRouter.post("/register", registerHandle);
parenRouter.post("/login", loginHandle);
parenRouter.post("/forgot-password", fogotPasswordHandle);
parenRouter.get("/verify-password/:id", verifyPasswordHandle);
parenRouter.post("/change-password", changePasswordHandle);
parenRouter.post("/child", auth, addChildHandle)





export default parenRouter;