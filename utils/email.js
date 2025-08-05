import nodemailer from 'nodemailer'
import hbs from "nodemailer-express-handlebars";

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


var transporter = nodemailer.createTransport({
    // service: 'gmail',
    host: "smtp.gmail.com",
    port: 587,
    // secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const handlebarOptions = {
    viewEngine: {
        extName: '.handlebars',
        partialsDir: join(__dirname, '../view/'),
        layoutsDir: join(__dirname, '../view/'),
        defaultLayout: false,
    },
    viewPath: join(__dirname, '../view/'),
    extName: '.handlebars',
};

transporter.use("compile", hbs(handlebarOptions));

export const sendPasswordMail = async function (name, to, password) {
    let mailOptions = {
        from: process.env.SMTP_USER, // sender address
        to: to,
        subject: "Password Sent Successfully",
        template: "password",
        context: {
            name,
            password
        },
    };

    // Send email using transporter
    transporter.sendMail(mailOptions, function (err, info) {
        if (err) { // If error occurs while sending email
            console.log("Error -" + err); // Log the error
        } else { // If email sent successfully
            console.log("Email sent successfully", info.response); // Log the success message with email response info
        }
    });
};




export const sendForgotPasswordMail = async function (name, to, actToken, route) {
    let mailOptions = {
        from: process.env.SMTP_USER, // sender address
        to: to,
        subject: "Forgot Password",
        template: "forgotPassword",
        context: {
            name,
            href_url:`${process.env.BASE_URL}/${route}/verify-password/${actToken}`,
            msg: `Please click below link to activate your account.`,
        },
    };

    // Send email using transporter
    transporter.sendMail(mailOptions, function (err, info) {
        if (err) { // If error occurs while sending email
            console.log("Error -" + err); // Log the error
        } else { // If email sent successfully
            console.log("Email sent successfully", info.response); // Log the success message with email response info
        }
    });
};