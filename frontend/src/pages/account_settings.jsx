import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, CheckCircle, X, UserPlus } from "lucide-react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/dashboard/Navbar";
import Footer from "../components/dashboard/Footer";

const API_BASE_URL = "http://localhost:8000/api";

const Index = () => {
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Faculty account creation states
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [facultyForm, setFacultyForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirmation: ""
  });
  const [facultyErrors, setFacultyErrors] = useState("");
  const [facultySuccess, setFacultySuccess] = useState("");
  const [isFacultySubmitting, setIsFacultySubmitting] = useState(false);
  
  const location = useLocation();
  const isProgramChair = location.pathname.startsWith('/programchair');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMessage("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      setErrorMessage("Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFacultyFormChange = (e) => {
    const { name, value } = e.target;
    setFacultyForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateFacultyForm = () => {
    if (!facultyForm.username || !facultyForm.firstName || !facultyForm.lastName || !facultyForm.email || !facultyForm.password || !facultyForm.passwordConfirmation) {
      setFacultyErrors("All fields are required");
      return false;
    }

    if (facultyForm.password.length < 8) {
      setFacultyErrors("Password must be at least 8 characters");
      return false;
    }

    if (facultyForm.password !== facultyForm.passwordConfirmation) {
      setFacultyErrors("Passwords do not match");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(facultyForm.email)) {
      setFacultyErrors("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleFacultySubmit = async (e) => {
    e.preventDefault();
    setFacultyErrors("");
    setFacultySuccess("");

    if (!validateFacultyForm()) {
      return;
    }

    setIsFacultySubmitting(true);
    try {
      const response = await fetch("/api/users/create-faculty/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({
          username: facultyForm.username,
          first_name: facultyForm.firstName,
          last_name: facultyForm.lastName,
          email: facultyForm.email,
          password: facultyForm.password,
          role: "faculty"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setFacultyErrors(errorData.message || "Failed to create faculty account");
        return;
      }

      setFacultySuccess("Faculty account created successfully!");
      setFacultyForm({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        passwordConfirmation: ""
      });

      setTimeout(() => {
        setShowFacultyModal(false);
        setFacultySuccess("");
      }, 2000);
    } catch (error) {
      setFacultyErrors("Failed to create faculty account. Please try again.");
    } finally {
      setIsFacultySubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#231F20] border-b border-[#A5A8AB] pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10 sm:pb-14 lg:pb-16">
            <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
              ACCOUNT SETTINGS
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-[#FFC20E]/10 rounded-lg">
                <Lock className="w-6 h-6 text-[#FFC20E]" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                  <span className="text-white">Account</span>
                  <br />
                  <span className="text-[#FFC20E]">Settings</span>
                </h1>
              </div>
            </div>
            <p className="text-sm sm:text-base text-[#A5A8AB] max-w-xl">
              Manage your password and account security settings.
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="glass-card p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-[#231F20] mb-2">Change Password</h2>
                <p className="text-sm text-[#6B6B6B] mb-8">
                  Update your password to keep your account secure. Use a strong password with at least 8 characters.
                </p>

                {successMessage && (
                  <div className="mb-6 p-4 bg-success/10 border border-success rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-success">{successMessage}</p>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                    <p className="text-sm font-medium text-destructive">{errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                    <Label className="text-sm font-semibold text-[#231F20]">Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="off"
                      className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                    />
                  </div>

                  {/* Current Password */}
                  <div>
                    <Label className="text-sm font-semibold text-[#231F20]">
                      <span className="text-destructive">*</span> Current Password
                    </Label>
                    <Input
                      type="password"
                      placeholder="Enter your current password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      autoComplete="off"
                      className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <Label className="text-sm font-semibold text-[#231F20]">
                      <span className="text-destructive">*</span> New Password
                    </Label>
                    <Input
                      type="password"
                      placeholder="Enter a new password (min. 8 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                      required
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-[#6B6B6B] mt-1.5">
                      Use a mix of uppercase, lowercase, numbers, and symbols for stronger security.
                    </p>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <Label className="text-sm font-semibold text-[#231F20]">
                      <span className="text-destructive">*</span> Confirm New Password
                    </Label>
                    <Input
                      type="password"
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-[#FFC20E] text-[#231F20] font-semibold hover:bg-[#FFC20E]/90 transition-colors"
                    >
                      {isSubmitting ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>

                {/* Create Faculty Account Section */}
                {isProgramChair && (
                  <div className="mt-8 pt-8 border-t border-[#D1D5DB]">
                    <h3 className="text-lg font-semibold text-[#231F20] mb-2">Faculty Account Management</h3>
                    <p className="text-sm text-[#6B6B6B] mb-4">
                      Create new faculty accounts with a single click.
                    </p>
                    <Button
                      onClick={() => setShowFacultyModal(true)}
                      className="px-6 py-2.5 bg-[#3A3A3A] text-white font-semibold hover:bg-[#2A2A2A] transition-colors flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Create an Account for Faculty
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div>
              <div className="glass-card p-6 bg-[#FFF8DB] border border-[#FFC20E]/30">
                <h3 className="font-semibold text-[#231F20] mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#FFC20E]" />
                  Security Tips
                </h3>
                <ul className="space-y-3 text-sm text-[#6B6B6B]">
                  <li className="flex gap-2">
                    <span className="text-[#FFC20E] font-bold">✓</span>
                    <span>Use a unique password not used on other accounts</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#FFC20E] font-bold">✓</span>
                    <span>Include uppercase, lowercase, numbers, and symbols</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#FFC20E] font-bold">✓</span>
                    <span>Avoid using personal information</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#FFC20E] font-bold">✓</span>
                    <span>Never share your password with anyone</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#FFC20E] font-bold">✓</span>
                    <span>Update it regularly for better security</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Faculty Account Creation Modal */}
      {showFacultyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#D1D5DB]">
              <h2 className="text-xl font-bold text-[#231F20] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#FFC20E]" />
                Create Faculty Account
              </h2>
              <button
                onClick={() => {
                  setShowFacultyModal(false);
                  setFacultyErrors("");
                  setFacultySuccess("");
                }}
                className="text-[#6B6B6B] hover:text-[#231F20] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {facultySuccess && (
                <div className="mb-4 p-4 bg-success/10 border border-success rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-success">{facultySuccess}</p>
                  </div>
                </div>
              )}

              {facultyErrors && (
                <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
                  <p className="text-sm font-medium text-destructive">{facultyErrors}</p>
                </div>
              )}

              <form onSubmit={handleFacultySubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <Label className="text-sm font-semibold text-[#231F20]">
                    <span className="text-destructive">*</span> Username
                  </Label>
                  <Input
                    type="text"
                    name="username"
                    placeholder="Enter username"
                    value={facultyForm.username}
                    onChange={handleFacultyFormChange}
                    disabled={isFacultySubmitting}
                    className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                    required
                  />
                </div>

                {/* First Name */}
                <div>
                  <Label className="text-sm font-semibold text-[#231F20]">
                    <span className="text-destructive">*</span> First Name
                  </Label>
                  <Input
                    type="text"
                    name="firstName"
                    placeholder="Enter first name"
                    value={facultyForm.firstName}
                    onChange={handleFacultyFormChange}
                    disabled={isFacultySubmitting}
                    className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <Label className="text-sm font-semibold text-[#231F20]">
                    <span className="text-destructive">*</span> Last Name
                  </Label>
                  <Input
                    type="text"
                    name="lastName"
                    placeholder="Enter last name"
                    value={facultyForm.lastName}
                    onChange={handleFacultyFormChange}
                    disabled={isFacultySubmitting}
                    className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <Label className="text-sm font-semibold text-[#231F20]">
                    <span className="text-destructive">*</span> Email
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    value={facultyForm.email}
                    onChange={handleFacultyFormChange}
                    disabled={isFacultySubmitting}
                    className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <Label className="text-sm font-semibold text-[#231F20]">
                    <span className="text-destructive">*</span> Password
                  </Label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Enter password (min. 8 characters)"
                    value={facultyForm.password}
                    onChange={handleFacultyFormChange}
                    disabled={isFacultySubmitting}
                    className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                    required
                  />
                </div>

                {/* Password Confirmation */}
                <div>
                  <Label className="text-sm font-semibold text-[#231F20]">
                    <span className="text-destructive">*</span> Confirm Password
                  </Label>
                  <Input
                    type="password"
                    name="passwordConfirmation"
                    placeholder="Re-enter password"
                    value={facultyForm.passwordConfirmation}
                    onChange={handleFacultyFormChange}
                    disabled={isFacultySubmitting}
                    className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                    required
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isFacultySubmitting}
                    className="flex-1 px-4 py-2.5 bg-[#FFC20E] text-[#231F20] font-semibold hover:bg-[#FFC20E]/90 transition-colors"
                  >
                    {isFacultySubmitting ? "Creating..." : "Create Account"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowFacultyModal(false);
                      setFacultyErrors("");
                      setFacultySuccess("");
                    }}
                    disabled={isFacultySubmitting}
                    className="flex-1 px-4 py-2.5 bg-[#D1D5DB] text-[#231F20] font-semibold hover:bg-[#D1D5DB]/80 transition-colors"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Index;
