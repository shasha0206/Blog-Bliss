const Joi = require('joi');

module.exports.postSchema=Joi.object({
    post: Joi.object({
        title: Joi.string().required(),
        content: Joi.string().required(),
        image: Joi.string().allow("",null),
        tags: Joi.array().items(Joi.string().min(1)),
        createdAt: Joi.date().default(() => new Date()),
        updatedAt: Joi.date().default(() => new Date()),


    }).required()
});

module.exports.reviewSchema=Joi.object({
    review: Joi.object({
        rating:Joi.number().required().min(1).max(5),
        comment: Joi.string().required()
    }).required()
});

module.exports.feedbackSchema=Joi.object({
   
    name: Joi.string().min(3).max(30).required(),
    mobileNumber: Joi.string().pattern(/^[0-9]+$/).required(),
    email: Joi.string().email().required(),
    message: Joi.string().min(4).max(1000).required(),
    createdAt: Joi.date().default(() => new Date()) 
    
    
});