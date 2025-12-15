import axios from "axios";

const API = import.meta.env.VITE_API_URL;

// Fetch all feedback for a team
export const fetchFeedback = async (teamId, token) => {
  try {
    const res = await axios.get(
      `${API}/api/feedback/${teamId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;

  } catch (error) {
    console.error("Error fetching feedback:", error.response?.data?.message || error.message);
    throw error;
  }
};

// Add new feedback
export const addFeedback = async (feedbackData, token) => {
  try {
    const res = await axios.post(
      `${API}/api/feedback`,
      feedbackData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;

  } catch (error) {
    console.error("Error adding feedback:", error.response?.data?.message || error.message);
    throw error;
  }
};
