import { School } from "../models/schools/school.js";
import { Child } from "../models/parent/ChildForm.js";
import { Admin } from "../models/admin/Admin.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Teacher } from "../models/teacher/Teacher.js";
// import { generateRandomString, getExpirationTime } from "../utils/helpers.js";
// import { sendForgotPasswordMail } from "../utils/email.js";
import Joi from "joi";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// export const addSchoolHandle = async (req, res) => {
//   try {
//     const {
//       name,
//       description,
//       address,
//       location,
//       contactInfo = {},
//       facilities = [],
//       ageGroups = [],
//       fees = {},
//       timings,
//       principalName,
//       establishedYear,
//       affiliation,
//       curriculum = [],
//     } = req.body;

//     const { email, phone } = contactInfo;

//     // Validation schema (keep your existing schema)
//     const schema = Joi.object({
//       name: Joi.string().trim().min(2).max(100).required(),
//       description: Joi.string().optional(),

//       address: Joi.object({
//         street: Joi.string().required(),
//         city: Joi.string().required(),
//         state: Joi.string().required(),
//         zipCode: Joi.string().required(),
//         country: Joi.string().required(),
//       }).required(),

//       location: Joi.object({
//         coordinates: Joi.array().items(Joi.number()).length(2).required(), // [lng, lat]
//       }).required(),

//       contactInfo: Joi.object({
//         phone: Joi.string().optional(),
//         email: Joi.string().optional(),
//         website: Joi.string().optional(),
//       }).optional(),

//       facilities: Joi.array().items(Joi.string().min(1)).optional(),

//       ageGroups: Joi.array()
//         .items(
//           Joi.object({
//             name: Joi.string().required(),
//             minAge: Joi.number().min(0).required(),
//             maxAge: Joi.number().greater(Joi.ref("minAge")).required(),
//           })
//         )
//         .optional(),

//       fees: Joi.object({
//         admissionFee: Joi.number().min(0).optional(),
//         monthlyFee: Joi.number().min(0).optional(),
//         annualFee: Joi.number().min(0).optional(),
//       }).optional(),

//       timings: Joi.object({
//         openTime: Joi.string().required(), // HH:mm 24hr format
//         closeTime:
//           Joi.string()
//             .required(),
//         workingDays: Joi.array().items(Joi.string()).min(1).required(),
//       }).required(),

//       principalName: Joi.string().min(2).max(100).optional(),
//       establishedYear: Joi.number().integer().optional(),
//       affiliation: Joi.string().optional(),
//       curriculum: Joi.array().items(Joi.string().min(2)).optional(),
//       captions: Joi.array().items(Joi.string().max(200)).optional(),
//     });

//     const { error } = schema.validate(req.body);
//     if (error) {
//       return res.status(400).json({ error: error.details[0].message });
//     }

//     // Check for existing school
//     if (email || phone) {
//       const existing = await School.findOne({
//         $or: [
//           ...(email ? [{ "contactInfo.email": email }] : []),
//           ...(phone ? [{ "contactInfo.phone": phone }] : []),
//         ],
//       });
//       if (existing) {
//         return res
//           .status(400)
//           .json(
//             new ApiResponse(
//               400,
//               {},
//               "School with this email or phone already exists"
//             )
//           );
//       }
//     }

//     // Handle file uploads
//     let photoArray = [];
//     if (req.files && req.files.length > 0) {
//       const captions = req.body.captions;
//       const captionsArray = Array.isArray(captions) ? captions : [captions];
//       req.files.forEach((file, index) => {
//         photoArray.push({
//           url: file.filename,
//           caption: captionsArray[index] || null,
//         });
//       });
//     }

//     // Create new school
//     const school = new School({
//       name,
//       description,
//       address,
//       location,
//       contactInfo,
//       facilities,
//       ageGroups,
//       fees,
//       images: photoArray,
//       timings,
//       principalName,
//       establishedYear,
//       affiliation,
//       curriculum,
//     });

//     await school.save();

