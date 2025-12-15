const Team = require("../models/Team");
const TeamMemberShip = require("../models/TeamMembership");
const transporter = require("../config/nodemailer");

// Load URLs from env
const FRONTEND_PROD = process.env.FRONTEND_URL;        // https://2401125.imcc.com
const FRONTEND_LOCAL = process.env.FRONTEND_URL_LOCAL; // http://localhost:5173

function frontendURL() {
  return FRONTEND_PROD || FRONTEND_LOCAL;
}

// ---------------------- CREATE TEAM ----------------------
const createTeam = async (req, res) => {
  try {
    const userid = req.user.id;
    const { team_name, description, team_type } = req.body;

    const team = await Team.create({
      team_name,
      team_type,
      description,
      created_by: userid
    });

    const teamMembership = await TeamMemberShip.create({
      user: userid,
      team: team._id,
      role: "manager",
      joined_date: Date.now()
    });

    return res.status(201).json({
      message: "Team created",
      team,
      teamMembership
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ---------------------- DELETE TEAM ----------------------
const deleteTeam = async (req, res) => {
  try {
    const userid = req.user.id;
    const { teamid } = req.params;

    const manager = await TeamMemberShip.findOne({
      role: "manager",
      user: userid,
      team: teamid
    });

    if (!manager) {
      return res.status(403).json({ message: "You are not authorized to delete this team" });
    }

    const deletedTeam = await Team.findByIdAndDelete(teamid);

    if (!deletedTeam) {
      return res.status(404).json({ message: "Team not found" });
    }

    const deletedMemberships = await TeamMemberShip.deleteMany({ team: teamid });

    return res.status(200).json({
      message: "Team and related memberships deleted successfully",
      deletedTeam,
      deletedMemberships
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ---------------------- FETCH TEAMS ----------------------
const fetchTeams = async (req, res) => {
  try {
    const userid = req.user.id;

    const memberships = await TeamMemberShip.find({ user: userid }).populate("team");

    const managedTeams = [];
    const participatedTeams = [];

    for (const membership of memberships) {
      const team = membership.team;
      if (!team) continue;

      const memberCount = await TeamMemberShip.countDocuments({ team: team._id });

      const teamWithCount = {
        ...team.toObject(),
        members_count: memberCount,
      };

      if (membership.role === "manager") {
        managedTeams.push(teamWithCount);
      } else {
        participatedTeams.push(teamWithCount);
      }
    }

    return res.status(200).json({
      message: "Fetched teams successfully",
      managedTeams,
      participatedTeams
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ---------------------- SEND INVITES ----------------------
const sendInvites = async (req, res) => {
  try {
    const { teamid } = req.params;
    const { emails } = req.body;

    if (!emails || !emails.length) {
      return res.status(400).json({ message: "No emails provided" });
    }

    const team = await Team.findById(teamid);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const FRONTEND = frontendURL();

    for (let email of emails) {
      const inviteLink = `${FRONTEND}/join-team/${teamid}?email=${email}`;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Team Invitation",
        html: `
          <p>You are invited to join the team <b>${team.team_name}</b>!</p>
          <p><a href="${inviteLink}">Click here to join the team</a></p>
        `,
      });
    }

    return res.json({ message: "Invitations sent successfully" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error sending invites" });
  }
};

module.exports = { createTeam, deleteTeam, fetchTeams, sendInvites };
