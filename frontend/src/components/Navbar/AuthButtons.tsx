import { LogIn, UserPlus } from "lucide-react";

import Button from "../Button/Button";
import { useNavigate } from "react-router-dom";

export default function AuthButtons() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
        <LogIn size={15} />
        Login
      </Button>
      <Button variant="primary" size="sm" onClick={() => navigate("/register")}>
        <UserPlus size={15} />
        Register
      </Button>
    </div>
  );
}
