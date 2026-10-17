

"use client";

import { useRouter } from "next/navigation";
import { useSports } from "@/Context/SportsContext";
import { authClient } from "@/lib/auth-client";
import { getApplicationStatus } from "@/services/venueApplication";
import { useState } from "react";
import toast from "react-hot-toast";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setshowsignin, setshowsignup } = useSports();
  const router = useRouter();

  const redirectOwner = async () => {
    try {
      const { status } = await getApplicationStatus();

      if (status === "APPROVED") {
        router.push("/venueDashboard");
      } else if (status === null) {         
        // Owner account without an application yet
        router.push("/venueApplication");
      } else {
        // PENDING or REJECTED: stay on the landing page,
        // the navbar shows the "Check your status" button
        router.push("/");
      }
    } catch {
      router.push("/");
    }
  };

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
        setshowsignin(false);

        const role = response.data.user.role;

        if (role === "PLAYER") {
          router.push("/dashboard");
        } else if (role === "OWNER") {
          await redirectOwner();
        } else if (role === "ADMIN") {
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

