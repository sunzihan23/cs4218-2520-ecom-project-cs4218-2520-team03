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

  useEffect(() => {
    if (auth?.user) {
      const { email, name, phone, address } = auth.user;
      setName(name || "");
      setPhone(phone || "");
      setEmail(email || "");
      setAddress(address || "");
    }
  }, [auth?.user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

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

        try {
          const ls = JSON.parse(localStorage.getItem("auth"));
          if (ls) {
            ls.user = updatedUser;
            localStorage.setItem("auth", JSON.stringify(ls));
          }
        } catch (lsError) {
          console.error("LocalStorage update failed", lsError);
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
              <form onSubmit={handleSubmit}>
                <h4 className="title">USER PROFILE</h4>
                
                <div className="mb-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-control"
                    id="profileName"
                    placeholder="Enter your name"
                    autoFocus
                    required
                  />
                </div>

                <div className="mb-3">
                  <input
                    type="email"
                    value={email}
                    className="form-control"
                    id="profileEmail"
                    placeholder="Enter your email"
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control"
                    id="profilePassword"
                    placeholder="Enter your new password"
                  />
                </div>

                <div className="mb-3">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-control"
                    id="profileConfirmPassword"
                    placeholder="Confirm your new password"
                  />
                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-control"
                    id="profilePhone"
                    placeholder="Enter your phone"
                    required
                  />
                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-control"
                    id="profileAddress"
                    placeholder="Enter your address"
                    required
                  />
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