import { useState } from "react";
import Dashboard from "./pages/GlucoseDashboard.jsx";
import {
  Activity,
  HeartPulse,
  Droplets,
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  Lock,
  TrendingUp,
  BarChart3,
  Droplet,
} from "lucide-react";
import api from "./api/axios";
import "./App.css";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("token"))
  );
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const toggleAuthMode = () => {
    setIsLogin((previous) => !previous);
    setFormData({ name: "", email: "", password: "" });
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setIsLogin(true);
    setFormData({ name: "", email: "", password: "" });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";

      const payload = isLogin
        ? {
            email: formData.email.trim(),
            password: formData.password,
          }
        : {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
          };

      const response = await api.post(endpoint, payload);

      if (!response.data.success) {
        throw new Error(response.data.message || "Authentication failed");
      }

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Authentication response is incomplete.");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setSuccess(
        isLogin
          ? "Login successful! Welcome back."
          : "Account created successfully!"
      );

      setIsAuthenticated(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <main className="auth-page">
      {/* LEFT BRANDING PANEL */}
      <section className="brand-panel">
        <div className="brand-content">
          <div className="brand-logo">
            <div className="brand-logo-icon">
              <HeartPulse size={34} strokeWidth={2.2} />
            </div>
            <div>
              <h2>Sweety</h2>
              <p>Blood Glucose Tracker</p>
            </div>
          </div>

          <div className="brand-main">
            <h1>
              Take control of your health,
              <span> one reading at a time.</span>
            </h1>

            <p className="brand-description">
              Track your blood glucose levels, understand your
              patterns, and make informed decisions about your health.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">
                  <Droplet size={25} />
                </span>
                <span>Track daily glucose readings</span>
              </div>

              <div className="feature-item">
                <span className="feature-icon">
                  <BarChart3 size={25} />
                </span>
                <span>Monitor your monthly progress</span>
              </div>

              <div className="feature-item">
                <span className="feature-icon">
                  <TrendingUp size={25} />
                </span>
                <span>Understand your glucose trends</span>
              </div>
            </div>
          </div>

          {/* Decorative glucose meter */}
          <div className="meter-decoration">
            <div className="meter-glow" />

            <div className="meter-chart">
              <div className="chart-line">
                <TrendingUp size={55} />
              </div>
              <div className="chart-bars">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="glucose-meter">
              <div className="meter-strip" />
              <div className="meter-screen">
                <div className="meter-screen-top">
                  <span />
                  <span />
                </div>
                <strong>120</strong>
                <small>mg/dL</small>
                <Droplet className="meter-drop" size={22} />
              </div>
              <div className="meter-heart">
                <HeartPulse size={23} />
              </div>
            </div>

            <div className="meter-leaf leaf-left" />
            <div className="meter-leaf leaf-right" />
          </div>
        </div>

        <div className="brand-footer">
          © 2026 Sweety Blood Glucose Tracker
        </div>

        <div className="brand-circle brand-circle-one" />
        <div className="brand-circle brand-circle-two" />
      </section>

      {/* RIGHT LOGIN PANEL */}
      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-logo">
            <HeartPulse size={62} strokeWidth={1.8} />
          </div>

          <div className="auth-heading">
            <h2>{isLogin ? "Welcome back!" : "Create your account"}</h2>
            <p>
              {isLogin
                ? "Sign in to continue tracking your health."
                : "Start your personal glucose tracking journey."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name">Full name</label>
                <div className="input-wrapper">
                  <Activity size={19} className="input-icon" />
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    minLength={2}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">
                <Mail size={17} />
                Email address
              </label>
              <div className="input-wrapper">
                <ShieldCheck size={19} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Lock size={17} />
                Password
              </label>
              <div className="input-wrapper">
                <Lock size={19} className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={8}
                  autoComplete={
                    isLogin ? "current-password" : "new-password"
                  }
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="form-message error-message" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="form-message success-message" role="status">
                {success}
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isLogin
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <div className="auth-switch">
            <span>
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}
            </span>
            <button type="button" onClick={toggleAuthMode}>
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </div>

          <div className="privacy-note">
            <ShieldCheck size={21} />
            <span>Your health data is private and secure.</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;