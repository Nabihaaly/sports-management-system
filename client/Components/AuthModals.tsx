"use client";

import { useSports } from "@/Context/SportsContext";
import Signin from "./Signin";
import Signup from "./Signup";

// Modals layout level pe render hote hain (Navbar ke andar nahi):
// header pe backdrop-blur hai, jo position:fixed ko header ke andar qaid kar deta tha.
const AuthModals = () => {
  const { showsignin, showsignup, isLoggedIn } = useSports();
  if (isLoggedIn) return null;
  return (
    <>
      {showsignin && <Signin />}
      {showsignup && <Signup />}
    </>
  );
};

export default AuthModals;
