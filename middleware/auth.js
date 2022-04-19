//Middleware for authenticating requests using tokens

//imports
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  //if request method is options, continue on with execution
  //This is to get around browser interactions with http requests
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    //store the token as the value is located in the 2nd element of the array
    //This is due the token usually coming with a bearer i.e 'BEARER'+ token
    const token = req.headers.authorization.split(" ")[1];
    //if check to see if token exists, if not throw an error
    if (!token) {
      throw new Error("Authentication failed");
    }

    //decode the token with the key used to encrypt it initially
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    //add userData property to the request object, adding the userId
    req.userData = { userId: decodedToken.userId };
    //next to continue execution
    next();
  } catch (err) {
    //If auth fails, send error with status code of 401
    //401 means unauthorized
    const error = new HttpError("Authentication failed", 401);
    //next to continue execution and pass the error
    next(error);
  }
};
