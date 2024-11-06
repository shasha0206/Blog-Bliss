const Feedback=require('../models/feedback');

module.exports.renderAboutPage=(req,res)=>{
    res.render("./home/about.ejs");
};

module.exports.renderFeedbackForm=(req,res)=>{
    res.render("./home/feedback.ejs");
};

module.exports.createFeedback=async(req,res,next)=>{
    const feedback = new Feedback({
        name: req.body.name,
        mobileNumber: req.body.mobileNumber,
        email: req.body.email,
        message: req.body.message,
    });


    await feedback.save();
    req.flash("success","Thanks for your feedback!");
    res.redirect("/feedback");

};