import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

export async function loginApi({ email, password, teamId }) {
  console.log('In loginApi function');
  console.log("teamId in loginApi:", teamId);

  try {
    console.log("Trying to log in...");

    const res = await axios.post(`${API}/api/auth/login`, {
      email,
      password,
      teamId,
    });

    console.log("Login response:", res);

    const { token, user } = res.data;

    // Store JWT token in sessionStorage
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));

    return res.data;

  } catch (err) {
    console.log("Error in login:", err.response?.data?.message || err.message);
    throw err;
  }
}
