import { useState, useEffect } from "react";

interface WinOverlayProps {
  timeTakenMs: number;
  onContinue: () => void;
}

export default function WinOverlay({
  timeTakenMs,
  onContinue,
}: WinOverlayProps) {
  const [doorOpen, setDoorOpen] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // Start door animation
    const t1 = setTimeout(() => setDoorOpen(true), 200);
    const t2 = setTimeout(() => setShowMessage(true), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: "rgba(0,0,0,0.7)",
          opacity: showMessage ? 1 : 0.5,
        }}
      />

      {/* Door animation */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Door frame */}
        <div
          className="relative overflow-hidden rounded-t-xl"
          style={{
            width: 200,
            height: 280,
            background: "#5D4037",
            border: "4px solid #8D6E63",
            borderBottom: "none",
          }}
        >
          {/* Left door panel */}
          <div
            className="absolute top-0 left-0 h-full transition-transform duration-1000 ease-in-out"
            style={{
              width: "50%",
              background: "linear-gradient(to right, #6D4C41, #795548)",
              borderRight: "1px solid #4E342E",
              transform: doorOpen ? "rotateY(-100deg)" : "rotateY(0deg)",
              transformOrigin: "left center",
            }}
          >
            {/* Door handle */}
            <div
              className="absolute rounded-full"
              style={{
                width: 8,
                height: 8,
                background: "#FFD54F",
                right: 10,
                top: "50%",
                boxShadow: "0 0 6px #FFD54F",
              }}
            />
            {/* Door panel detail */}
            <div
              className="absolute rounded"
              style={{
                width: "60%",
                height: "35%",
                left: "15%",
                top: "10%",
                border: "2px solid #5D4037",
              }}
            />
            <div
              className="absolute rounded"
              style={{
                width: "60%",
                height: "35%",
                left: "15%",
                bottom: "10%",
                border: "2px solid #5D4037",
              }}
            />
          </div>

          {/* Right door panel */}
          <div
            className="absolute top-0 right-0 h-full transition-transform duration-1000 ease-in-out"
            style={{
              width: "50%",
              background: "linear-gradient(to left, #6D4C41, #795548)",
              borderLeft: "1px solid #4E342E",
              transform: doorOpen ? "rotateY(100deg)" : "rotateY(0deg)",
              transformOrigin: "right center",
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: 8,
                height: 8,
                background: "#FFD54F",
                left: 10,
                top: "50%",
                boxShadow: "0 0 6px #FFD54F",
              }}
            />
            <div
              className="absolute rounded"
              style={{
                width: "60%",
                height: "35%",
                right: "15%",
                top: "10%",
                border: "2px solid #5D4037",
              }}
            />
            <div
              className="absolute rounded"
              style={{
                width: "60%",
                height: "35%",
                right: "15%",
                bottom: "10%",
                border: "2px solid #5D4037",
              }}
            />
          </div>

          {/* Light behind door */}
          <div
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              background:
                "radial-gradient(ellipse at center, #FFD54F 0%, #FF8F00 40%, transparent 70%)",
              opacity: doorOpen ? 0.6 : 0,
              zIndex: -1,
            }}
          />
        </div>

        {/* Door threshold */}
        <div
          className="rounded-b"
          style={{
            width: 208,
            height: 8,
            background: "#4E342E",
            border: "2px solid #8D6E63",
            borderTop: "none",
          }}
        />

        {/* Win message */}
        <div
          className="mt-8 text-center transition-all duration-700"
          style={{
            opacity: showMessage ? 1 : 0,
            transform: showMessage ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <h1
            className="text-4xl font-bold mb-2"
            style={{
              color: "#FFD54F",
              fontFamily: "Georgia, serif",
              textShadow: "0 2px 8px rgba(255,213,79,0.5)",
            }}
          >
            Door Opened!
          </h1>
          <p className="text-lg mb-1" style={{ color: "#D7CCC8" }}>
            Puzzle solved in {formatTime(timeTakenMs)}
          </p>
          <p className="text-sm mb-6" style={{ color: "#A1887F" }}>
            The gears aligned perfectly.
          </p>
          <button
            onClick={onContinue}
            className="px-8 py-3 rounded-lg font-bold text-lg cursor-pointer transition-colors"
            style={{
              background: "linear-gradient(to bottom, #FFD54F, #FF8F00)",
              color: "#3E2723",
              border: "2px solid #FFB300",
              boxShadow: "0 4px 12px rgba(255,183,0,0.3)",
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
