
import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useTeamId() {
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    let unsubscribe: (() => void) | null = null;

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (unsubscribe) {
          unsubscribe();
        }
        unsubscribe = onSnapshot(
          doc(db, 'users', user.uid),
          (snap) => {
            if (snap.exists() && snap.data().teamId) {
              setTeamId(snap.data().teamId);
            } else {
              setTeamId(null);
            }
          },
          (error) => {
            console.error("Error listening to user document:", error);
            setTeamId(null);
          }
        );
      } else {
        if (unsubscribe) {
          unsubscribe();
        }
        setTeamId(null);
      }
    });

    return () => {
      authUnsubscribe();
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return teamId;
}

    
