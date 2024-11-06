const express=require("express");
const router=express.Router();
const {isLoggedIn,validateFeedback}=require("../middleware.js");
const homeController=require("../controllers/home.js");
const wrapAsync = require("../utils/wrapAsync.js");

router.get("/about",homeController.renderAboutPage);

router.get("/feedback",isLoggedIn,homeController.renderFeedbackForm);
router.post("/feedback",isLoggedIn,validateFeedback,wrapAsync(homeController.createFeedback));


   
 




module.exports=router;