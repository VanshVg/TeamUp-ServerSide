import { ValidationChain, body } from "express-validator";

export const registerValidator: ValidationChain[] = [
  body("first_name")
    .notEmpty()
    .withMessage("Firstname can't be empty")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("Firstname must be alphabetic."),
  body("last_name")
    .notEmpty()
    .withMessage("Lastname can't be empty")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("Lastname must be alphabetic."),
  body("username").notEmpty().withMessage("Username can't be empty."),
  body("email")
    .notEmpty()
    .withMessage("Email can't be empty")
    .isByteLength({ min: 6 })
    .withMessage("Please provide a valid email address")
    .isEmail()
    .withMessage("Invalid email...!!")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password can't be empty")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long...!!"),
];
