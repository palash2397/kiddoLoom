import {Router} from "express";
import {
     addSchoolHandle,
        loginHandle,
    forgotPasswordHandle,
    verifyPasswordHandle,
    changePasswordHandle,
    teacherStatusUpdate,
    createRoomHandle,
    addstudentInRoomHandle,
    deleteStudentHandle
}
from "../controllers/adminController.js"

import { upload } from "../middlewares/multer.js";
import { auth, isSuperAdmin } from "../middlewares/auth.js";


const adminRouter = Router();

adminRouter.post("/school", auth, upload.array("images"), addSchoolHandle);
adminRouter.post("/login", loginHandle);
adminRouter.post("/forgot-password", forgotPasswordHandle);
adminRouter.get("/verify-password/:id", verifyPasswordHandle);
adminRouter.post("/change-password", changePasswordHandle);
adminRouter.patch("/teacher/status", auth, teacherStatusUpdate )
adminRouter.post("/room", auth, createRoomHandle)
adminRouter.patch("/room/update", auth , addstudentInRoomHandle)
adminRouter.delete("/room/delete", auth, deleteStudentHandle)




export default adminRouter;