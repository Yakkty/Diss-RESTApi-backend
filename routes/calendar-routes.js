//Router configures routing relating to the calendar

//Imports
const express = require("express");

const { check } = require("express-validator");

const calendarControllers = require("../controllers/calendar-controllers");
const auth = require("../middleware/auth");

//Create a new router object
const router = express.Router();

//Configures get requests to /user/:uid, -> :uid is dynamic url parameter
//getCalendarItemsByUserId is then called
router.get("/user/:uid", calendarControllers.getCalendarItemsByUserId);

router.use(auth);

//Configures post requests to /, along with basic input validation checks
//createCalendarItem function is then called
router.post(
  "/",
  [
    check("title").not().isEmpty(),
    check("description").not().isEmpty(),
    check("date").not().isEmpty(),
    check("time").not().isEmpty(),
  ],
  calendarControllers.createCalendarItem
);

//Configures delete requests to /:cid, and calls the deleteCalendarItem function
router.delete("/:cid", calendarControllers.deleteCalendarItem);

//Export the configured router
module.exports = router;
