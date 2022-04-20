//This is a REST Api backend made using Node.js, Express.js, mongoDB, Mongoose and multer
//Rest apis faciliate HTTP requests like GET, POST, PATCH etc

//imports
const fs = require("fs");
const path = require("path");

const express = require("express");
const mongoose = require("mongoose");

const postsRoutes = require("./routes/posts-routes");
const tdRoutes = require("./routes/td-routes");
const calendarRoutes = require("./routes/calendar-routes");
const userRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

//Creates express application
const app = express();

//Allows for parsing json
app.use(express.json());

//This statically serves files in the path of /uploads/*, this allows for the frontend to always display images and files stored in the server
app.use("/uploads/images", express.static(path.join("uploads", "images")));

//Fix CORS errors, allows any domain to send requests
//This sets the headers that will be accepted on requests, and then continues on to the other middlewares
//Custom authorization header set to protect http requests
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  next();
});

//Adding routes configured in the routes folder as middlewares
app.use("/api/posts", postsRoutes);

app.use("/api/todolist", tdRoutes);

app.use("/api/calendar", calendarRoutes);

app.use("/api/users", userRoutes);

//this is only reached if a request didn't receive a response, throws error if thats the case
app.use((req, res, next) => {
  const error = new HttpError("Route not found", 404);
  throw error;
});

//Error handling middleware, only executes on requests that throw errors
app.use((error, req, res, next) => {
  //Deletes image if an error occured during the creation of new posts
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log("Unlinked");
    });
  }
  if (res.headersSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "Error occured" });
});

//mongoose connect is asynchronous so can chain then() and catch()
//Using environment variables for production code
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@uniwork.lbg0m.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
  )
  .then(() => {
    //Starts the server, using environment variable or 5000 as a fallback
    app.listen(process.env.PORT || 5000);
  })
  .catch((err) => {
    console.log(err);
  });
