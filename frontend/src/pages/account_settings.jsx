import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, CheckCircle, Mail, Send, UserPlus } from "lucide-react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/dashboard/Navbar";
import Footer from "../components/dashboard/Footer";
import FacultyAccountModal from "@/components/accounts/FacultyAccountModal";
import { API_BASE_URL } from "@/lib/api";

const Index = () => {
  const [email, setEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailUpdateMessage, setEmailUpdateMessage] = useState("");
  const [emailUpdateError, setEmailUpdateError] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailConfig, setEmailConfig] = useState({
    email_host: "",
    email_port: 587,
    email_use_tls: true,
    email_host_user: "",
    email_host_password: "",
    default_from_email: "",
  });
  const [emailConfigMessage, setEmailConfigMessage] = useState("");
  const [emailConfigError, setEmailConfigError] = useState("");
  const [testRecipientEmail, setTestRecipientEmail] = useState("");
  const [isSavingEmailConfig, setIsSavingEmailConfig] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  
  const location = useLocation();
  const storedRole = String(localStorage.getItem("userRole") || "").toLowerCase();
  const isProgramChair =
    location.pathname.startsWith("/programchair") ||
    ["admin", "program_chair", "program-chair", "programchair", "chair"].includes(storedRole);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const response = await fetch(`${API_BASE_URL}/users/me/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) return;

        const currentUser = await response.json();
        if (isMounted) {
          setEmail(currentUser.email || "");
          setPendingEmail(currentUser.email || "");
          setTestRecipientEmail(currentUser.email || "");
        }
      } catch {
        if (isMounted) {
          setEmail("");
          setPendingEmail("");
          setTestRecipientEmail("");
        }
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isProgramChair) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    let isMounted = true;

    async function loadEmailSettings() {
      try {
        const response = await fetch(`${API_BASE_URL}/users/email_settings/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.detail || "Failed to load email settings.");
        }

        if (isMounted) {
          setEmailConfig({
            email_host: payload.email_host || "",
            email_port: payload.email_port || 587,
            email_use_tls: payload.email_use_tls ?? true,
            email_host_user: payload.email_host_user || "",
            email_host_password: payload.email_host_password || "",
            default_from_email: payload.default_from_email || "",
          });
        }
      } catch (error) {
        if (isMounted) {
          setEmailConfigError(error.message || "Failed to load email settings.");
        }
      }
    }

    loadEmailSettings();

    return () => {
      isMounted = false;
    };
  }, [isProgramChair]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailUpdateError("");
    setEmailUpdateMessage("");

    if (!pendingEmail || !emailPassword) {
      setEmailUpdateError("New email and current password are required.");
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("You must be signed in to update your email.");
      }

      const response = await fetch(`${API_BASE_URL}/users/change_email/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          new_email: pendingEmail,
          current_password: emailPassword,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.detail || "Failed to update account email.");
      }

      setEmail(payload.email || pendingEmail);
      setPendingEmail(payload.email || pendingEmail);
      setTestRecipientEmail((previous) =>
        previous === email || !previous ? payload.email || pendingEmail : previous
      );
      setEmailPassword("");
      setEmailUpdateMessage(payload.message || "Account email updated successfully.");
    } catch (error) {
      setEmailUpdateError(error.message || "Failed to update account email.");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

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
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("You must be signed in to update your password.");
      }

      const response = await fetch(`${API_BASE_URL}/users/change_password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          current_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.detail || "Failed to update password. Please try again.");
      }
      
      setSuccessMessage(payload.message || "Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      setErrorMessage(error.message || "Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailConfigChange = (field, value) => {
    setEmailConfig((prev) => ({
      ...prev,
      [field]: field === "email_port" ? Number(value) || 0 : value,
    }));
  };

  const handleSaveEmailSettings = async (e) => {
    e.preventDefault();
    setEmailConfigError("");
    setEmailConfigMessage("");

    if (!emailConfig.email_host || !emailConfig.default_from_email) {
      setEmailConfigError("Email host and default from email are required.");
      return;
    }

    setIsSavingEmailConfig(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/users/email_settings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(emailConfig),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.detail || "Failed to update email settings.");
      }

      setEmailConfig({
        email_host: payload.settings?.email_host || emailConfig.email_host,
        email_port: payload.settings?.email_port || emailConfig.email_port,
        email_use_tls: payload.settings?.email_use_tls ?? emailConfig.email_use_tls,
        email_host_user: payload.settings?.email_host_user || emailConfig.email_host_user,
        email_host_password: payload.settings?.email_host_password || emailConfig.email_host_password,
        default_from_email: payload.settings?.default_from_email || emailConfig.default_from_email,
      });
      setEmailConfigMessage(payload.message || "Email settings updated successfully.");
    } catch (error) {
      setEmailConfigError(error.message || "Failed to update email settings.");
    } finally {
      setIsSavingEmailConfig(false);
    }
  };

  const handleSendTestEmail = async () => {
    setEmailConfigError("");
    setEmailConfigMessage("");
    setIsSendingTestEmail(true);

    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/users/test_email_settings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient_email: testRecipientEmail,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.detail || "Failed to send test email.");
      }

      setEmailConfigMessage(payload.message || "Test email sent successfully.");
    } catch (error) {
      setEmailConfigError(error.message || "Failed to send test email.");
    } finally {
      setIsSendingTestEmail(false);
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
            <div className="lg:col-span-2 space-y-8">
              <div className="glass-card p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-[#231F20] mb-2">Account Email</h2>
                <p className="text-sm text-[#6B6B6B] mb-8">
                  Update the email attached to your signed-in account. This will also update the username used internally.
                </p>

                {emailUpdateMessage && (
                  <div className="mb-6 p-4 bg-success/10 border border-success rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-success">{emailUpdateMessage}</p>
                    </div>
                  </div>
                )}

                {emailUpdateError && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                    <p className="text-sm font-medium text-destructive">{emailUpdateError}</p>
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div>
                    <Label className="text-sm font-semibold text-[#231F20]">Current Email</Label>
                    <Input
                      type="email"
                      value={email}
                      readOnly
                      autoComplete="off"
                      className="mt-2 bg-[#F3F4F6] border-[#D1D5DB] text-[#231F20]"
                    />
                    <p className="text-xs text-[#6B6B6B] mt-1.5">
                      This is the email currently attached to your signed-in account.
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-[#231F20]">
                      <span className="text-destructive">*</span> New Email
                    </Label>
                    <Input
                      type="email"
                      placeholder="Enter your new account email"
                      value={pendingEmail}
                      onChange={(e) => setPendingEmail(e.target.value)}
                      autoComplete="off"
                      className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                      required
                      disabled={isUpdatingEmail}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-[#231F20]">
                      <span className="text-destructive">*</span> Current Password
                    </Label>
                    <Input
                      type="password"
                      placeholder="Enter your current password to confirm"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                      required
                      disabled={isUpdatingEmail}
                    />
                    <p className="text-xs text-[#6B6B6B] mt-1.5">
                      We require your current password before changing the account email.
                    </p>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={isUpdatingEmail}
                      className="px-6 py-2.5 bg-[#FFC20E] text-[#231F20] font-semibold hover:bg-[#FFC20E]/90 transition-colors"
                    >
                      {isUpdatingEmail ? "Updating..." : "Update Account Email"}
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
                  <div>
                    <Label className="text-sm font-semibold text-[#231F20]">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      readOnly
                      autoComplete="off"
                      className="mt-2 bg-[#F3F4F6] border-[#D1D5DB] text-[#231F20]"
                    />
                    <p className="text-xs text-[#6B6B6B] mt-1.5">
                      Password changes apply to this account email.
                    </p>
                  </div>

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
              </div>

              {isProgramChair && (
                <div className="glass-card p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-[#FFC20E]/10 rounded-lg">
                      <Mail className="w-6 h-6 text-[#FFC20E]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#231F20]">Email Settings</h2>
                      <p className="text-sm text-[#6B6B6B]">
                        Configure the SMTP server used for faculty account emails and other system messages.
                      </p>
                    </div>
                  </div>

                  {emailConfigMessage && (
                    <div className="mb-6 p-4 bg-success/10 border border-success rounded-lg flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-success">{emailConfigMessage}</p>
                      </div>
                    </div>
                  )}

                  {emailConfigError && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                      <p className="text-sm font-medium text-destructive">{emailConfigError}</p>
                    </div>
                  )}

                  <form onSubmit={handleSaveEmailSettings} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold text-[#231F20]">SMTP Host</Label>
                        <Input
                          value={emailConfig.email_host}
                          onChange={(e) => handleEmailConfigChange("email_host", e.target.value)}
                          placeholder="smtp.gmail.com"
                          className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                          disabled={isSavingEmailConfig}
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-[#231F20]">SMTP Port</Label>
                        <Input
                          type="number"
                          min="1"
                          value={emailConfig.email_port}
                          onChange={(e) => handleEmailConfigChange("email_port", e.target.value)}
                          placeholder="587"
                          className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                          disabled={isSavingEmailConfig}
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold text-[#231F20]">SMTP Username</Label>
                        <Input
                          value={emailConfig.email_host_user}
                          onChange={(e) => handleEmailConfigChange("email_host_user", e.target.value)}
                          placeholder="you@example.com"
                          className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                          disabled={isSavingEmailConfig}
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-[#231F20]">SMTP Password</Label>
                        <Input
                          type="password"
                          value={emailConfig.email_host_password}
                          onChange={(e) => handleEmailConfigChange("email_host_password", e.target.value)}
                          placeholder="App password or SMTP password"
                          className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                          disabled={isSavingEmailConfig}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-[#231F20]">Default From Email</Label>
                      <Input
                        type="email"
                        value={emailConfig.default_from_email}
                        onChange={(e) => handleEmailConfigChange("default_from_email", e.target.value)}
                        placeholder="noreply@assessmentsystem.com"
                        className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                        disabled={isSavingEmailConfig}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-3">
                      <div>
                        <Label htmlFor="emailUseTls">Use TLS</Label>
                        <p className="text-xs text-muted-foreground">
                          Keep this enabled for most modern SMTP providers.
                        </p>
                      </div>
                      <input
                        id="emailUseTls"
                        type="checkbox"
                        checked={emailConfig.email_use_tls}
                        onChange={(e) => handleEmailConfigChange("email_use_tls", e.target.checked)}
                        className="h-4 w-4"
                        disabled={isSavingEmailConfig}
                      />
                    </div>

                    <div className="pt-2 flex flex-wrap gap-3">
                      <Button
                        type="submit"
                        disabled={isSavingEmailConfig}
                        className="px-6 py-2.5 bg-[#FFC20E] text-[#231F20] font-semibold hover:bg-[#FFC20E]/90 transition-colors"
                      >
                        {isSavingEmailConfig ? "Saving..." : "Save Email Settings"}
                      </Button>
                    </div>
                  </form>

                  <div className="mt-8 pt-8 border-t border-[#D1D5DB]">
                    <h3 className="text-lg font-semibold text-[#231F20] mb-2">Send Test Email</h3>
                    <p className="text-sm text-[#6B6B6B] mb-4">
                      Send a test message to confirm the SMTP credentials are working.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        type="email"
                        value={testRecipientEmail}
                        onChange={(e) => setTestRecipientEmail(e.target.value)}
                        placeholder="Recipient email address"
                        className="bg-white border-[#D1D5DB] text-[#231F20]"
                        disabled={isSendingTestEmail}
                      />
                      <Button
                        type="button"
                        onClick={handleSendTestEmail}
                        disabled={isSendingTestEmail}
                        className="px-6 py-2.5 bg-[#3A3A3A] text-white font-semibold hover:bg-[#2A2A2A] transition-colors flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {isSendingTestEmail ? "Sending..." : "Send Test Email"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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