//     return res
//       .status(201)
//       .json(
//         new ApiResponse(
//           200,
//           school._id,
//           `School ${school.name} added successfully`
//         )
//       );
//   } catch (error) {
//     console.error("Error adding school:", error);
//     return res
//       .status(500)
//       .json(new ApiResponse(500, {}, "Internal server error"));
//   }
// };
export const allSchoolsHandle = async (req, res) => {
  try {
    const flag = req.body;

    if (flag == "all") {
      const data = await School.find()
        .select("-__v -createdAt -updatedAt")
        .sort({ createdAt: -1 });

      data.map((item) => {
        item.images.map((img) => {
          img.url = img.url
            ? `${process.env.BASE_URL}/schools/${img.url}`
            : `${process.env.DEFAULT_PIC}`;
        });
      });

      return res
        .status(200)
        .json(new ApiResponse(200, data, "Schools fetched successfully"));
    }

    const data = await School.find({ isApproved: { $in: [1, 2] } })
      .select("-__v -createdAt -updatedAt")
      .sort({ createdAt: -1 });

    data.map((item) => {
      item.images.map((img) => {
        img.url = img.url
          ? `${process.env.BASE_URL}/schools/${img.url}`
          : `${process.env.DEFAULT_PIC}`;
      });
    });

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Schools fetched successfully"));
  } catch (error) {
    console.error("Error fetching schools:", error);
    return res
      .status(501)
      .json(new ApiResponse(500, {}, `Internal server error`));
  }
};

export const allchildFormsHandle = async (req, res) => {
  try {
    const { id, schoolId } = req.body;
    const schema = Joi.object({
      id: Joi.string().allow("").optional(),
      schoolId: Joi.string().optional(),
    });

    const { error } = schema.validate({ id, schoolId });
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const user = await Admin.findOne({ _id: req.user.id });
    if (!user)
      return res.status(404).json(new ApiResponse(404, {}, `User not found`));

    const school = await School.findOne({
      _id: schoolId,
      adminId: req.user.id,
    });
    if (!school)
      return res.status(404).json(new ApiResponse(404, {}, `School not found`));

    if (id) {
      const childForm = await Child.findOne({
        _id: id,
        schoolId: schoolId,
      }).select("-__v -createdAt -updatedAt -actToken -linkExpireAt");

      if (!childForm) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, "No child form found "));
      }

      // childForm.map((form) => {
      //   form.images.map((img) => {
      //     img.url = img.url
      //       ? `${process.env.BASE_URL}/children/${img.url}`
      //       : `${process.env.DEFAULT_PIC}`;
      //   });
      // });

      return res
        .status(200)
        .json(
          new ApiResponse(200, childForm, "Child form fetched successfully")
        );
    }

    const childForms = await Child.find({ schoolId: schoolId }).select(
      "-__v -createdAt -updatedAt -actToken -linkExpireAt"
    );

    if (!childForms || childForms.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, `No child forms found`));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, childForms, `Child forms fetched successfully`)
      );
  } catch (error) {
    console.error(`Error fetching child forms:`, error);
    return res
      .status(501)
      .json(new ApiResponse(500, {}, `Internal server error`));
  }
};

export const schoolDetailsHandle = async (req, res) => {
  try {
    const school = await School.findOne({ adminId: req.user.id }).select(
      "-__v -createdAt -updatedAt"
    );

    if (!school) {
      return res.status(404).json(new ApiResponse(404, {}, `School not found`));
    }

    school.images.map((img) => {
      img.url = img.url
        ? `${process.env.BASE_URL}/schools/${img.url}`
        : `${process.env.DEFAULT_PIC}`;
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, school, `School details fetched successfully`)
      );
  } catch (error) {
    console.error("Error fetching school details:", error);
    return res
      .status(501)
      .json(new ApiResponse(500, {}, `Internal server error`));
  }
};

export const allTeachersHandle = async (req, res) => {
  try {
    const { id, schoolId } = req.body;

    const schema = Joi.object({
      id: Joi.string().allow("").optional(),
      schoolId: Joi.string().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const user = await Admin.findOne({ _id: req.user.id });
    if (!user)
      return res.status(404).json(new ApiResponse(404, {}, `User not found`));
    const school = await School.findOne({
      _id: schoolId,
      adminId: req.user.id,
    })
    if (!school)
      return res.status(404).json(new ApiResponse(404, {}, `School not found`));

    if (id) {
      const teacher = await Teacher.findOne({
        _id: id,
        schoolId: schoolId,
      }).select("-__v -createdAt -updatedAt -password -actToken -linkExpireAt");

      if (!teacher)
        return res
          .status(404)
          .json(new ApiResponse(404, {}, `Teacher not found`));

      return res
        .status(200)
        .json(new ApiResponse(200, teacher, `Teacher fetched successfully`));
    }

    const teachers = await Teacher.find({ schoolId: schoolId }).select("-__v -createdAt -updatedAt -password -actToken -linkExpireAt");

    if (!teachers || teachers.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, `No teachers found`));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, teachers, `Teachers fetched successfully`));
  } catch (error) {
    console.error(`Error fetching teachers:`, error);
    return res
      .status(501)
      .json(new ApiResponse(500, {}, `Internal server error`));
  }
};
