//This file defines the model for a calendar, using a defined schema

//Imports
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

//Create a new mongoose schema object
const Schema = mongoose.Schema;

// define a new user schema with its corresponding properties
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  posts: [{ type: mongoose.Types.ObjectId, required: true, ref: "Post" }],
  calendar: [
    { type: mongoose.Types.ObjectId, required: true, ref: "CalendarItem" },
  ],
  todolist: [{ type: mongoose.Types.ObjectId, required: true, ref: "TdItem" }],
});

//Enforces username remains unique
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
