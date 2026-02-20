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

  // Client-side validation
  const validate = () => {
    let tempErrors = {};
    
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      tempErrors.email = "Please enter a valid email address";
    }

    if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters long";
    }

    if (password !== confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }

    const phoneRegex = /^\d{8}$/;
    if (!phoneRegex.test(phone)) {
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
    
    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      // Exclude confirmPassword from the API payload
      const { confirmPassword: _unused, ...dataToSend } = formData;
      const res = await axios.post("/api/v1/auth/register", dataToSend);

      if (res && res.data.success) {
        toast.success(res.data.message || "Registered Successfully");
        setFormData(initialState);
        navigate("/login");
      } else {
        toast.error(res.data.message || "Something went wrong");
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
            <input type="text" name="name" value={name} onChange={handleChange} className="form-control" id="name" placeholder="Enter your name" required autoFocus />
          </div>

          <div className="mb-3">
            <input type="email" name="email" value={email} onChange={handleChange} className={`form-control ${errors.email ? "is-invalid" : ""}`} id="email" placeholder="Enter your email" required />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="mb-3">
            <input type="password" name="password" value={password} onChange={handleChange} className={`form-control ${errors.password ? "is-invalid" : ""}`} id="password" placeholder="Enter your password" required />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          <div className="mb-3">
            <input type="password" name="confirmPassword" value={confirmPassword} onChange={handleChange} className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`} id="confirmPassword" placeholder="Confirm your password" required />
            {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
          </div>

          <div className="mb-3">
            <input type="text" name="phone" value={phone} onChange={handleChange} className={`form-control ${errors.phone ? "is-invalid" : ""}`} id="phone" placeholder="Enter your phone" required />
            {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
          </div>

          <div className="mb-3">
            <input type="text" name="address" value={address} onChange={handleChange} className="form-control" id="address" placeholder="Enter your address" required />
          </div>

          <div className="mb-3">
            <input type="text" name="answer" value={answer} onChange={handleChange} className="form-control" id="answer" placeholder="What is your favorite sport?" required />
          </div>

          <button type="submit" className="btn btn-primary">REGISTER</button>
        </form>
      </div>
    </Layout>
  );
};

export default Register;