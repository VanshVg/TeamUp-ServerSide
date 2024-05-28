import { ValidationChain, body } from "express-validator";

export const registerValidator: ValidationChain[] = [
  body("firstName")
    .notEmpty()
    .withMessage("Firstname can't be empty")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("Firstname must be alphabetic."),
  body("lastName")
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
    .withMessage("Invalid email...!!"),
  body("password")
    .notEmpty()
    .withMessage("Password can't be empty")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long...!!"),
];

export const loginValidator: ValidationChain[] = [
  body("username").notEmpty().withMessage("Username or Email can't be empty."),
  body("password")
    .notEmpty()
    .withMessage("Password can't be empty")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long...!!"),
];

export const verifyAccountValidator: ValidationChain[] = [
  body("username").notEmpty().withMessage("Username or Email can't be empty."),
];

export const changePasswordValidator: ValidationChain[] = [
  body("password")
    .notEmpty()
    .withMessage("Password can't be empty")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long...!!"),
];
