import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import LevelEditor from "../Editor/LevelEditor";

export default function EditorPage() {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return <LevelEditor onBack={handleBack} />;
}
