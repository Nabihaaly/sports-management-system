"use client"
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const Signup = () => {
    const [email,setemail] = useState("");
    const [password,setpassword] = useState("");
    const [name,setname] = useState("");
    const router = useRouter();


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
    <div>
    Signup
    <input id='email' type="text" placeholder='email'
    value={email} 
      onChange={(e) => setemail(e.target.value)}/>

    <input id='name' type="text"  value={name} placeholder='username'
      onChange={(e) => setname(e.target.value)}/>
   
    <input id='password' type="text"  value={password}  placeholder='password'
      onChange={(e) => setpassword(e.target.value)}/>
    <button onClick={handlesignup}>signup</button>
    </div>
  )
}

export default Signup