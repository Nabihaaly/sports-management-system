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
    <div className="modal-backdrop" onClick={() => setshowsignin(false)}>
      <div
        className="modal relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setshowsignin(false)}
          aria-label="Close"
          className="btn-ghost absolute right-4 top-4 h-9 w-9 px-0 py-0"
        >
          ✕
        </button>

        <p className="eyebrow">Welcome back</p>
        <h2
          id="signin-title"
          className="mt-2 font-heading text-3xl font-black uppercase leading-[0.95] tracking-tight text-ink"
        >
          Sign in
        </h2>
        <p className="mt-1 text-sm text-muted">Pick up where your last game left off.</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSignin();
          }}
        >
          <div>
            <label htmlFor="signin-email" className="label">
              Email
            </label>
            <input
              id="signin-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="signin-password" className="label">
              Password
            </label>
            <input
              id="signin-password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            Sign in
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          New to Court Connect?{" "}
          <button
            type="button"
            className="font-semibold text-ink underline underline-offset-4 transition hover:text-forest"
            onClick={() => {
              setshowsignin(false);
              setshowsignup(true);
            }}
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signin;
