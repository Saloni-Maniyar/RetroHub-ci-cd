import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export async function resendVerificationApi({ email }) {
  const res = await axios.post(`${API}/api/auth/resend-verification`, { email });
  return res.data;
}
