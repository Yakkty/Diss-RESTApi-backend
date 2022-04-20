//Router configures routing relating to posts

//Imports
const express = require("express");
const { check } = require("express-validator");

const fileUpload = require("../middleware/file-upload");
const postsController = require("../controllers/posts-controllers");
const auth = require("../middleware/auth");

//Create a new router object
const router = express.Router();

//Configures get requests to /:pid -> :pid is a dynamic url parameter
//This then calls the getPostById function from the posts controller file
router.get("/:pid", postsController.getPostById);

//Configures get requests to /user/:uid -> :uid is a dynamic url parameter
//This then calls the getPostsByUserId function from the posts controller file
router.get("/user/:uid", postsController.getPostsByUserId);

//Router for protecting post, patch and delete requests using the auth.js middleware
//Only authenticated users can send http requests to this rest api
router.use(auth);

//Configures post requests to /, along with basic input validation checks
//createPost function is then called
router.post(
  "/",
  fileUpload.single("image"),
  [check("title").not().isEmpty(), check("description").not().isEmpty()],
  postsController.createPost
);

//Configures patch requests to /:pid along with basic input validation checks
//Calls the updatePost function
router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").not().isEmpty()],
  postsController.updatePost
);

//Configures delete requests to /:pid, and calls the deletePost function
router.delete("/:pid", postsController.deletePost);

//Export the configured router
module.exports = router;
