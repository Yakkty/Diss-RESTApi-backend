//This file defines the model for a post, using a defined schema

//Imports
const mongoose = require("mongoose");

//Create a new mongoose schema object
const Schema = mongoose.Schema;

// define a new post schema with its corresponding properties
const postSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

//Export the Post model, referring to the postSchema
module.exports = mongoose.model("Post", postSchema);
