import React, { useState, useEffect } from 'react';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from "react-hot-toast";

const Editor = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    // using since we uploading form data is easier than manual 
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (image) {
      formData.append('image', image);
    }


    try {
      const response = await axios.post('https://blog-bliss-backend.onrender.com/posts', formData, {
        headers: {
          // including both text data and binary data
          'Content-Type': 'multipart/form-data',
          'auth-token': localStorage.getItem('token'),
        },
      });

      // Success toast
      toast.success(response.data.message);

      // .5 secs delaye
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err) {
      console.error('Error creating post:', err.response || err); // Log any error from the backend
      toast.error('Error creating post');
    }
  };

  useEffect(() => {
    let isLoggedIn = localStorage.getItem('isLoggedIn') === "true";
    if (!isLoggedIn) {
        localStorage.setItem('addpostsrm', 'You must be logged in to post.');
        navigate('/signin');
    }
}, []); 
  return (
    <div className="col-8 offset-2 mt-3 mb-3">
      {/* Used to render success and error messages in frontend */}
      <Toaster />
      <h3>Upload a New Post</h3>
      <form onSubmit={handleSubmit} novalidate className="needs-validation" enctype="multipart/form-data">
        <div className="mb-3">
          <label htmlFor="title" className="form-label">Title</label>
          <input
            type="text"
            name="post[title]"
            placeholder="Add a catchy title"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="content" className="form-label">Content</label>
          <textarea
            name="post[content]"
            className="form-control"
            rows="8"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
          <div class="invalid-feedback">Please input some content to post</div>
        </div>

        <div className="mb-3">
          <label htmlFor="image" className="form-label">Upload Image</label>
          <input
            type="file"
            name="post[image]"
            className="form-control"
            onChange={(e) => setImage(e.target.files[0])}
            required
          />
        </div>

        <button className="btn btn-dark add-btn" type="submit">Add</button>
      </form>

      {/* Generate with AI Button */}
      <div className="mt-4">
        <button
          className="btn btn-info submit-btn"
          onClick={() => navigate('/generate-ai')}
        >
          Generate with AI
        </button>
      </div>

      {message && <p>{message}</p>}
    </div>
  );
};

export default Editor;
