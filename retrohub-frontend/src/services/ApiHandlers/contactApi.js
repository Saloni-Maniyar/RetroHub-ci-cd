// contactApi.js
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export async function submitContactApi({ name, email, message }) {
  try {
    const token = sessionStorage.getItem("token");

    const res = await axios.post(
      `${API}/api/contact`,
      { name, email, message },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );

    console.log("Contact form submitted:", res.data);
    return res.data;

  } catch (err) {
    console.log("Contact form error:", err.response?.data?.message || err.message);
    throw err;
  }
}
