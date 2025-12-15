import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

export async function joinTeam(teamId, email, token = null) {
  console.log("In joinTeam API");

  try {
    const headers = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const res = await axios.post(
      `${API}/api/join-team`,
      { teamId, email },
      { headers }
    );

    console.log("Response from backend (join team):", res);
    return res.data;

  } catch (err) {
    console.error("Error in joinTeam API:", err.response?.data?.message || err.message);
    return {
      success: false,
      message: err.response?.data?.message || "Error",
    };
  }
}
