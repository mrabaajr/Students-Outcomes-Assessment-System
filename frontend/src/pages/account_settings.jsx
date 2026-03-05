import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

const Index = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    alert("Password updated successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="flex items-center justify-end gap-2 bg-gray-700 px-6 py-3 text-white">
        <User className="h-8 w-8 rounded-full bg-gray-400 p-1.5 text-white" />
        <span className="text-sm font-medium">
          Hi, 
        </span>
      </div>

      {/* Yellow accent bar */}
      <div className="h-8 bg-yellow-500" />

      {/* Content */}
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-12 text-3xl font-semibold text-gray-700">
          Change Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
          {/* Email (read-only) */}
          <div>
            <Label className="text-sm font-normal text-gray-600">Email</Label>
            <Input
              type="email"
              value=" Enter your email here"
              className="mt-2 bg-white border-gray-200"
              disabled
            />
          </div>

          {/* Old Password */}
          <div>
            <Label className="text-sm font-normal text-gray-600">
              <span className="text-red-500">*</span> Old Password
            </Label>
            <Input
              type="password"
              placeholder="Enter Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="mt-2 bg-white border-gray-200"
              required
            />
          </div>

          {/* New Password */}
          <div>
            <Label className="text-sm font-normal text-gray-600">
              <span className="text-red-500">*</span> New Password
            </Label>
            <Input
              type="password"
              placeholder="Enter New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2 bg-white border-gray-200"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <Label className="text-sm font-normal text-gray-600">
              <span className="text-red-500">*</span> Confirm Password
            </Label>
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 bg-white border-gray-200"
              required
            />
          </div>

          {/* Submit */}
          <div className="flex justify-center pt-4">
            <Button 
              type="submit" 
              className="px-8 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-800 font-semibold tracking-wide"
            >
              UPDATE PASSWORD
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Index;
