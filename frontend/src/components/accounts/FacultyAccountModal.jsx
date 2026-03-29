import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


const API_BASE_URL = "http://localhost:8000/api";
const DEFAULT_DEPARTMENT = "Computer Engineering";


const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordConfirmation: "",
};


const FacultyAccountModal = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setError("");
      setSuccess("");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.passwordConfirmation) {
      setError("All fields are required");
      return false;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }

    if (form.password !== form.passwordConfirmation) {
      setError("Passwords do not match");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/register/`,
        {
          email: form.email,
          password: form.password,
          first_name: form.firstName,
          last_name: form.lastName,
          role: "staff",
          department: DEFAULT_DEPARTMENT,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const createdUser = {
        id: String(response.data.id),
        name: `${response.data.first_name || ""} ${response.data.last_name || ""}`.trim(),
        department: response.data.department || DEFAULT_DEPARTMENT,
        email: response.data.email,
        courses: [],
      };

      setSuccess("Faculty account created successfully!");
      onCreated?.(createdUser);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (submitError) {
      setError(
        submitError.response?.data?.detail ||
          submitError.response?.data?.message ||
          "Failed to create faculty account"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#D1D5DB] p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#231F20]">
            <UserPlus className="h-5 w-5 text-[#FFC20E]" />
            Create Faculty Account
          </h2>
          <button
            onClick={onClose}
            className="text-[#6B6B6B] transition-colors hover:text-[#231F20]"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {success && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-success bg-success/10 p-4">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
              <p className="font-medium text-success">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-[#231F20]">
                <span className="text-destructive">*</span> First Name
              </Label>
              <Input
                type="text"
                name="firstName"
                placeholder="Enter first name"
                value={form.firstName}
                onChange={handleChange}
                disabled={isSubmitting}
                className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-[#231F20]">
                <span className="text-destructive">*</span> Last Name
              </Label>
              <Input
                type="text"
                name="lastName"
                placeholder="Enter last name"
                value={form.lastName}
                onChange={handleChange}
                disabled={isSubmitting}
                className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-[#231F20]">
                <span className="text-destructive">*</span> Email
              </Label>
              <Input
                type="email"
                name="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={handleChange}
                disabled={isSubmitting}
                className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-[#231F20]">
                <span className="text-destructive">*</span> Password
              </Label>
              <Input
                type="password"
                name="password"
                placeholder="Enter password (min. 8 characters)"
                value={form.password}
                onChange={handleChange}
                disabled={isSubmitting}
                className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-[#231F20]">
                <span className="text-destructive">*</span> Confirm Password
              </Label>
              <Input
                type="password"
                name="passwordConfirmation"
                placeholder="Re-enter password"
                value={form.passwordConfirmation}
                onChange={handleChange}
                disabled={isSubmitting}
                className="mt-2 bg-white border-[#D1D5DB] text-[#231F20]"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#FFC20E] px-4 py-2.5 font-semibold text-[#231F20] transition-colors hover:bg-[#FFC20E]/90"
              >
                {isSubmitting ? "Creating..." : "Create Account"}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 bg-[#D1D5DB] px-4 py-2.5 font-semibold text-[#231F20] transition-colors hover:bg-[#D1D5DB]/80"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


export default FacultyAccountModal;
