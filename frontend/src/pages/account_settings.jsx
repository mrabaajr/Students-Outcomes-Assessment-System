import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, CheckCircle, UserPlus } from "lucide-react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/dashboard/Navbar";
import Footer from "../components/dashboard/Footer";
import FacultyAccountModal from "@/components/accounts/FacultyAccountModal";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const Index = () => {
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  
  const location = useLocation();
  const storedRole = String(localStorage.getItem("userRole") || "").toLowerCase();
  const isProgramChair =
    location.pathname.startsWith("/programchair") ||
    ["admin", "program_chair", "program-chair", "programchair", "chair"].includes(storedRole);

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

      <FacultyAccountModal
        open={showFacultyModal}
        onClose={() => setShowFacultyModal(false)}
      />

      <Footer />
    </div>
  );
};

export default Index;
