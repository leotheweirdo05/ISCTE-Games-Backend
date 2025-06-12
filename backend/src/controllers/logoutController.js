import {cookieOptions} from "../utils/cookieOptions.js";

// Logout endpoint to clear the cookie
export const logout = (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({status: "success", message: "Logged out"});
};
