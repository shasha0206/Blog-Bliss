const Post=require("../models/post");

module.exports.index=async (req,res)=>{
    const allPosts = await Post.find({}).populate("owner","username");
    res.render("./posts/index.ejs",{ allPosts});
        
};

module.exports.renderNewForm=(req,res)=>{
    console.log(req.user);
   
     res.render("./posts/new.ejs");
 
};



module.exports.showPost=async (req,res)=>{
    let {id} =req.params;
    const post= await Post.findById(id).populate({path:"reviews",populate:{ 
        path:"author",
        }
     
    }).populate("owner");
    if(!post){
       req.flash("error","Post you are trying to access does not exist!");
       res.redirect("/posts");
    }
    console.log(post);
    res.render("./posts/show.ejs",{post});
};


module.exports.createPost=async (req,res,next)=>{
    let url=req.file.path;
    let filename=req.file.filename;

    const newPost=new Post(req.body.post);
    newPost.owner= req.user._id;
    newPost.image={url,filename};
    await newPost.save();
    req.flash("success","New Post Created!");
    res.redirect("/posts");

};

module.exports.renderEditForm=async (req,res)=>{
    let {id}=req.params;
    const post=await Post.findById(id);
    if(!post){
       req.flash("error","Post you are trying to access does not exist!");
       res.redirect("/posts");
    }
    let originalImageUrl=post.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");
    res.render("./posts/edit.ejs",{post , originalImageUrl});
};

module.exports.updatePost=async (req,res)=>{
     
    let {id}=req.params;
    let post=await Post.findByIdAndUpdate(id,{...req.body.post});
    if(typeof req.file!=="undefined"){
        let url=req.file.path;
        let filename=req.file.filename;
        post.image={url,filename};
    
        await post.save();
    }
 
    req.flash("success","Post Edited!");
    res.redirect(`/posts/${id}`);
};

module.exports.destroyPost=async (req,res)=>{
    let {id}=req.params;
    let deletedPost=await Post.findByIdAndDelete(id);
    console.log(deletedPost);
    req.flash("success","Post deleted!");
    res.redirect("/posts");
};

