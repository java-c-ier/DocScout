import { useEffect } from "react";
import { useNavigate } from "react-router";

function SignUp() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/signin?tab=signup", { replace: true });
  }, [navigate]);
  return null;
}

export default SignUp;
