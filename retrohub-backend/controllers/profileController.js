const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const transporter = require("../config/nodemailer");

// Load URLs from env
const FRONTEND_PROD = process.env.FRONTEND_URL;        // e.g., https://2401125.imcc.com
const FRONTEND_LOCAL = process.env.FRONTEND_URL_LOCAL; // e.g., http://localhost:5173

// Helper function to pick correct frontend URL
function frontendURL() {
  return FRONTEND_PROD || FRONTEND_LOCAL;
}

// 1. GET PROFILE
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("name email created_at");

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 2. UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();

    return res.status(200).json({ success: true, message: "Profile updated!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 3. CHANGE PASSWORD
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 4. FORGOT PASSWORD (SEND EMAIL)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "No account with this email." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.resetToken = resetToken;
    user.resetExpires = resetExpires;
    await user.save();

    // Build reset link from env
    const FRONTEND = frontendURL();
    const resetURL = `${FRONTEND}/reset-password/${resetToken}`;

    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset",
      html: `
        <p>You requested a password reset.</p>
        <a href="${resetURL}">Click here to reset password</a>
        <p>This link is valid for 15 minutes.</p>
      `,
    });

    return res.status(200).json({ message: "Reset email sent!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 5. RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetExpires = undefined;

    await user.save();

    return res.status(200).json({ message: "Password reset successful!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
