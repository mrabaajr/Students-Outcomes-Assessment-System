import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Eye, EyeOff, Mail, Lock, ArrowRight, User, Users } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "@/lib/api";

const ROLE_ROUTE_MAP = {
  admin: "/programchair/dashboard",
  staff: "/faculty/dashboard",
};

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call login API
      const response = await axios.post(`${API_BASE_URL}/users/login/`, {
        email,
        password,
      });

      // Store tokens
      const { access, refresh } = response.data;
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);

      // Decode token to get user role
      const decoded = jwtDecode(access);
      const userId = decoded.user_id;
      console.log("Decoded token:", decoded);
      console.log("User ID:", userId);

      // Fetch user details to get role
      const userResponse = await axios.get(`${API_BASE_URL}/users/${userId}/`, {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      console.log("User response:", userResponse.data);
      const userRole = String(userResponse.data.role || "").toLowerCase();
      console.log("User role:", userRole);

      if (!ROLE_ROUTE_MAP[userRole]) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        setError("Unknown role. Please contact administrator.");
        setLoading(false);
        return;
      }

      if (selectedRole !== userRole) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        setError(
          `Invalid Credentials`
        );
        setLoading(false);
        return;
      }

      localStorage.setItem("userRole", userRole);
        localStorage.setItem("userId", String(userId));

      // Route based on role
      navigate(ROLE_ROUTE_MAP[userRole]);
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Login failed. Please check your credentials.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Yellow diagonal stripe */}
          <div 
            className="absolute w-[200%] h-32 bg-yellow-400 rotate-[-35deg] origin-top-left"
            style={{ top: '30%', left: '-20%' }}
          />
          <div 
            className="absolute w-[200%] h-8 bg-yellow-400/30 rotate-[-35deg] origin-top-left"
            style={{ top: '45%', left: '-20%' }}
          />
          <div 
            className="absolute w-[200%] h-4 bg-yellow-400/20 rotate-[-35deg] origin-top-left"
            style={{ top: '50%', left: '-20%' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 2xl:px-24">
          <div className="animate-slide-right">
            <h1 className="font-display text-5xl md:text-6xl xl:text-7xl 2xl:text-8xl text-white tracking-wide leading-none mb-4 sm:mb-6">
              WELCOME<br />
              <span className="text-yellow-400">BACK</span>
            </h1>
            <p className="text-white/70 text-base lg:text-lg max-w-md leading-relaxed">
              Sign in to access your account and continue your journey with us.
            </p>
          </div>

          {/* Decorative dots */}
          <div className="absolute bottom-12 sm:bottom-16 left-12 xl:left-16 flex gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400 animate-pulse" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400/50" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400/25" />
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 xl:p-16 bg-white">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8 sm:mb-10">
            <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-dark-gray">
              WELCOME <span className="text-yellow-400">BACK</span>
            </h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div className="mb-6 sm:mb-8">
            <p className="text-xs sm:text-sm font-medium mb-3 sm:mb-4 text-dark-gray">Select your role to continue</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setSelectedRole("admin")}
                className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 ${
                  selectedRole === "admin"
                    ? "border-yellow-400 bg-yellow-400/10 shadow-lg"
                    : "border-gray-200 hover:border-yellow-400/50 hover:bg-gray-50"
                }`}
              >
                <User className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3 ${selectedRole === "admin" ? "text-yellow-400" : "text-gray"}`} />
                <span className={`text-xs sm:text-sm font-semibold ${selectedRole === "admin" ? "text-dark-gray" : "text-gray"}`}>
                  Program Chair
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("staff")}
                className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 ${
                  selectedRole === "staff"
                    ? "border-yellow-400 bg-yellow-400/10 shadow-lg"
                    : "border-gray-200 hover:border-yellow-400/50 hover:bg-gray-50"
                }`}
              >
                <Users className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3 ${selectedRole === "staff" ? "text-yellow-400" : "text-gray"}`} />
                <span className={`text-xs sm:text-sm font-semibold ${selectedRole === "staff" ? "text-dark-gray" : "text-gray"}`}>
                  Faculty
                </span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs sm:text-sm font-medium text-dark-gray">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 icon-gray" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 bg-white border-gray text-dark-gray"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-dark-gray">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 icon-gray" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 bg-white border-gray text-dark-gray"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors icon-gray hover:text-gray-dark"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-yellow-400 hover:text-yellow-500 transition-colors"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            <Button 
              type="submit" 
              variant="yellow" 
              size="lg" 
              className="w-full group bg-yellow"
              disabled={!selectedRole || loading}
            >
              {loading ? "Signing in..." : `Sign In as ${selectedRole === "admin" ? "Program Chair" : selectedRole === "staff" ? "Faculty" : "..."}`}
              {!loading && <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />}
            </Button>
          </form>

          
        </div>
      </div>
    </div>
  );
};

export default Login;
