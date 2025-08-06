import { Router } from "express";
import {
  allSchoolsHandle,
  schoolDetailsHandle,
  allTeachersHandle,
  allchildFormsHandle,
  getRoomsHandle
} from "../controllers/schoolController.js";
import { upload } from "../middlewares/multer.js";
import { auth } from "../middlewares/auth.js";

const schoolRouter = Router();
// schoolRouter.post("/school", upload.array("images"), addSchoolHandle);
schoolRouter.get("/school", allSchoolsHandle);
schoolRouter.get("/my-school", auth, schoolDetailsHandle);
schoolRouter.get("/all-forms", auth, allchildFormsHandle);
schoolRouter.get("/all-teachers", auth, allTeachersHandle)
schoolRouter.get("/rooms",auth, getRoomsHandle)


export default schoolRouter;
