//Router configures routing relating to users

//Imports
const express = require("express");
const { check } = require("express-validator");

const usersControllers = require("../controllers/users-controllers");

//Create a new router object
const router = express.Router();

//Configures post request to /signup, this does basic input validation
//Along with calling the signup function from the users controllers file
router.post(
  "/signup",
  [
    check("username").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").not().isEmpty(),
  ],
  usersControllers.signup
);

//Configures post request to /login
//This calls the login function from the users controllers file
router.post("/login", usersControllers.login);

//Export the configured router
module.exports = router;
