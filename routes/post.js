const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js");
const Post=require("../models/post.js");
const {isLoggedIn,isOwner,validatePost}=require("../middleware.js");

const postController=require("../controllers/posts.js");

const multer  = require('multer');
const {storage}=require("../cloudConfig.js");
const upload = multer({ storage });


//Index Route& Create route
router.route("/")
   .get(wrapAsync(postController.index))
   .post(isLoggedIn,upload.single('post[image]'),validatePost,wrapAsync(postController.createPost));


 //New Route
 
 router.get("/new",isLoggedIn,postController.renderNewForm);


//Show Route(For R in CRUD), //Update Route, //Delete Route   
router.route("/:id")
    .get(wrapAsync(postController.showPost))
    .put(isLoggedIn,isOwner,upload.single("post[image]"),validatePost,wrapAsync(postController.updatePost))
    .delete(isLoggedIn,isOwner,wrapAsync(postController.destroyPost));


 //Edit Route
router.get("/:id/edit",isLoggedIn,isOwner,wrapAsync(postController.renderEditForm));
 


 module.exports=router;