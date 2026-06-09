import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
dotenv.config();

const app = initializeApp();

async function createAdmin() {
  const email = 'admin@tabiiy-non.uz';
  const password = 'admin-password-123';

  try {
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: 'Admin Tabiiy Non',
    });
    
    console.log('Successfully created new user:', userRecord.uid);
    
    await getAuth().setCustomUserClaims(userRecord.uid, { admin: true });
    
    console.log('Successfully added admin claims to user');
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      console.log('Admin user already exists. Updating claims...');
      const userRecord = await getAuth().getUserByEmail(email);
      await getAuth().setCustomUserClaims(userRecord.uid, { admin: true });
      console.log('Successfully updated admin claims');
    } else {
      console.error('Error creating new user:', error);
    }
  }
}

createAdmin();
