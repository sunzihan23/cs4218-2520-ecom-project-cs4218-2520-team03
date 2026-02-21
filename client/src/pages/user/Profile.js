// Sun Zihan, A0259581R
import React, { useState, useEffect } from "react";
import UserMenu from "../../components/UserMenu";
import Layout from "./../../components/Layout";
import { useAuth } from "../../context/auth";
import toast from "react-hot-toast";
import axios from "axios";

const Profile = () => {
  const [auth, setAuth] = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (auth?.user) {
      const { email, name, phone, address } = auth.user;
      setName(name || "");
      setPhone(phone || "");
      setEmail(email || "");
      setAddress(address || "");
    }
  }, [auth?.user]);

  const validate = () => {
    let tempErrors = {};
    
    if (!name.trim()) tempErrors.name = "Name is required";
    if (!address.trim()) tempErrors.address = "Address is required";
    
    const phoneRegex = /^\d+$/; 
    if (!phone) {
      tempErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(phone)) {
      tempErrors.phone = "Phone number must contain only digits";
    } else if (phone.length !== 8) {
      tempErrors.phone = "Phone number must be 8 digits long";
    }
  
    if (password) {
      if (password.length < 6) {
        tempErrors.password = "Password must be at least 6 characters long";
      }
      if (password !== confirmPassword) {
        tempErrors.confirmPassword = "Passwords do not match";
      }
    }
  
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const profileData = { name, email, phone, address };
      if (password && password.trim().length > 0) {
        profileData.password = password;
      }

      const { data } = await axios.put("/api/v1/auth/profile", profileData);

      if (data?.error) {
        toast.error(data.error);
      } else {
        const updatedUser = data?.updatedUser;
        setAuth({ ...auth, user: updatedUser });

        let ls = localStorage.getItem("auth");
        if (ls) {
          ls = JSON.parse(ls);
          ls.user = updatedUser;
          localStorage.setItem("auth", JSON.stringify(ls));
        }

        setPassword(""); 
        setConfirmPassword(""); 
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Something went wrong";
      toast.error(errorMsg);
    }
  };

  return (
    <Layout title={"Your Profile"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <UserMenu />
          </div>
          <div className="col-md-9">
            <div className="form-container">
              <form onSubmit={handleSubmit} noValidate>
                <h4 className="title">USER PROFILE</h4>
                
                <div className="mb-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                    className={`form-control ${errors.name ? "is-invalid" : ""}`}
                    placeholder="Enter your name"
                    autoFocus
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="mb-3">
                  <input
                    type="email"
                    value={email}
                    className="form-control"
                    placeholder="Enter your email"
                    disabled
                  />
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
                    placeholder="Enter your new password"
                  />
                  {errors.password && <div className="invalid-feedback">{errors.password}</div>}
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

                <div className="mb-3">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: "" });
                    }}
                    className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                    placeholder="Enter your phone"
                  />
                  {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (errors.address) setErrors({ ...errors, address: "" });
                    }}
                    className={`form-control ${errors.address ? "is-invalid" : ""}`}
                    placeholder="Enter your address"
                  />
                  {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                </div>

                <button type="submit" className="btn btn-primary">
                  UPDATE
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;