// Sun Zihan, A0259581R
import React, { useState } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [answer, setAnswer] = useState("");
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const validate = () => {
    let tempErrors = {};
    
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email) {
      tempErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      tempErrors.email = "Please enter a valid email address (eg. name@example.com)";
    }

    if (!answer) tempErrors.answer = "Answer is required";
    
    if (!newPassword) {
      tempErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      tempErrors.newPassword = "Password must be at least 6 characters long";
    }

    if (newPassword !== confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const res = await axios.post("/api/v1/auth/forgot-password", {
        email,
        newPassword,
        answer,
      });
      if (res && res.data.success) {
        toast.success(res.data.message);
        navigate("/login");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Something went wrong";
      toast.error(errorMsg);
    }
  };

  return (
    <Layout title="Forgot Password - Ecommerce App">
      <div className="form-container" style={{ minHeight: "90vh" }}>
        <form onSubmit={handleSubmit} noValidate>
          <h4 className="title">RESET PASSWORD</h4>
          
          <div className="mb-3">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              placeholder="Enter your email"
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="mb-3">
            <input
              type="text"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                if (errors.answer) setErrors({ ...errors, answer: "" });
              }}
              className={`form-control ${errors.answer ? "is-invalid" : ""}`}
              placeholder="Enter your favorite sport"
            />
            {errors.answer && <div className="invalid-feedback">{errors.answer}</div>}
          </div>

          <div className="mb-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) setErrors({ ...errors, newPassword: "" });
              }}
              className={`form-control ${errors.newPassword ? "is-invalid" : ""}`}
              placeholder="Enter your new password"
            />
            {errors.newPassword && <div className="invalid-feedback">{errors.newPassword}</div>}
          </div>

          <div className="mb-3">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
              }}
              className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
              placeholder="Confirm your new password"
            />
            {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
          </div>

          <button type="submit" className="btn btn-primary">
            RESET
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default ForgotPassword;