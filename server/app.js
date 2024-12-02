import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './Models/User.js';
import Post from './Models/Post.js';
import cors from 'cors';
import multer from 'multer';
import fetchUser from './middleware/fetchUser.js'; 6
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(express.json()); //it converts json data coming frontend into json objects
app.use(cors()); //allows data tranfer between different ports since default allows all header and orgins and mathods(post get delete , etc)

// MongoDB Connection
const db_url= process.env.DB_URL;
mongoose.connect(db_url)
    .then(() => console.log('MongoDB connection successful'))
    .catch(error => console.log(`MongoDB connection failed due to ${error}`));


// Signup Route
app.post('/signup', [

    // for valditaion of user input
    body('username', 'Enter a valid name').isLength({ min: 3 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be atleast 5 characters').isLength({ min: 5 })], async (req, res) => {

        // for authentication 
        let success = false;

        // it is used to display errors whose validation was failed by body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json({ success, message: 'Validation failed', errors: errors.array() });

        }

        // access from body
        const { username, email, password } = req.body;

        try {

            // checking if user already exist
            const existingUser = await User.findOne({ email });

            // then we ask them to login
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            // hashing pass if user is new
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({ username, email, password: hashedPassword });

            // saving into mongo
            await user.save();

            // authentication
            try {
                const data = { user: { id: user.id } };
                const authtoken = jwt.sign(data, JWT_SECRET);
                success = true;
                res.json({ success: success, authtoken: authtoken })

            } catch (error) {
                res.status(500).json({ message: 'Signup failed due to token generation', error: error.message });

            }

        } catch (error) {
            console.error("Signup error:", error);
            res.status(500).json({ message: JWT_SECRET, error: error.message });
        }
    });


// Login Route
app.post('/login', [
    body('username', 'Enter a valid name').isLength({ min: 3 }),

], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // getting from body
    const { username, password } = req.body;
    let success = false;

    try {

        // finding user
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Invalid  User credentials' });

        // checking pass with bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid Password ' });
        const data = {
            user: {
                id: user.id
            }
        }
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success: success, authtoken: authtoken })


    } catch (error) {
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/posts', fetchUser, upload.single('image'), async (req, res) => {

    // getting title and content
    const { title, content } = req.body;

    // getting image from frontend
    const imageFile = req.file;
    let success = false;

    // without three user cant post 
    if (!title || !content || !imageFile) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // converting image to string for saving into mongo
    let imageBase64 = null;
    if (imageFile) {
        imageBase64 = imageFile.buffer.toString('base64');
    }

    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(500).json({ message: 'Failed to create post', error: error.message });
    }

    else {
        success = true;
        try {
            const newPost = new Post({
                title,
                content,
                image: imageBase64,
                user: req.user.id

            });

            await newPost.save();
            // post saved in mongo

            res.status(201).json({ sucsess: success, message: 'Post created successfully', post: newPost });

        } catch (error) {
            console.error('Error creating post:', error);
            res.status(500).json({ message: 'Failed to create post', error: error.message }); en
        }
    }
});


// for getting post for home page from backend 
app.get('/posts', async (req, res) => {
    try {

        // section = a part of home page which consist 1-6 posts
        const section = parseInt(req.query.page) || 1;  // Default to page 1

        const limit = 6;  // Number of posts per page

        // skiping prev pages
        const skip = (section - 1) * limit;

        // fetching the number of total docs
        const totalPosts = await Post.countDocuments();

        // fetching data by skiping and limiting data
        const posts = await Post.find()
            // for reversing 
            .sort({ createdAt: -1 })
            // for skiping already loaded data
            .skip(skip)
            // for limiting to load only 6 
            .limit(limit);

        const postsWithUsernames = [];

        // Use a for...of(values inside array) loop to iterate through posts and fetch usernames sequentially
        for (let post of posts) {
            const user = await User.findById(post.user); // Fetch the user by userId
            postsWithUsernames.push({
                ...post.toObject(), // Convert the mongoose document to a plain object
                username: user ? user.username : 'Unknown' // Add the username to the post object
            });
        }

        res.status(200).json({ posts: postsWithUsernames, totalPosts: totalPosts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Failed to load posts', error: error.message });
    }
});

// for showing post details when clicked 
app.get('/posts/:postId', async (req, res) => {
    const { postId } = req.params;

    try {
        // Fetch the post from the database
        const post = await Post.findById(postId).populate('user', 'username');
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const originalImageUrl = `data:image/jpeg;base64,${post.image}` //  the image is stored as a base64 string

        // sending both the post and the originalImageUrl
        res.json({ post, likes: post.likes, originalImageUrl, isLiked: post.isLiked });

    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ message: 'Failed to fetch post', error: error.message });
    }
});


