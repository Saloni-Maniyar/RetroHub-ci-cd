import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

export async function SignupApi({ name, email, password, teamId }) {
  console.log("In SignupApi function");
  console.log("Api is ",API);

  try {
    const res = await axios.post(`${API}/api/auth/signup`, {
      name,
      email,
      password,
      teamId,
    });

    console.log("Signup success:", res.data);
    return res.data;

  } catch (err) {
    console.error(
      "Error signing up:",
      err.response?.data?.message || err.message
    );
    throw err;
  }
}
