
"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSports } from '@/Context/SportsContext';
import { getApplicationStatus, OwnerStatus } from '@/services/venueApplication';
import Signin from './Signin';
import Signup from './Signup';
import Signout from './Signout';

const Navbar = () => {
  const { showsignin, setshowsignin, showsignup, session, isLoggedIn } = useSports();
  const router = useRouter();

  const [ApplicationStatus, setApplicationStatus] = useState<OwnerStatus | null>(null);

  const isOwner = isLoggedIn && session?.user.role === 'OWNER';

  useEffect(() => {
    if (!isOwner) {
      setApplicationStatus(null);
      return;
    }

    let cancelled = false;

    getApplicationStatus()
      .then(({ status }) => {
        if (!cancelled) setApplicationStatus(status);
      })
      .catch(() => {
        if (!cancelled) setApplicationStatus(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isOwner, session?.user.id]);

  return (
    <div>
      <p>Navbar</p>

      {isLoggedIn ? (
        <div>
          <p>Welcome {session?.user.name}</p>

          {isOwner &&
            (ApplicationStatus === 'PENDING' ||
              ApplicationStatus === 'REJECTED') && (
              <button onClick={() => router.push('/applicationStatus')}>
                Check your status
              </button>
            )}

          {isOwner && ApplicationStatus === null && (
            <button onClick={() => router.push('/venueApplication')}>
              Fill Application
            </button>
          )}

          <Signout />
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
  );
};

export default Navbar;
