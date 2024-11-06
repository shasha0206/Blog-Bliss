//Logic for database initialisation
const mongoose=require("mongoose");
const initData=require("./data.js");
const Post=require("../models/post.js");

main()
.then(()=>{
    console.log("connected to DB.");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/blogbliss');
}

const initDB=async ()=>{
   await  Post.deleteMany({});
   initData.data=initData.data.map((obj)=>({...obj,owner:'671c8b5719e93445e52a7650'}));//,owner: "67065d02176bb304f79adba5"
   await Post.insertMany(initData.data);
   console.log("data was initialised.");
};
initDB();