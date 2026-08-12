"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Lock, Mail, Megaphone } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(formData.email, formData.password);
      if (user.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/viewer");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Megaphone size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Campaign Manager</h1>
          <p className="text-slate-400 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Don&apos;t have an account? Contact your administrator.
            </p>
          </div>
        </div>

        {/* Setup Admin hint */}
        <p className="text-center text-slate-500 text-xs mt-4">
          First time? <a href="/setup-admin" className="text-blue-400 hover:underline">Set up admin account</a>
        </p>
      </div>
    </div>
  );
}



// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/context/AuthContext";
// import { Eye, EyeOff, Lock, Mail, Megaphone } from "lucide-react";

// // Fonts are loaded via a plain <link> below instead of next/font/google —
// // avoids build-time font resolution failing in restricted/offline environments.
// // If you'd rather use next/font, add the <link> tags to app/layout.jsx's <head>
// // instead and drop this block.
// const FONT_VARS = {
//   "--font-display": "'Big Shoulders Display', 'Arial Narrow', sans-serif",
//   "--font-body":
//     "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
//   "--font-mono": "'IBM Plex Mono', 'SFMono-Regular', Menlo, monospace",
// };

// export default function LoginPage() {
//   const { login } = useAuth();
//   const router = useRouter();
//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);
//     try {
//       const user = await login(formData.email, formData.password);
//       if (user.role === "admin") {
//         router.push("/dashboard");
//       } else {
//         router.push("/viewer");
//       }
//     } catch (err) {
//       setError(err.message || "Login failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div
//       className="min-h-screen w-full font-[family-name:var(--font-body)] lg:grid lg:grid-cols-[1.15fr_1fr]"
//       style={{ background: "#FAF9F6", ...FONT_VARS }}
//     >
//       {/* Loads the display/mono faces used below. Move this <link> into
//           app/layout.jsx's <head> instead if you prefer it centralized. */}
//       <link
//         rel="stylesheet"
//         href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
//       />
//       {/* LEFT — broadcast console */}
//       <div
//         className="relative flex flex-col justify-between overflow-hidden px-8 py-10 sm:px-12 sm:py-12 lg:min-h-screen"
//         style={{ background: "#0B0E1A" }}
//       >
//         {/* ambient rings, decorative */}
//         <div className="pointer-events-none absolute -right-24 top-1/2 hidden -translate-y-1/2 lg:block">
//           <RingField />
//         </div>

//         {/* mark */}
//         <div className="relative z-10 flex items-center gap-3">
//           <div
//             className="flex h-10 w-10 items-center justify-center rounded-full"
//             style={{ background: "#F2B705" }}
//           >
//             <Megaphone size={18} style={{ color: "#0B0E1A" }} strokeWidth={2.5} />
//           </div>
//           <span
//             className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em]"
//             style={{ color: "#93A0C2" }}
//           >
//             Campaign Manager
//           </span>
//         </div>

//         {/* headline */}
//         <div className="relative z-10 my-14 max-w-md lg:my-0">
//           <p
//             className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.25em]"
//             style={{ color: "#F2B705" }}
//           >
//             Live campaign console
//           </p>
//           <h1
//             className="font-[family-name:var(--font-display)] text-5xl font-bold uppercase leading-[0.95] text-white sm:text-6xl"
//           >
//             Every
//             <br />
//             campaign,
//             <br />
//             <span style={{ color: "#F2B705" }}>one signal.</span>
//           </h1>
//           <p className="mt-6 max-w-xs text-sm leading-relaxed" style={{ color: "#93A0C2" }}>
//             Sign in to steer live campaigns, track reach, and ship the next
//             send.
//           </p>
//         </div>

//         {/* status strip */}
//         <div className="relative z-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-6" style={{ borderColor: "#1E2540" }}>
//           <span className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider" style={{ color: "#F2B705" }}>
//             <span className="live-dot h-1.5 w-1.5 rounded-full" style={{ background: "#F2B705" }} />
//             On air
//           </span>
//           <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider" style={{ color: "#5C6689" }}>
//             Secure workspace access
//           </span>
//         </div>
//       </div>

//       {/* RIGHT — form panel */}
//       <div className="flex min-h-screen items-center justify-center px-6 py-14 sm:px-10">
//         <div className="w-full max-w-sm">
//           <h2
//             className="font-[family-name:var(--font-display)] text-3xl font-bold uppercase tracking-tight"
//             style={{ color: "#10131F" }}
//           >
//             Sign in
//           </h2>
//           <p className="mt-2 text-sm" style={{ color: "#6B7280" }}>
//             Enter your workspace credentials to continue.
//           </p>

