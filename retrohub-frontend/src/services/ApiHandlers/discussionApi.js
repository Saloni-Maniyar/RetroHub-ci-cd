import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export const fetchDiscussionMessages = async (teamId, feedbackId, token) => {
  try {
    const res = await axios.get(
      `${API}/api/discussion/${teamId}/${feedbackId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;

  } catch (err) {
    console.error("Error fetching discussion messages:", err.response?.data?.message || err.message);
    throw err;
  }
};

export const sendDiscussionMessage = async (teamId, feedbackId, content, token) => {
  try {
    const res = await axios.post(
      `${API}/api/discussion/${teamId}/${feedbackId}`,
      { content },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;

  } catch (err) {
    console.error("Error sending discussion message:", err.response?.data?.message || err.message);
    throw err;
  }
};