// for editting post
app.put('/posts/:postId', upload.single('image'), async (req, res) => {

    // from body
    const { title, content } = req.body;

    // from url
    const { postId } = req.params;

    let imageBase64 = null;

    // If an image is uploaded, convert it to base64
    if (req.file) {
        // buffers allow efficient handling of binary data directly in memory without converting it to other formats like strings or arrays
        // we converting buffer to string 
        imageBase64 = req.file.buffer.toString('base64');
    }

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.title = title || post.title;
        post.content = content || post.content;
        post.image = imageBase64 || post.image;

        // Save the updated post
        await post.save();

        res.status(200).json({ message: 'Post updated successfully', post });

    } catch (error) {
        res.status(500).json({ message: 'Failed to update post', error: error.message });
    }
});

// for deleting post
app.delete('/posts/:postId', async (req, res) => {
    const { postId } = req.params;// retriv from search bar
    try {
        // finding post in mongo
        const deletedPost = await Post.findByIdAndDelete(postId);

        if (!deletedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.status(200).json({ message: 'Post deleted successfully' });

    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// for rendering my posts in mypost page
app.post('/myposts', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id; // Authenticated user's ID from middleware

        // Fetch all posts created by the authenticated user
        const userPosts = await Post.find({ user: userId })

            // sortinf in desc to show latest post first
            .sort({ createdAt: -1 });

        if (!userPosts || userPosts.length === 0) {
            return res.status(404).json({ message: 'No posts found for this user' });
        }

        res.status(200).json({ message: 'User posts fetched successfully', posts: userPosts });
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ message: 'Failed to fetch user posts', error: error.message });
    }
});


// Add a Comment to a Post
app.post('/posts/comments/:postId', fetchUser, async (req, res) => {

    const { postId } = req.params;
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ message: 'Comment text is required' });
    }

    try {
        // Find the post by ID
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' })
        }

        // Find the authenticated user
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(403).json({ message: 'User not authorized to comment' });
        }

        // Add the comment (since the Schema for comment is array)
        post.comments.push({
            username: user.username, // Use the authenticated user's username
            text,
            createdAt: new Date()
        });

        await post.save();

        res.status(201).json({ message: 'Comment added successfully', comments: post.comments });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Failed to add comment', error: error.message });
    }
});

