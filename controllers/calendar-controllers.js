//This file is responsible for configuring CRUD functionality around calendar items
//These functions are called in the routing files and interact with the database

//Imports
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

const Calendar = require("../models/calendar");
const User = require("../models/user");
const HttpError = require("../models/http-error");

//Function to retrieve calendar items by a given user id
const getCalendarItemsByUserId = async (req, res, next) => {
  //get user id from the request url
  const userId = req.params.uid;

  //Define calendar items outside due to block scoping
  let userCalendarItems;

  try {
    //Find user items in database, passing userId as a parameter
    userCalendarItems = await Calendar.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(
      "Could not find calendar items for the provided user id",
      500
    );
    return next(error);
  }

  //Check if a user has calendar items
  if (!userCalendarItems || userCalendarItems.length === 0) {
    const error = new HttpError(
      "Could not find calendar item for the provided user id",
      404
    );
    return next(error);
  }

  //Return found calendar items, converting them to a javascript object from a mongoose object
  //getters:true returns an id property with no _ before it
  //Map has to be used as find() returns an array
  res.json({
    userCalendarItems: userCalendarItems.map((item) =>
      item.toObject({ getters: true })
    ),
  });
};

//Function to create new calendar items
//Async as database interactions are typically asynchronous
const createCalendarItem = async (req, res, next) => {
  //Store validation result in a variable
  const errors = validationResult(req);

  //If errors, return error message
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs provided", 422));
  }

  //Gather data from the request body
  const { title, description, date, time, creator } = req.body;

  //Create new calendar item based off of the calendar model
  //Passing values from the request body as parameters
  const createdCalendarItem = new Calendar({
    title: title,
    description: description,
    date: date,
    time: time,
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

  //Attempt to save the new calendar item to the database, and save the calendar item id to the corresponding user
  //This save requires multiple independent operations to complete successfully,
  //if either fails then all operations need to be undone
  //This is achieved with sessions and transactions
  try {
    //create new session
    const sess = await mongoose.startSession();
    //start a new transaction
    sess.startTransaction();
    //attempt to save the item to the calendar item database, passing the session as a parameter
    await createdCalendarItem.save({ session: sess });

    //Push the created calendar item id to the calendar field of the user
    user.calendar.push(createdCalendarItem);

    //attempt to save this calendar item id to the user database, passing the session as a parameter
    await user.save({ session: sess, validateModifiedOnly: true });

    //Only at this point are the changes committed
    await sess.commitTransaction();
  } catch (err) {
    //forward error if this fails
    const error = new HttpError("Could not create calendar item", 500);
    return next(error);
  }

  //send the created calendar item as a response
  res.status(201).json({ CalendarItem: createdCalendarItem });
};

//Function for deleting calendar items
//Async as database interactions are typically asynchronous
const deleteCalendarItem = async (req, res, next) => {
  //Get access to the calendar id from the request url parameters
  const calendarId = req.params.cid;

  //Define item outside due to block scoping
  let item;

  try {
    //populate refers to a document stored in another collection, and to work with data in that existing document of the other collection\
    //Search for a item with the item id, and search for a user that has this item id
    //"creator" refers to this user id
    item = await Calendar.findById(calendarId).populate("creator");
  } catch (err) {
    const error = new HttpError("Could not delete item", 500);
    return next(error);
  }

  //Check if no item exists
  if (!item) {
    const error = new HttpError("could not find item", 404);
    return next(error);
  }

  //Attempt to delete the calendar item from the database, and remove the item id from the user
  //This requires multiple independent operations to complete successfully,
  //if either fails then all operations need to be undone
  //This is achieved with sessions and transactions
  try {
    //create a new session
    const sess = await mongoose.startSession();

    //start a new transaction
    sess.startTransaction();

    //Remove item from the calendar collection
    await item.remove({ session: sess });

    //Remove item from the user by pulling the item from the calendar array
    //which is inside the creator field of the user
    item.creator.calendar.pull(item);

    //Save newly created user
    await item.creator.save({ session: sess });

    //Commit the transaction
    await sess.commitTransaction();

    //
  } catch (err) {
    const error = new HttpError("Could not delete item", 500);
    return next(error);
  }

  //Send response if successful
  res.status(200).json({ message: "Deleted calendar item" });
};

//Export configured functions
exports.getCalendarItemsByUserId = getCalendarItemsByUserId;
exports.createCalendarItem = createCalendarItem;
exports.deleteCalendarItem = deleteCalendarItem;
