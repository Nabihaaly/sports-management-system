"use client";

import { useRouter } from "next/navigation";
import { useSports } from "@/Context/SportsContext";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import toast from "react-hot-toast";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {setshowsignin,setshowsignup} = useSports();
  const router = useRouter();

  const handleSignin = async () => {
    try {
      const response = await authClient.signIn.email({
        email,
        password,
      });

      if (response.data) {
        toast.success(
          `Login successful! Welcome ${response.data.user.name}`
        );

        setEmail("");
        setPassword("");
        
        if (response.data.user.role === "PLAYER") {
          router.push("/dashboard");
        } else if (response.data.user.role === "OWNER") {
          router.push("/owner");
        } else if (response.data.user.role === "ADMIN") {
          router.push("/admin");
        } else {
          toast.error("User role not recognized");
        }
      } else {
        toast.error("Invalid email or password");
      }
    } catch (error) {
      toast.error("Login Failed");
    }
  };

  return (
    <div>
      <h2>Signin</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleSignin}>
        Signin
      </button>

      <p>Don't have an account? 
        <button 
        onClick={()=>{
          setshowsignin(false); 
          setshowsignup(true);}
        }>
            Signup</button></p>
    </div>
  );
};

export default Signin;
