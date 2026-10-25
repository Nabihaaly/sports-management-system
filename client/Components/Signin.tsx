"use client";

import { useRouter } from "next/navigation";
import { useSports } from "@/Context/SportsContext";
import { authClient } from "@/lib/auth-client";
import { getHomeRoute } from "@/lib/redirectAfterAuth";
import { useState } from "react";
import toast from "react-hot-toast";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setshowsignin, setshowsignup } = useSports();
  const router = useRouter();

  const handleSignin = async () => {
    try {
      const response = await authClient.signIn.email({ email, password });

      if (response.data) {
        toast.success(`Login successful! Welcome ${response.data.user.name}`);
        setEmail("");
        setPassword("");
        setshowsignin(false);

        const role = response.data.user.role;
        const route = await getHomeRoute(role);
        router.push(route);
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

      <button onClick={handleSignin}>Signin</button>

      <p>
        Don't have an account?
        <button
          onClick={() => {
            setshowsignin(false);
            setshowsignup(true);
          }}
        >
          Signup
        </button>
      </p>
    </div>
  );
};

export default Signin;