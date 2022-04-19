//This file is responsible for configuring CRUD functionality around posts
//These functions are called in the routing files and interact with the database

//Imports
const fs = require("fs");

const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const Post = require("../models/post");
const User = require("../models/user");

//Async as database interactions are typically asynchronous
//Function to get posts by a particular id
const getPostById = async (req, res, next) => {
  //get post id from url request url
  const postId = req.params.pid;

  //Define place outside due to block scoping
  let post;

  try {
    //Find post in database, passing postId as a parameter
    post = await Post.findById(postId);
  } catch (err) {
    const error = new HttpError("Could not find post with that id", 500);
    return next(error);
  }

  //Return error if post isn't found
  if (!post) {
    const error = new HttpError("Could not find post for the provided id", 404);
    return next(error);
  }

  //Return found post, converting it to a javascript object from a mongoose object
  //getters:true returns an id property with no _ before it
  res.json({ post: post.toObject({ getters: true }) });
};

//Function to retrieve posts by a given user id
//Async as database interactions are typically asynchronous
const getPostsByUserId = async (req, res, next) => {
  //get user id from request url
  const userId = req.params.uid;

  //Define place outside due to block scoping
  let userPosts;

  try {
    //Find user posts in database, passing userId as a parameter
    userPosts = await Post.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(
      "Could not find posts with the provided user id",
      500
    );
    return next(error);
  }

  //Check if a userh as no posts
  if (!userPosts || userPosts.length === 0) {
    const error = new HttpError(
      "Could not find posts for the provided user id",
      404
    );
    return next(error);
  }

  //Return found post, converting it to a javascript object from a mongoose object
  //getters:true returns an id property with no _ before it
  //Map has to be used as find() returns an array
  res.json({
    userPosts: userPosts.map((post) => post.toObject({ getters: true })),
  });
};

//Function to create new posts
//Async as database interactions are typically asynchronous
const createPost = async (req, res, next) => {
  // //Store validation result in a variable
  const errors = validationResult(req);

  //If errors, return error message
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs provided", 422));
  }

  //Gather data from the request body
  const { title, description, creator } = req.body;

  //Create a new post based off of the post model
  //Passing values from the request body as parameters
  const createdPost = new Post({
    title: title,
    description: description,
    image: req.file.path,
    creator: creator,
  });

  console.log(req.file.path + "hehe");
  console.log(description);
  //Define user outside due to block scoping
  let user;

  //Check if user id exists
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError("Creating post failed", 500);
    return next(error);
  }

  //Check if user doesn't exist
  if (!user) {
    const error = new HttpError("Could not find user", 404);
    return next(error);
  }

  //Attempt to save the new post to the database, and save the post id to the corresponding user
  //This save requires multiple independent operations to complete successfully,
  //if either fails then all operations need to be undone
  //This is achieved with sessions and transactions
  try {
    //create new session
    const sess = await mongoose.startSession();
    //start a new transaction
    sess.startTransaction();
    //attempt to save the post to the posts database, passing the session as a parameter
    await createdPost.save({ session: sess });

    //Push the created post id to the posts field of the user
    user.posts.push(createdPost);

    //attempt to save this post id to the user database, passing the session as a parameter
    await user.save({ session: sess });

    //Only at this point are the changes committed
    await sess.commitTransaction();
  } catch (err) {
    //forward error if this fails
    const error = new HttpError("Could not create post", 500);
    return next(error);
  }

  //Send back the created post as a response
  res.status(201).json({ post: createdPost });
};

//Function for updating posts
//Async as database interactions are typically asynchronous
const updatePost = async (req, res, next) => {
  //Store validation result in a variable
  const errors = validationResult(req);

  //If errors, return error message
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs provided", 422));
  }

  //Gather data from the request body
  const { title, description } = req.body;

  //Get post id from request url parameters
  const postId = req.params.pid;

  //Define place outside due to block scoping
  let post;
  try {
    //Find post in database, passing postId as a parameter
    post = await Post.findById(postId);
  } catch (err) {
    const error = new HttpError("Could not find post with that id", 500);
    return next(error);
  }

  //Check if the creator of the post is the same user attempting to update the place
  //toString() as we need to convert the mongoose object id to a string for comparison
  if (post.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You're unable to edit this place", 401);
    return next(error);
  }

  //Assign new values, obtained from the request body
  post.title = title;
  post.description = description;

  //Attempt to save these changes
  try {
    await post.save();
  } catch (err) {
    const error = new HttpError("Could not update place", 500);
    return next(error);
  }

  //Return updated post, converting it to a javascript object from a mongoose object
  //getters:true returns an id property with no _ before it
  res.status(200).json({ post: post.toObject({ getters: true }) });
};

//Function for deleting posts
//Async as database interactions are typically asynchronous
const deletePost = async (req, res, next) => {
  //Get access to the post id from the request url parameters
  const postId = req.params.pid;

  //Define item outside due to block scoping
  let post;

  try {
    //populate refers to a document stored in another collection, and to work with data in that existing document of the other collection\
    //Search for a post with the post id, and search for a user that has this post id
    //"creator" refers to this user id
    post = await Post.findById(postId).populate("creator");
  } catch (err) {
    const error = new HttpError("Could not delete post", 500);
    return next(error);
  }

  //Check if no post exists
  if (!post) {
    const error = new HttpError("Could not find post", 404);
    return next(error);
  }

  //Check if the creator of the post is the same user attempting to delete the place
  //Don't need to call toString as using the populate method adds the id as a string
  if (post.creator.id !== req.userData.userId) {
    const error = new HttpError("You're unable to delete this place", 401);
    return next(error);
  }

  //Attempt to delete the post from the database, and remove the post id from the user
  //This requires multiple independent operations to complete successfully,
  //if either fails then all operations need to be undone
  //This is achieved with sessions and transactions
  try {
    //create new session
    const sess = await mongoose.startSession();

    //start a new transaction
    sess.startTransaction();

    //Remove post from posts collection
    await post.remove({ session: sess });

    //Remove post from the user by pulling the post from the posts array
    //which is inside the creator field of the user
    post.creator.posts.pull(post);

    //Save newly created user
    await post.creator.save({ session: sess });

    //Commit the transaction
    await sess.commitTransaction();

    //
  } catch (err) {
    const error = new HttpError("Could not delete post", 500);
    return next(error);
  }

  //If successful send a response
  res.status(200).json({ message: "Deleted post" });
};

//Export configured functions
exports.getPostById = getPostById;
exports.getPostsByUserId = getPostsByUserId;
exports.createPost = createPost;
exports.updatePost = updatePost;
exports.deletePost = deletePost;
