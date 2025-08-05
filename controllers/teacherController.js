import Joi from "joi";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { ApiResponse } from "../utils/ApiResponse.js";
import { generateRandomString, getExpirationTime } from "../utils/helpers.js";
import { sendForgotPasswordMail, sendPasswordMail } from "../utils/email.js";
import { Teacher } from "../models/teacher/Teacher.js";
import { School } from "../models/schools/school.js";

export const signupHandle = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      roomNo,
      education,
      city,
      address,
      gender,
      schoolId,
    } = req.body;

    const schema = Joi.object({
      name: Joi.string().trim().min(2).max(100).required(),
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
      roomNo: Joi.string().required(),
      education: Joi.string().required(),
      city: Joi.string().required(),
      address: Joi.string().required(),
      gender: Joi.string().required(),
      schoolId: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const user = await Teacher.findOne({
      $or: [{ email }, { phone }],
    });
    if (user) {
      let msg = email == user.email ? "email" : "phone number";
      return res
        .status(401)
        .json(new ApiResponse(400, {}, `${msg} already exists`));
    }

    const school = await School.findById(schoolId);
    if (!school)
      return res.status(404).json(new ApiResponse(404, {}, `School not found`));

    const randomPassword = await generateRandomString(15);
    const newTeacher = new Teacher({
      name,
      email,
      phone,
      roomNo,
      education,
      city,
      address,
      gender,
      schoolId,
      password: randomPassword,
    });
    await newTeacher.save();

    await sendPasswordMail(name, email, randomPassword);

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          newTeacher._id,
          `${name} teacher registered successfully`
        )
      );
  } catch (error) {
    console.error(`Error in signupHandle:`, error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, `Internal Server Error`));
  }
};

export const loginHandle = async (req, res) => {
  try {
    const { email, password } = req.body;

    const schema = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    // Find parent by email
    const user = await Teacher.findOne({ email });
    if (!user)
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Invalid email or password"));

    if (user.status !== 2) {
      let msg =
        user.status == 1
          ? `your account is not activated yet`
          : `your account is rejected by the school`;
      return res.status(401).json(new ApiResponse(400, {}, `${msg}`));
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword)
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Invalid email or password"));

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, { userData, token }, `Login successful`));
  } catch (error) {
    console.error(`Error logging in teacher:`, error);
    return res
      .status(501)
      .json(new ApiResponse(500, {}, `Internal server error`));
  }
};

export const fogotPasswordHandle = async (req, res) => {
  try {
    const { email } = req.body;

    const schema = Joi.object({
      email: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const actToken = await generateRandomString(8);
    const linkExpireAt = getExpirationTime();
    // Find parent by email
    const user = await Teacher.findOne({ email });
    if (!user)
      return res.status(404).json(new ApiResponse(404, {}, `Parent not found`));

    user.actToken = actToken;
    user.linkExpireAt = linkExpireAt;
    await user.save();

    await sendForgotPasswordMail(
      user.name,
      user.email,
      user.actToken,
      "teachers"
    );

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password reset link sent to your email"));
  } catch (error) {
    console.error("Error in forgot password:", error);
    return res
      .status(501)
      .json(new ApiResponse(500, {}, `Internal server error`));
  }
};

export const verifyPasswordHandle = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id)
      return res.status(400).json(new ApiResponse(400, {}, `Invalid link`));

    // Find parent by activation token
    const user = await Teacher.findOne({ actToken: id });
    if (user) {
      if (user.linkExpireAt < new Date()) {
        return res.render("linkExpired", {
          msg: `Link expired, please request a new one`,
        });
      }
      res.render("forgotTeacherPassword", { msg: "", vertoken: user.actToken });
    } else {
      res.render("forgotTeacherPassword", { msg: `Invalid link` });
    }
  } catch (error) {
    console.error(`Error verifying password:`, error);
    res.render("error", { msg: `Invalid link` });
  }
};

export const changePasswordHandle = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    const schema = Joi.object({
      token: Joi.string().required(),
      newPassword: Joi.string().min(6).required(),
      confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    // Find parent by activation token
    const user = await Teacher.findOne({ actToken: token });
    if (!user)
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Parent not found or invalid token"));

    user.password = newPassword;
    user.actToken = null;

    await user.save();

    res.render("passwordSuccess", { msg: `Password changed successfully` });
  } catch (error) {
    console.error(`Error changing password:`, error);
    res.render(`error`, { msg: `Invalid link` });
  }
};
