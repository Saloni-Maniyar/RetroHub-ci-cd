const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const crypto = require('node:crypto');
const sendVerificationEmail = require("../utils/sendVerificationEmail");
const TeamMemberShip = require("../models/TeamMembership");

const FRONTEND_PROD = process.env.FRONTEND_URL;        // e.g. https://2401125.imcc.com
const FRONTEND_LOCAL = process.env.FRONTEND_URL_LOCAL; // e.g. http://localhost:5173

// Helper: choose correct frontend URL
function getFrontendURL() {
  return FRONTEND_PROD || FRONTEND_LOCAL;
}

// ----------------------- REGISTER USER -----------------------
const registerUser = async (req, res) => {
  try {
    const { name, email, password, teamId } = req.body;
    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.status(400).json({ message: "User already exist" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = Date.now() + 30 * 60 * 1000;

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      tokenExpires,
    });

    // If signup is through invite link → auto verify
    if (teamId) {
      user.isVerified = true;
      await user.save();

      const alreadyMember = await TeamMemberShip.findOne({
        user: user._id,
        team: teamId,
      });

      if (!alreadyMember) {
        await TeamMemberShip.create({
          user: user._id,
          team: teamId,
          role: "member",
        });
      }

      return res.status(201).json({
        success: true,
        joinedTeam: true,
        message: "Signup successful! You are now part of the team.",
      });
    }

    await user.save();
    await sendVerificationEmail(user, verificationToken);

    return res.status(201).json({
      joinedTeam: false,
      message: "Signup successful! Please check your email to verify your account.",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


// ----------------------- EMAIL VERIFICATION -----------------------
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });

    const FRONTEND = getFrontendURL();

    if (!user) {
      return res.redirect(`${FRONTEND}/verify-failed`);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.redirect(`${FRONTEND}/verify-success`);

  } catch (err) {
    console.log(err);
    return res.redirect(`${FRONTEND}/verify-failed`);
  }
};


// ----------------------- LOGIN USER -----------------------
const loginUser = async (req, res) => {
  try {
    const { email, password, teamId } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User does not exist. Please signup" });
    if (!user.isVerified)
      return res.status(400).json({ message: "Please verify your email before logging in." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = generateToken(user);

    let joinedTeam = false;

    if (teamId) {
      const alreadyMember = await TeamMemberShip.findOne({
        user: user._id,
        team: teamId
      });

      if (!alreadyMember) {
        await TeamMemberShip.create({
          user: user._id,
          team: teamId,
          role: "member",
        });
        joinedTeam = true;
      }
    }

    return res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email },
      joinedTeam,
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


// ----------------------- RESEND VERIFICATION EMAIL -----------------------
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found. Please sign up." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified. Please log in." });
    }

    const newToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = newToken;
    user.tokenExpires = Date.now() + 30 * 60 * 1000;

    await user.save();
    await sendVerificationEmail(user, newToken);

    return res.status(200).json({ message: "Verification email resent successfully!" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to resend email", error: err.message });
  }
};


module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail
};
