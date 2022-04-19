//This file is responsible for configuring CRUD functionality around todolist items
//These functions are called in the routing files and interact with the database

//Imports
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

const Todolist = require("../models/todolist");
const User = require("../models/user");
const HttpError = require("../models/http-error");

//Function to retrieve todolist items by a given user id
//Async as database interactions are typically asynchronous
const getTDItemsByUserId = async (req, res, next) => {
  //get user id from request url
  const userId = req.params.uid;

  //Define items outside due to block scoping
  let usertdItems;

  try {
    //Find user items in database, passing userId as a parameter
    usertdItems = await Todolist.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(
      "Could not find todolist items with the provided user id"
    );
    return next(error);
  }

  //Check if a user has todolist items
  if (!usertdItems || usertdItems.length === 0) {
    const error = new HttpError(
      "Could not find todolist item for the provided user id",
      404
    );
    return next(error);
  }

  //Return found td items, converting them to a javascript object from a mongoose object
  //getters:true returns an id property with no _ before it
  //Map has to be used as find() returns an array
  res.json({
    usertdItems: usertdItems.map((item) => item.toObject({ getters: true })),
  });
};

//Function to create new todolist items
//Async as database interactions are typically asynchronous
const createTDItem = async (req, res, next) => {
  //Store validation result in a variable
  const errors = validationResult(req);

  //If errors, return error message
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs provided", 422));
  }

  //Gather data from the request body
  const { description, creator } = req.body;

  //Create a new todolist item based off of the todolist model
  //Passing values from the request body as parameters
  const createdTDItem = new Todolist({
    description: description,
    creator: creator,
  });

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

  //Attempt to save the new todolist item to the database, and save the todolist item id to the corresponding user
  //This save requires multiple independent operations to complete successfully,
  //if either fails then all operations need to be undone
  //This is achieved with sessions and transactions
  try {
    //create new session
    const sess = await mongoose.startSession();
    //start a new transaction
    sess.startTransaction();
    //attempt to save the item to the todolist item database, passing the session as a parameter
    await createdTDItem.save({ session: sess });

    //Push the created todolist item id to the todolist field of the user
    user.todolist.push(createdTDItem);

    //attempt to save this todolist item id to the user database, passing the session as a parameter
    await user.save({ session: sess });

    //Only at this point are the changes committed
    await sess.commitTransaction();
  } catch (err) {
    //forward error if this fails
    const error = new HttpError("Could not create item", 500);
    return next(error);
  }

  //Send back the created todolist item as a response
  res.status(201).json({ TDItem: createdTDItem });
};

//Function for deleting todolist items
//Async as database interactions are typically asynchronous
const deleteTDItem = async (req, res, next) => {
  //get todolist item id from the request url
  const TDItemId = req.params.lid;

  //Define item outside due to block scoping
  let item;

  try {
    //populate refers to a document stored in another collection, and to work with data in that existing document of the other collection\
    //Search for a item with the item id, and search for a user that has this item id
    //"creator" refers to this user id
    item = await Todolist.findById(TDItemId).populate("creator");
  } catch (err) {
    const error = new HttpError("Could not delete todolist item", 500);
    return next(error);
  }

  //Return error if no item is found
  if (!item) {
    const error = new HttpError("could not find item", 404);
    return next(error);
  }

  //Attempt to delete the todolist item from the database, and remove the todolist item id from the user
  //This requires multiple independent operations to complete successfully,
  //if either fails then all operations need to be undone
  //This is achieved with sessions and transactions
  try {
    //create new session
    const sess = await mongoose.startSession();

    //start a new transaction
    sess.startTransaction();

    //Remove item from todolist collection
    await item.remove({ session: sess });

    //Remove td item from the user by pulling the item from the todolist array
    //which is inside the creator field of the user
    item.creator.todolist.pull(item);

    //Save newly created user
    await item.creator.save({ session: sess });

    //Commit the transaction
    await sess.commitTransaction();

    //
  } catch (err) {
    const error = new HttpError("Could not delete todolist item", 500);
    return next(error);
  }

  //If successful send a response
  res.status(200).json({ message: "Deleted item" });
};

//Export configured functions
exports.getTDItemsByUserId = getTDItemsByUserId;
exports.createTDItem = createTDItem;
exports.deleteTDItem = deleteTDItem;
