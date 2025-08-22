
/**
 * @fileoverview This file contains the logic for creating a new team for a user when they sign up.
 * This is a trigger-based flow that runs on Firebase Auth events.
 */
'use server';

import { onUserCreate } from '@genkit-ai/firebase/functions';
import { UserRecord } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export const teamOnboarder = onUserCreate(
  {
    name: 'teamOnboarder',
  },
  async (user: UserRecord): Promise<void> => {
    const db = getFirestore();
    const batch = db.batch();

    // Create a new team document.
    const teamRef = db.collection('teams').doc();
    batch.set(teamRef, {
      name: 'Mon Club',
      createdAt: Timestamp.now(),
    });

    // Create a new user document and link it to the new team.
    const userRef = db.collection('users').doc(user.uid);
    batch.set(userRef, {
      email: user.email,
      teamId: teamRef.id,
    });

    await batch.commit();
  }
);
