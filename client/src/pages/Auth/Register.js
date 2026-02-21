// Sun Zihan, A0259581R
import React, { useState } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";

const Register = () => {
  const initialState = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    answer: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const { name, email, password, confirmPassword, phone, address, answer } = formData;

  const navigate = useNavigate();

  const validate = () => {
    let tempErrors = {};

    if (!name.trim()) tempErrors.name = "Name is required";
    if (!address.trim()) tempErrors.address = "Address is required";
    if (!answer.trim()) tempErrors.answer = "Answer is required";

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email) {
      tempErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      tempErrors.email = "Please enter a valid email address (eg. name@example.com)";
    }

    if (!password) {
      tempErrors.password = "Password is required";
    } else if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters long";
    }

    if (password !== confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }

    const phoneRegex = /^\d+$/; 
    if (!phone) {
      tempErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(phone)) {
      tempErrors.phone = "Phone number must contain only digits";
    } else if (phone.length !== 8) {
      tempErrors.phone = "Phone number must be 8 digits long";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const { confirmPassword: _unused, ...dataToSend } = formData;
      const res = await axios.post("/api/v1/auth/register", dataToSend);

      if (res && res.data.success) {
        toast.success(res.data.message || "Registration successful, please login");
        setFormData(initialState);
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
    <Layout title="Register - Ecommerce App">
      <div className="form-container" style={{ minHeight: "90vh" }}>
        <form onSubmit={handleSubmit} noValidate>
          <h4 className="title">REGISTER FORM</h4>

          <div className="mb-3">
            <input type="text" name="name" value={name} onChange={handleChange} className={`form-control ${errors.name ? "is-invalid" : ""}`} placeholder="Enter your name" autoFocus />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>

          <div className="mb-3">
            <input type="email" name="email" value={email} onChange={handleChange} className={`form-control ${errors.email ? "is-invalid" : ""}`} placeholder="Enter your email" />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="mb-3">
            <input type="password" name="password" value={password} onChange={handleChange} className={`form-control ${errors.password ? "is-invalid" : ""}`} placeholder="Enter your password" />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          <div className="mb-3">
            <input type="password" name="confirmPassword" value={confirmPassword} onChange={handleChange} className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`} placeholder="Confirm your password" />
            {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
          </div>

          <div className="mb-3">
            <input type="text" name="phone" value={phone} onChange={handleChange} className={`form-control ${errors.phone ? "is-invalid" : ""}`} placeholder="Enter your phone" />
            {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
          </div>

          <div className="mb-3">
            <input type="text" name="address" value={address} onChange={handleChange} className={`form-control ${errors.address ? "is-invalid" : ""}`} placeholder="Enter your address" />
            {errors.address && <div className="invalid-feedback">{errors.address}</div>}
          </div>

          <div className="mb-3">
            <input type="text" name="answer" value={answer} onChange={handleChange} className={`form-control ${errors.answer ? "is-invalid" : ""}`} placeholder="Enter your favorite sport" />
            {errors.answer && <div className="invalid-feedback">{errors.answer}</div>}
          </div>

          <button type="submit" className="btn btn-primary">REGISTER</button>
        </form>
      </div>
    </Layout>
  );
};

export default Register;