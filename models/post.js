const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const Review=require("./review.js");

const postSchema=new Schema({
    title: {
        type:String,
        required: true,
    },
    content: String,
    image: {      
        url: String,
        filename: String,
       
    },
    reviews:[
        {
            type: Schema.Types.ObjectId,
            ref: "Review"

        }
    ],
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    
    
},{ timestamps: true });



postSchema.post("findOneAndDelete",async(post)=>{

    if(post){
        await Review.deleteMany({_id: {$in: post.reviews }});

    }
});

const Post=mongoose.model("Post",postSchema);
module.exports=Post;