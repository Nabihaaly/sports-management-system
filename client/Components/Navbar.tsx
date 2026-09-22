"use client"
import { useSports } from '@/Context/SportsContext';
import Signin from './Signin';
import Signup from './Signup';
import Signout from './Signout';
const Navbar = () => {
    const {showsignin,setshowsignin,showsignup,session,isLoggedIn} = useSports();

  return (
<div>
  <p>Navbar</p>

  {isLoggedIn ? (
    <div>
    <p>Welcome {session?.user.name}</p>
    <Signout/>
    </div>
  ) : (
    <div>
      <button onClick={() => setshowsignin(true)}>
        Signin button
      </button>

      {showsignin && <Signin />}
      {showsignup && <Signup />}
    </div>
  )}
</div>
  )
}

export default Navbar