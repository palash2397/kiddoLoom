import Joi from "joi";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";

import { Parent } from "../models/parent/Parent.js";
import { Child } from "../models/parent/ChildForm.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateRandomString, getExpirationTime } from "../utils/helpers.js";
import { sendPasswordMail, sendForgotPasswordMail } from "../utils/email.js";
import { table } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const registerHandle = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        const schema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().required(),
            phone: Joi.string().required(),
        });

        const { error } = schema.validate(req.body);

        if (error)
            return res
                .status(400)
                .json(new ApiResponse(400, {}, error.details[0].message));

        // Check if parent already exists
        const existingParent = await Parent.findOne({
            $or: [{ email }, { phone }],
        });
        if (existingParent) {
            let msg = email == existingParent.email ? "email" : "phone number";
            return res
                .status(401)
                .json(new ApiResponse(400, {}, `${msg} already exists`));
        }

        const randomPassword = await generateRandomString(15);

        // Create new parent
        const newParent = new Parent({
            name,
            email,
            phone,
            password: randomPassword,
        });
        await newParent.save();

        // Send password via email
        await sendPasswordMail(name, email, randomPassword);

        return res
            .status(201)
            .json(new ApiResponse(201, {}, "Parent registered successfully"));
    } catch (error) {
        console.error("Error registering parent:", error);
        return res
            .status(501)
            .json(new ApiResponse(500, {}, `Internal server error`));
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
        const parent = await Parent.findOne({ email });
        if (!parent)
            return res
                .status(401)
                .json(new ApiResponse(401, {}, "Invalid email or password"));

        const isValidPassword = await bcrypt.compare(password, parent.password);
        if (!isValidPassword)
            return res
                .status(401)
                .json(new ApiResponse(401, {}, "Invalid email or password"));

        // Generate JWT token
        const token = jwt.sign(
            { id: parent._id, email: parent.email },
            process.env.JWT_SECRET,
            {
                expiresIn: "30d",
            }
        );

        const userData = {
            id: parent._id,
            name: parent.name,
            email: parent.email,
            phone: parent.phone,
        };

        return res
            .status(200)
            .json(new ApiResponse(200, { userData, token }, "Login successful"));
    } catch (error) {
        console.error("Error logging in parent:", error);
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
        const parent = await Parent.findOne({ email });
        if (!parent)
            return res.status(404).json(new ApiResponse(404, {}, "Parent not found"));

        parent.actToken = actToken;
        parent.linkExpireAt = linkExpireAt;
        await parent.save();

        await sendForgotPasswordMail(parent.name, parent.email, parent.actToken, "parents");

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
            return res.status(400).json(new ApiResponse(400, {}, "Invalid link"));

        // Find parent by activation token
        const parent = await Parent.findOne({ actToken: id });
        if (parent) {
            if (parent.linkExpireAt < new Date()) {
                return res.render("linkExpired", {
                    msg: "Link expired, please request a new one",
                });
            }
            res.render("forgotPassword", { msg: "", vertoken: parent.actToken });
        } else {
            res.render("forgotPassword", { msg: "Invalid link" });
        }
    } catch (error) {
        console.error("Error verifying password:", error);
        res.render("error", { msg: "Invalid link" });
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
        const parent = await Parent.findOne({ actToken: token });
        if (!parent)
            return res
                .status(404)
                .json(new ApiResponse(404, {}, "Parent not found or invalid token"));

        parent.password = newPassword;
        parent.actToken = null;

        await parent.save();

        res.render("passwordSuccess", { msg: "Password changed successfully" });
    } catch (error) {
        console.error("Error changing password:", error);
        res.render("error", { msg: "Invalid link" });
    }
};

export const addChildHandle = async (req, res) => {
    try {
        const {
            name,
            age,
            parentName,
            email,
            phone,
            emergencyContact,
            address,
            notes,
            schoolId,
        } = req.body;
        const schema = Joi.object({
            name: Joi.string().required(),
            age: Joi.number().required(),
            parentName: Joi.string().required(),
            email: Joi.string().email().required(),
            phone: Joi.string().required(),
            emergencyContact: Joi.string().required(),
            address: Joi.string().required(),
            notes: Joi.string().optional(),
            schoolId: Joi.string().optional(),
        });

        const { error } = schema.validate(req.body);
        if (error)
            return res
                .status(400)
                .json(new ApiResponse(400, {}, error.details[0].message));

        // find parent by email
        const parent = await Parent.findOne({ _id: req.user.id });




        if (!parent || parent._id.toString() !== req.user.id)
            return res.status(404).json(new ApiResponse(404, {}, `Parent not found`));



        const childExists = await Child.findOne({
            name: name,
            age: age,
            email: email,
            parentId: req.user.id,
            schoolId: schoolId
        })

        if (childExists) return res
            .status(400)
            .json(new ApiResponse(400, {}, `You’ve already submitted a form for this child to this school.`));
        // Create new child
        const newChild = new Child({
            name,
            age,
            parentName,
            email,
            phone,
            emergencyContact,
            address,
            notes,
            parentId: req.user.id,
            schoolId,
        });

        await newChild.save();

        return res
            .status(201)
            .json(
                new ApiResponse(201, { child: newChild }, `Child added successfully`)
            );
    } catch (error) {
        console.error("Error adding child:", error);
        return res
            .status(501)
            .json(new ApiResponse(500, {}, `Internal server error`));
    }
};
