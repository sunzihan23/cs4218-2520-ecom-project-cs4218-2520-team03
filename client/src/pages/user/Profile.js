// Sun Zihan, A0259581R
import React, { useState, useEffect } from "react";
import UserMenu from "../../components/UserMenu";
import Layout from "./../../components/Layout";
import { useAuth } from "../../context/auth";
import toast from "react-hot-toast";
import axios from "axios";

const Profile = () => {
  const [auth, setAuth] = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState({});

  const { name, email, password, confirmPassword, phone, address } = formData;

  useEffect(() => {
    if (auth?.user) {
      const { email, name, phone, address } = auth.user;
      setFormData((prev) => ({
        ...prev,
        name: name || "",
        email: email || "",
        phone: phone || "",
        address: address || "",
      }));
    }
  }, [auth?.user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validate = () => {
    let tempErrors = {};
    if (!name.trim()) tempErrors.name = "Name is required";
    if (!address.trim()) tempErrors.address = "Address is required";
    
    const phoneRegex = /^\d+$/; 
    if (!phone) {
      tempErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(phone) || phone.length !== 8) {
      tempErrors.phone = phoneRegex.test(phone) 
        ? "Phone number must be 8 digits long" 
        : "Phone number must contain only digits";
    }
  
    if (password) {
      if (password.length < 6) tempErrors.password = "Password must be at least 6 characters long";
      if (password !== confirmPassword) tempErrors.confirmPassword = "Passwords do not match";
    }
  
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const profileData = { name, email, phone, address };
      if (password?.trim()) profileData.password = password;

      const { data } = await axios.put("/api/v1/auth/profile", profileData);

      if (data?.error) {
        toast.error(data.error);
      } else {
        const updatedUser = data?.updatedUser;
        setAuth({ ...auth, user: updatedUser });

        let ls = JSON.parse(localStorage.getItem("auth"));
        if (ls) {
          ls.user = updatedUser;
          localStorage.setItem("auth", JSON.stringify(ls));
        }

        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <Layout title={"Your Profile"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3"><UserMenu /></div>
          <div className="col-md-9">
            <div className="form-container">
              <form onSubmit={handleSubmit} noValidate>
                <h4 className="title">USER PROFILE</h4>
                
                {[
                  { name: "name", type: "text", placeholder: "Enter your name", val: name },
                  { name: "email", type: "email", placeholder: "Enter your email", val: email, disabled: true },
                  { name: "password", type: "password", placeholder: "Enter your new password", val: password },
                  { name: "confirmPassword", type: "password", placeholder: "Confirm your new password", val: confirmPassword },
                  { name: "phone", type: "text", placeholder: "Enter your phone", val: phone },
                  { name: "address", type: "text", placeholder: "Enter your address", val: address },
                ].map((field) => (
                  <div className="mb-3" key={field.name}>
                    <input
                      type={field.type}
                      name={field.name}
                      value={field.val}
                      onChange={handleChange}
                      className={`form-control ${errors[field.name] ? "is-invalid" : ""}`}
                      placeholder={field.placeholder}
                      disabled={field.disabled}
                    />
                    {errors[field.name] && <div className="invalid-feedback">{errors[field.name]}</div>}
                  </div>
                ))}

                <button type="submit" className="btn btn-primary">UPDATE</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;