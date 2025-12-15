import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

export async function fetchTeam() {
  console.log("In fetchTeam:");

  try {
    const token = sessionStorage.getItem("token");

    const res = await axios.get(
      `${API}/api/team`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("res:", res);
    console.log("res.data:", res.data);

    const { managedTeams, participatedTeams } = res.data;
    return { managedTeams, participatedTeams };

  } catch (err) {
    console.log("Error Fetching team:", err.response?.data?.message || err.message);
    throw err;
  }
}
