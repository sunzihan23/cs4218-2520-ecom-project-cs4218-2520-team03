import userModel from "../models/userModel.js";
import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";

// Sun Zihan, A0259581R
export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = req.body;

    if (!name || !email || !password || !phone || !address || !answer) {
      return res.status(400).send({ success: false, message: "Missing required registration details" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).send({
        success: false,
        message: "Email already registered, please login",
      });
    }

    const hashedPassword = await hashPassword(password);
    const user = await new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      answer,
    }).save();

    return res.status(201).send({
      success: true,
      message: "Registration successful, please login",
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(`Register Error: ${error.message}`);
    return res.status(500).send({ success: false, message: "Internal server error during registration" });
  }
};

// Sun Zihan, A0259581R
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({ success: false, message: "Email and password are required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).send({ success: false, message: "Invalid email or password" });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).send({ success: false, message: "Invalid email or password" });
    }

    const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).send({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error(`Login Error: ${error.message}`);
    return res.status(500).send({ success: false, message: "Internal server error during login" });
  }
};

// Sun Zihan, A0259581R
export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;

    if (!email || !answer || !newPassword) {
      return res.status(400).send({ success: false, message: "Missing required fields for password reset" });
    }

    const user = await userModel.findOne({ email, answer });
    if (!user) {
      return res.status(404).send({ success: false, message: "Incorrect email or security answer" });
    }

    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });

    return res.status(200).send({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error(`Forgot Password Error: ${error.message}`);
    return res.status(500).send({ success: false, message: "Internal server error during password reset" });
  }
};

// Sun Zihan, A0259581R
export const testController = (req, res) => {
  try {
    return res.status(200).send({
      success: true,
      message: "Protected route accessed",
    });
  } catch (error) {
    console.error(`Test Error: ${error.message}`);
    if (!res.headersSent) {
      return res.status(500).send({ success: false, message: "Server error" });
    }
  }
};

//update prfole
export const updateProfileController = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    const user = await userModel.findById(req.user._id);
    //password
    if (password && password.length < 6) {
      return res.json({ error: "Passsword is required and should be 6 characters long" });
    }
    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: name || user.name,
        password: hashedPassword || user.password,
        phone: phone || user.phone,
        address: address || user.address,
      },
      { new: true },
    );
    res.status(200).send({
      success: true,
      message: "Profile updated successfully",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error while updating profile",
      error,
    });
  }
};

//orders
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting orders",
      error,
    });
  }
};
//orders
export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: "-1" });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting orders",
      error,
    });
  }
};

//order status
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true },
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while updating orders",
      error,
    });
  }
};
