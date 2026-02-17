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
    phone: "",
    address: "",
    DOB: "",
    answer: "",
  };

  const [formData, setFormData] = useState(initialState);
  const { name, email, password, phone, address, DOB, answer } = formData;

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // form function
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/v1/auth/register", formData);

      if (res && res.data.success) {
        toast.success(
          res.data.message || "Registered Successfully, please login",
        );

        setFormData(initialState);

        navigate("/login");
      } else {
        toast.error(res.data.message || "Something went wrong");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <Layout title="Register - Ecommerce App">
      <div className="form-container" style={{ minHeight: "90vh" }}>
        <form onSubmit={handleSubmit}>
          <h4 className="title">REGISTER FORM</h4>
          <div className="mb-3">
            <input
              type="text"
              name="name"
              value={name}
              onChange={handleChange}
              className="form-control"
              id="exampleInputName1"
              placeholder="Enter Your Name"
              required
              autoFocus
            />
          </div>
          <div className="mb-3">
            <input
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              className="form-control"
              id="exampleInputEmail1"
              placeholder="Enter Your Email "
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              name="password"
              value={password}
              onChange={handleChange}
              className="form-control"
              id="exampleInputPassword1"
              placeholder="Enter Your Password"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              name="phone"
              value={phone}
              onChange={handleChange}
              className="form-control"
              id="exampleInputPhone1"
              placeholder="Enter Your Phone"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              name="address"
              value={address}
              onChange={handleChange}
              className="form-control"
              id="exampleInputaddress1"
              placeholder="Enter Your Address"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="date"
              name="DOB"
              value={DOB}
              onChange={handleChange}
              className="form-control"
              id="exampleInputDOB1"
              placeholder="Enter Your DOB"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              name="answer"
              value={answer}
              onChange={handleChange}
              className="form-control"
              id="exampleInputanswer1"
              placeholder="What is Your Favorite sports"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            REGISTER
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Register;