//           {error && (
//             <div
//               className="mt-6 rounded-md border px-4 py-3 text-sm"
//               style={{ background: "#FDECEC", borderColor: "#F3B9BB", color: "#B3272C" }}
//             >
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="mt-8 space-y-5">
//             <div>
//               <label
//                 className="mb-1.5 block font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider"
//                 style={{ color: "#6B7280" }}
//               >
//                 Email address
//               </label>
//               <div className="relative">
//                 <Mail
//                   size={17}
//                   className="absolute left-3 top-1/2 -translate-y-1/2"
//                   style={{ color: "#9CA3AF" }}
//                 />
//                 <input
//                   type="email"
//                   required
//                   value={formData.email}
//                   onChange={(e) =>
//                     setFormData({ ...formData, email: e.target.value })
//                   }
//                   placeholder="you@example.com"
//                   className="w-full rounded-md border py-2.5 pl-10 pr-4 text-sm text-[#10131F] outline-none transition focus:ring-2"
//                   style={{ borderColor: "#DDDCD6", background: "#FFFFFF" }}
//                   onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px #F2B705")}
//                   onBlur={(e) => (e.target.style.boxShadow = "none")}
//                 />
//               </div>
//             </div>

//             <div>
//               <label
//                 className="mb-1.5 block font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider"
//                 style={{ color: "#6B7280" }}
//               >
//                 Password
//               </label>
//               <div className="relative">
//                 <Lock
//                   size={17}
//                   className="absolute left-3 top-1/2 -translate-y-1/2"
//                   style={{ color: "#9CA3AF" }}
//                 />
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   required
//                   value={formData.password}
//                   onChange={(e) =>
//                     setFormData({ ...formData, password: e.target.value })
//                   }
//                   placeholder="Enter your password"
//                   className="w-full rounded-md border py-2.5 pl-10 pr-10 text-sm text-[#10131F] outline-none transition focus:ring-2"
//                   style={{ borderColor: "#DDDCD6", background: "#FFFFFF" }}
//                   onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px #F2B705")}
//                   onBlur={(e) => (e.target.style.boxShadow = "none")}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 transition"
//                   style={{ color: "#9CA3AF" }}
//                   aria-label={showPassword ? "Hide password" : "Show password"}
//                 >
//                   {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
//                 </button>
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full rounded-md py-2.5 text-sm font-semibold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60"
//               style={{ background: "#F2B705", color: "#10131F" }}
//               onMouseEnter={(e) => {
//                 if (!loading) e.currentTarget.style.background = "#D89E00";
//               }}
//               onMouseLeave={(e) => {
//                 e.currentTarget.style.background = "#F2B705";
//               }}
//             >
//               {loading ? "Signing in…" : "Sign in"}
//             </button>
//           </form>

//           <div className="mt-7 border-t pt-5 text-center" style={{ borderColor: "#EDECE6" }}>
//             <p className="text-xs" style={{ color: "#9CA3AF" }}>
//               Don&apos;t have an account? Contact your administrator.
//             </p>
//           </div>

//           <p className="mt-4 text-center text-xs" style={{ color: "#9CA3AF" }}>
//             First time?{" "}
//             <a href="/setup-admin" className="font-medium underline" style={{ color: "#B3860A" }}>
//               Set up admin account
//             </a>
//           </p>
//         </div>
//       </div>

//       <style jsx>{`
//         .live-dot {
//           animation: pulse 1.8s ease-in-out infinite;
//         }
//         @keyframes pulse {
//           0%,
//           100% {
//             opacity: 1;
//             box-shadow: 0 0 0 0 rgba(242, 183, 5, 0.6);
//           }
//           50% {
//             opacity: 0.6;
//             box-shadow: 0 0 0 6px rgba(242, 183, 5, 0);
//           }
//         }
//         @media (prefers-reduced-motion: reduce) {
//           .live-dot {
//             animation: none;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }

// function RingField() {
//   return (
//     <svg width="520" height="520" viewBox="0 0 520 520" fill="none" aria-hidden="true">
//       <g style={{ transformOrigin: "260px 260px" }}>
//         {[70, 130, 190, 250].map((r, i) => (
//           <circle
//             key={r}
//             cx="260"
//             cy="260"
//             r={r}
//             stroke="#F2B705"
//             strokeOpacity={0.16 - i * 0.03}
//             strokeWidth="1"
//             className="ring"
//             style={{
//               animation: `ringPulse 5.5s ease-out infinite`,
//               animationDelay: `${i * 0.9}s`,
//               transformOrigin: "260px 260px",
//             }}
//           />
//         ))}
//         <circle cx="260" cy="260" r="5" fill="#F2B705" />
//       </g>
//       <style jsx>{`
//         @keyframes ringPulse {
//           0% {
//             transform: scale(0.85);
//             opacity: 0.9;
//           }
//           100% {
//             transform: scale(1.08);
//             opacity: 0;
//           }
//         }
//         @media (prefers-reduced-motion: reduce) {
//           .ring {
//             animation: none !important;
//             opacity: 0.12 !important;
//           }
//         }
//       `}</style>
//     </svg>
//   );
// }