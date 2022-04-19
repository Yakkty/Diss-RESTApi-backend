//This file defines the model for the todolist, using a defined schema

//Imports
const mongoose = require("mongoose");

//Create a new mongoose schema object
const Schema = mongoose.Schema;

// define a new tdItem schema with its corresponding properties
const tdItemSchema = new Schema({
  description: { type: String, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

//Export the tdItem model, referring to the tdItemSchema
module.exports = mongoose.model("TdItem", tdItemSchema);
