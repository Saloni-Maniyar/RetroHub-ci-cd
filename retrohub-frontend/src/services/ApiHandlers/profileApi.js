import axios from "axios";

const API = import.meta.env.VITE_API_URL;

// 🔑 Always read latest token (not once on file load)
function getAuthHeader() {
  const token = sessionStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getProfileApi() {
  const res = await axios.get(`${API}/api/profile`, {
    headers: getAuthHeader(),
  });
  return res.data;
}

export async function updateProfileApi({ name, email }) {
  const res = await axios.put(
    `${API}/api/profile`,
    { name, email },
    { headers: getAuthHeader() }
  );
  return res.data;
}

export async function changePasswordApi({ oldPassword, newPassword }) {
  const res = await axios.put(
    `${API}/api/change-password`,
    { oldPassword, newPassword },
    { headers: getAuthHeader() }
  );
  return res.data;
}

export async function forgotPasswordApi({ email }) {
  const res = await axios.post(`${API}/api/forgot-password`, { email });
  return res.data;
}

export async function resetPasswordApi({ token, newPassword }) {
  const res = await axios.post(
    `${API}/api/reset-password/${token}`,
    { newPassword }
  );
  return res.data;
}