// DELETE Comment Route
app.delete('/posts/comments/:commentId', fetchUser, async (req, res) => {
    const { commentId } = req.params;
    try {
        // Find the post by its ID and remove the comment
        const post = await Post.findOneAndUpdate(
            { 'comments._id': commentId }, // Find post with the specific comment
            { $pull: { comments: { _id: commentId } } }, // since comments are array we use pull to remove elements from it
            { new: true } // Return the updated post
        );

        if (!post) {
            return res.status(404).json({ message: 'Post or comment not found' });
        }

        res.json({ message: 'Comment deleted successfully', post });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.post('/posts/like/:postId', fetchUser, async (req, res) => {

    const { postId } = req.params;
    const userId = req.user.id;
    try {

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.likedBy = post.likedBy ? post.likedBy.filter(Boolean) : [];
        // Check if the user has already liked the post
        // since likedby is array we can use includes to check if the user is already added in array or not

        if (post.likedBy && post.likedBy.includes(userId)) {
            // Unlike: Remove the user from likedBy array and decrement likes
            post.likedBy = post.likedBy.filter((id) => id.toString() !== userId);

            post.likes = Math.max(post.likes - 1, 0); // Prevent negative likes

        } else {
            // Like: Add the user to likedBy array and increment likes
            post.likedBy = post.likedBy || [];
            post.likedBy.push(userId);
            post.likes += 1;
        }

        // Save the post
        await post.save();

        res.status(200).json({ likes: post.likes, likedBy: post.likedBy });
    } catch (error) {
        console.error('Error updating likes:', error);
        res.status(500).json({ message: 'Error updating likes', error: error.message });
    }
});


// profile
const storage2 = multer.memoryStorage();
const upload2 = multer({ storage: storage2 });

app.post('/profile', fetchUser, upload2.single('profilePic'), async (req, res) => {
    try {
        // Fetch the user from the database
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get the image file from the request
        const imageFile = req.file;
        if (!imageFile) {
            return res.status(400).json({ message: "Profile picture is required" });
        }

        // Convert the image to Base64
        const imageBase64 = imageFile.buffer.toString('base64');

        // Update the user's profile picture
        user.profileImage = imageBase64; // Assume `profileImage` is a string field in the User model
        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            profileImage: user.profileImage,
        });

    } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ success: false, message: "Error uploading profile picture", error: error.message });
    }
});

app.get('/profile', fetchUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
app.put('/profile', fetchUser, upload.single('profilePic'), async (req, res) => {
    try {
        const { username, bio, socialLinks } = req.body;

        // Update profile image if exists
        let profileImage = req.body.profileImage;
        if (req.file) {
            profileImage = req.file.buffer.toString('base64'); // Convert to Base64
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { username, bio, socialLinks, profileImage },
            { new: true, runValidators: true }
        ).select('-password');

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// Route to get the total number of comments for all posts by the logged-in user
app.get('/api/user/comments', fetchUser, async (req, res) => {
    try {
        // Get the user ID from the verified token
        const userId = req.user.id; //  the fetchUser middleware adds the user to the request object
        console.log(userId);

        // Get all posts by the logged-in user
        const posts = await Post.find({ user: userId }); // Ensure to use 'user' field in Post schema for the reference

        // Calculate the total number of comments for all posts by the user
        let totalComments = 0;
        posts.forEach(post => {
            totalComments += post.comments.length; // Count the number of comments in each post
        });
        console.log(totalComments);

        res.status(200).json({ totalComments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Route to count total number of posts done by user

app.get('/api/user/posts', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(userId);

        const posts = await Post.find({ user: userId });
        let totalPosts = posts.length;
        console.log('total posts', totalPosts);

        res.json({ totalPosts });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });



    }

})

// Route to get recent 5 comments across all posts
app.get('/api/user/recent-comments', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(userId);


        // Find all posts of the logged-in user and retrieve the title and comments
        const posts = await Post.find({ user: userId }).select('title comments'); // Filter by the logged-in user's ID

        // Flatten all comments from all posts into a single array and include the post title
        const allComments = posts.flatMap(post =>
            post.comments.map(comment => ({
                postTitle: post.title,  // Include the post title with each comment
                username: comment.username,
                text: comment.text,
                createdAt: comment.createdAt
            }))
        );

        // Sort the comments by createdAt in descending order (latest first)
        const sortedComments = allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Get the first 5 comments (most recent)
        const recentComments = sortedComments.slice(0, 5);

        // Send the response with the most recent comments
        res.json(recentComments);
    } catch (error) {
        console.error('Error fetching recent comments:', error);
        res.status(500).json({ message: 'Failed to load recent comments' });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
