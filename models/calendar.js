//This file defines the model for a calendar, using a defined schema

//Imports
const mongoose = require("mongoose");

//Create a new mongoose schema object
const Schema = mongoose.Schema;

// define a new calendar schema with its corresponding properties
const calendarItemSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  
});

//Export the calendarItem model, referring to the calendarItemSchema
module.exports = mongoose.model("CalendarItem", calendarItemSchema);
