// Sun Zihan, A0259581R
import React, { useState } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";
import { useAuth } from "../../context/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useAuth();
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    let tempErrors = {};
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!email) {
      tempErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      tempErrors.email = "Please enter a valid email address (eg. name@example.com)";
    }

    if (!password) {
      tempErrors.password = "Password is required";
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      const res = await axios.post("/api/v1/auth/login", { email, password });
      
      if (res && res.data.success) {
        toast.success(res.data.message || "Login successful");
        setAuth({
          ...auth,
          user: res.data.user,
          token: res.data.token,
        });
        localStorage.setItem("auth", JSON.stringify(res.data));
        navigate(location.state || "/");
      } else {
        toast.error(res.data.message || "Login failed");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Something went wrong";
      toast.error(errorMsg);
    }
  };

  return (
    <Layout title="Login - Ecommerce App">
      <div className="form-container" style={{ minHeight: "90vh" }}>
        <form onSubmit={handleSubmit} noValidate>
          <h4 className="title">LOGIN FORM</h4>
          
          <div className="mb-3">
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              placeholder="Enter your email"
              required
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="mb-3">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: "" });
              }}
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              placeholder="Enter your password"
              required
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          <div className="mb-3">
            <button
              type="button"
              className="btn forgot-btn"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password
            </button>
          </div>

          <button type="submit" className="btn btn-primary">
            LOGIN
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Login;