//Router configures routing relating to the to do list

//Imports
const express = require("express");

const { check } = require("express-validator");

const tdControllers = require("../controllers/td-controllers");
const auth = require("../middleware/auth");

//Create a new router object
const router = express.Router();

//Configures get requests to /user/:uid -> :uid is a dynamic url parameter
//This then calls the getTDItemsByUserId function from the td controllers file
router.get("/user/:uid", tdControllers.getTDItemsByUserId);

router.use(auth);

//Configures post requests to /, along with checking for basic input validation
//createTDItem is then called from the td controllers file
router.post(
  "/",
  check("description").not().isEmpty(),
  tdControllers.createTDItem
);

//Configures delete requests to /:lid and calls the deleteTDItem function
router.delete("/:lid", tdControllers.deleteTDItem);

//Export the configured router
module.exports = router;
