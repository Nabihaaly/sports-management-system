"use client"
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useSports } from "@/Context/SportsContext";

const Signup = () => {
    const [email,setemail] = useState("");
    const [password,setpassword] = useState("");
    const [name,setname] = useState("");
    const router = useRouter();
    const { setshowsignin, setshowsignup } = useSports();


    const handlesignup = async () => {
   try {
      const response = await authClient.signUp.email({
        email,
        password,
        name
      });
      if (response.data) {
        toast.success(`Signup successful! Welcome ${response.data.user.name}`);
        setemail("");
        setpassword("");
        setname("");
        router.push("/access");
      } else {
        toast.error("Signup failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => setshowsignup(false)}>
      <div
        className="modal relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setshowsignup(false)}
          aria-label="Close"
          className="btn-ghost absolute right-4 top-4 h-9 w-9 px-0 py-0"
        >
          ✕
        </button>

        <p className="eyebrow">Join the club</p>
        <h2
          id="signup-title"
          className="mt-2 font-heading text-3xl font-black uppercase leading-[0.95] tracking-tight text-ink"
        >
          Create your account
        </h2>
        <p className="mt-1 text-sm text-muted">Book courts, find rivals, go live.</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handlesignup();
          }}
        >
          <div>
            <label htmlFor="name" className="label">
              Name
            </label>
            <input
              id='name'
              type="text"
              placeholder='Your name'
              autoComplete="name"
              className="input"
              value={name}
              onChange={(e) => setname(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id='email'
              type="text"
              placeholder='you@example.com'
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setemail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id='password'
              type="password"
              placeholder='At least 8 characters'
              autoComplete="new-password"
              className="input"
              value={password}
              onChange={(e) => setpassword(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted">Use 8+ characters.</p>
          </div>

          <button type="submit" className="btn-primary w-full">
            Create account
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Already play?{" "}
          <button
            type="button"
            className="font-semibold text-ink underline underline-offset-4 transition hover:text-forest"
            onClick={() => {
              setshowsignup(false);
              setshowsignin(true);
            }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

export default Signup
