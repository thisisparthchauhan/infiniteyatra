import { useEffect, useState } from "react";

const SplashScreen = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#000",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      animation: visible ? "none" : "fadeOut 0.5s ease forwards"
    }}>
      {/* Rocket animation */}
      <div style={{ fontSize: "52px", animation: "rocketFloat 1.2s ease-in-out infinite" }}>
        🚀
      </div>

      {/* Logo text */}
      <div style={{
        marginTop: "20px", fontFamily: "serif",
        fontSize: "22px", fontWeight: "700",
        letterSpacing: "0.15em", color: "#fff"
      }}>
        INFINITE YATRA
      </div>
      <div style={{
        fontSize: "11px", letterSpacing: "0.3em",
        color: "rgba(255,255,255,0.4)", marginTop: "6px"
      }}>
        EXPLORE INFINITE
      </div>

      {/* Loading bar */}
      <div style={{
        width: "160px", height: "2px",
        background: "rgba(255,255,255,0.1)",
        borderRadius: "2px", marginTop: "32px", overflow: "hidden"
      }}>
        <div style={{
          height: "100%", borderRadius: "2px",
          background: "linear-gradient(90deg, #7c3aed, #60a5fa)",
          animation: "loadBar 1.8s ease forwards"
        }} />
      </div>

      <style>{`
        @keyframes rocketFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes loadBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes fadeOut {
          to { opacity: 0; pointer-events: none; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
