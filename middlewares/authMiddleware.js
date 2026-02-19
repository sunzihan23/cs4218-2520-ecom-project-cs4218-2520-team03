// Sun Zihan, A0259581R
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Protected routes token base
export const requireSignIn = async (req, res, next) => {
  try {
    // ensure header exists before verifying
    if (!req.headers.authorization) {
      return res.status(401).send({ success: false, message: "No token provided" });
    }

    const decode = JWT.verify(
      req.headers.authorization,
      process.env.JWT_SECRET
    );
    req.user = decode;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    // send a response so the request does not hang
    return res.status(401).send({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

//admin access
export const isAdmin = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);
    
    // check if user exists to prevent TypeError
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== 1) {
      return res.status(401).send({
        success: false,
        message: "UnAuthorized Access",
      });
    }
    
    next();
  } catch (error) {
    console.error("Admin Middleware Error:", error);
    res.status(500).send({ // corrected from 401 to 500 error
      success: false,
      error: error.message,
      message: "Error in admin middleware",
    });
  }
};