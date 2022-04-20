//This file Configures login and signup functions

const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");

//Function to sign up users
//Async as database interactions are typically asynchronous
const signup = async (req, res, next) => {
  //Enforcing validation with express validator
  const errors = validationResult(req);

  //Return an error if errors are found
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs provided", 422));
  }

  //Obtain values from the request body
  const { username, email, password } = req.body;

  //Define user  outside due to block scoping
  let existingUser;

  //Attempt to find a user by username
  try {
    existingUser = await User.findOne({ username: username });
  } catch (err) {
    const error = new HttpError("Signing up failed", 500);
    return next(error);
  }

  //Check if user already exists
  if (existingUser) {
    const error = new HttpError(
      "Signing up failed, username already exists",
      422
    );
    return next(error);
  }

  //Attempt to hash password for added security

  let hashedPassword;
  try {
    //Using bcrypt library method to hash the password
    //second number is salting rounds, hash returns a promise so we can use await
    hashedPassword = await bcrypt.hash(password, 10);
  } catch (err) {
    const error = new HttpError("Could not create user", 500);
    return next(error);
  }

  //create new user based off of the user model
  const createdUser = new User({
    username: username,
    email: email,
    password: hashedPassword,
    posts: [],
    calendar: [],
    todolist: [],
  });

  //Attempt to save the user to the database
  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Signing up failed", 500);
    return next(error);
  }

  //Attempt to create a token, attaching username, user id and an expiration date to the token payload
  //This is using jwon web tokens
  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, username: createdUser.username },
      process.env.JWT_KEY,
      { expiresIn: "1hr" }
    );
  } catch (err) {
    const error = new HttpError("Signing up failed", 500);
    return next(error);
  }

  //Return user id, username and the created token
  res.status(201).json({
    userId: createdUser.id,
    username: createdUser.username,
    token: token,
  });
};

//Function to log users in
//Async as database interactions are typically asynchronous
const login = async (req, res, next) => {
  //Obtain values from the request body
  const { username, password } = req.body;

  //Define user  outside due to block scoping
  let existingUser;

  //Attempt to find a user in the database by username
  try {
    existingUser = await User.findOne({ username: username });
  } catch (err) {
    const error = new HttpError("Logging in failed", 500);
    return next(error);
  }

  //If check to see if there is no user or invalid password
  if (!existingUser) {
    const error = new HttpError("Could not log in, invalid credentials", 401);
    return next(error);
  }

  let ValidPassword = false;

  try {
    //compare hashed password with user input password using bcrypt.compare()
    ValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError("Could not log in", 500);
    return next(error);
  }

  //Check if the inputted password is valid
  if (!ValidPassword) {
    const error = new HttpError("Could not log in, invalid credentials", 401);
    return next(error);
  }

  //Attempt to create a token, attaching username, user id and expiration date to the payload
  //This is using jwon web tokens
  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, username: existingUser.username },
      process.env.JWT_KEY,
      { expiresIn: "1hr" }
    );
  } catch (err) {
    const error = new HttpError("Logging in failed", 500);
    return next(error);
  }

  //If a user is found and the passwords match a response gets sent back
  //The response contains the user id, username and token
  res.json({
    userId: existingUser.id,
    username: existingUser.username,
    token: token,
  });
};

//Export the configured functions
exports.signup = signup;
exports.login = login;
