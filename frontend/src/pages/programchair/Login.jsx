import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, ArrowRight, User, Users } from "lucide-react";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", { email, password, role: selectedRole });
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
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          <div className="animate-slide-right">
            <h1 className="font-display text-7xl xl:text-8xl text-white tracking-wide leading-none mb-6">
              WELCOME<br />
              <span className="text-yellow-400">BACK</span>
            </h1>
            <p className="text-white/70 text-lg max-w-md leading-relaxed">
              Sign in to access your account and continue your journey with us.
            </p>
          </div>

          {/* Decorative dots */}
          <div className="absolute bottom-16 left-16 flex gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/25" />
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="font-display text-5xl tracking-wide" style={{ color: '#231f20' }}>
              WELCOME <span className="text-yellow-400">BACK</span>
            </h1>
          </div>

          {/* Role Selection */}
          <div className="mb-8">
            <p className="text-sm font-medium mb-4" style={{ color: '#231f20' }}>Select your role to continue</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedRole("program-chair")}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-300 ${
                  selectedRole === "program-chair"
                    ? "border-yellow-400 bg-yellow-400/10 shadow-lg"
                    : "border-gray-200 hover:border-yellow-400/50 hover:bg-gray-50"
                }`}
              >
                <User className={`w-8 h-8 mb-3 ${selectedRole === "program-chair" ? "text-yellow-400" : ""}`} style={{ color: selectedRole === "program-chair" ? undefined : '#a5a8ab' }} />
                <span className={`font-semibold`} style={{ color: selectedRole === "program-chair" ? '#231f20' : '#a5a8ab' }}>
                  Program Chair
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("staff")}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-300 ${
                  selectedRole === "staff"
                    ? "border-yellow-400 bg-yellow-400/10 shadow-lg"
                    : "border-gray-200 hover:border-yellow-400/50 hover:bg-gray-50"
                }`}
              >
                <Users className={`w-8 h-8 mb-3 ${selectedRole === "staff" ? "text-yellow-400" : ""}`} style={{ color: selectedRole === "staff" ? undefined : '#a5a8ab' }} />
                <span className={`font-semibold`} style={{ color: selectedRole === "staff" ? '#231f20' : '#a5a8ab' }}>
                  Staff
                </span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium" style={{ color: '#231f20' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#a5a8ab' }} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12"
                  style={{ backgroundColor: '#ffffff', borderColor: '#a5a8ab', color: '#231f20' }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: '#231f20' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#a5a8ab' }} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12"
                  style={{ backgroundColor: '#ffffff', borderColor: '#a5a8ab', color: '#231f20' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#a5a8ab' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-yellow-400 hover:text-yellow-500 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <Button 
              type="submit" 
              variant="yellow" 
              size="lg" 
              className="w-full group"
              disabled={!selectedRole}
              style={{ backgroundColor: '#ffc203' }}
            >
              Sign In as {selectedRole === "program-chair" ? "Program Chair" : selectedRole === "staff" ? "Staff" : "..."}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>

          {/* Footer text */}
          <p className="text-center text-sm mt-8" style={{ color: '#a5a8ab' }}>
            By continuing, you agree to our{' '}
            <button className="text-yellow-400 hover:underline">Terms of Service</button>
            {' '}and{' '}
            <button className="text-yellow-400 hover:underline">Privacy Policy</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
