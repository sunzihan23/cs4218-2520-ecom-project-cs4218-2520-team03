// Sun Zihan, A0259581R

import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
  try {
    const saltRounds = 10;
    // explicitly check for valid input to prevent bcrypt from hanging
    if (!password) {
      return null;
    }
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error("Error hashing password:", error);
    return null;
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    // basic validation to avoid unnecessary bcrypt execution
    if (!password || !hashedPassword) {
      return false;
    }
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
};