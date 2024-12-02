import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from "react-hot-toast";

const Home = () => {

  // for adding new posts to existing posts
  const [posts, setPosts] = useState([]);

  // updating section after 6 posts have been loaded
  const [currentPage, setCurrentPage] = useState(1);

  // for loading button
  const [loading, setLoading] = useState(false);
  const [LoadMore, setLoadMore] = useState(false);

  // total posts count from backend
  const [totalPosts, setTotalPosts] = useState(0);

  const navigate = useNavigate();

  // Fetch posts on component mount or when the page changes
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {

        // fetching data from backend
        const response = await axios.get('https://blog-bliss-backend.onrender.com/posts', {
          params: { page: currentPage },
        });

        setPosts(prevPosts => {

          // inside prevPosts we are addind newPosts but before adding we are filtering
          // post => for all post inside fethced data
          // we check if they are same by ther ids 

          const newPosts = response.data.posts.filter(post =>
            !prevPosts.some(existingPost => existingPost._id === post._id)
          );

          // ... used ot spread the arrays and combine old and new array
          return [...prevPosts, ...newPosts];
        });

        // updating total number of post to totalPost
        setTotalPosts(response.data.totalPosts);

      } catch (err) {
        console.error('Error fetching posts:', err);
        toast.error('Failed to load posts');
      }
      finally {
        setLoading(false);  // Set loading to false once the fetch is complete
        setLoadMore(false)
      }
    };

    fetchPosts();
  }, [currentPage]); // Run this effect whenever currentPage changes

  // Navigate to the post details page
  const handlePostClick = (postId) => {
    navigate(`/posts/${postId}`);  // Navigate to the post details page
  };

  // Load more posts when the button is clicked
  const handleLoadMore = () => {
    setLoadMore(true)
    setCurrentPage(prevPage => prevPage + 1); // Increment the page number
  };

  // for rendering load more button
  const hasMorePosts = posts.length < totalPosts;
   return (
    <div className="container mb-3">
      <style>
        {`
       
          .post-card img {
            transition: transform 0.3s ease-in-out;
          }
          .post-card:hover img {
            transform: scale(1.01);
          }
        `}
      </style>
      <Toaster />
      <h3 className="text-center mt-3">All Posts</h3>

      <div className="row row-cols-lg-3 row-cols-md-2 row-cols-1 g-3" >
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <div key={post._id} className="card col post-card" >
              <img
                src={`data:image/jpeg;base64,${post.image}`}
                className="card-img-top"
                alt="post_image"
                style={{ height: '300px', cursor: 'pointer', objectFit: 'cover' }}
                onClick={() => handlePostClick(post._id)}
              />
              <div className="card-body" style={{ cursor: 'pointer' }} onClick={() => handlePostClick(post._id)}>
                <p className="card-text">
                  <b>{post.title}</b>
                  <br /> by {post.username}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="loader-container d-flex justify-content-center align-items-center">
            <div className="loader"></div>
          </div>
        )}
      </div>

      {LoadMore ? (
        <div className="loader-container d-flex justify-content-center align-items-center">
          <div className="loader"></div>
        </div>
      ) : (
        hasMorePosts && (
          <div className="d-flex justify-content-center mt-3">
            <button onClick={handleLoadMore} className="btn btn-primary add-btn">
              Load More
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default Home;
