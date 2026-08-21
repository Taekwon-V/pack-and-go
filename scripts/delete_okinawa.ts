import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';

// Need a simple config here or reuse existing
import { db } from '../src/lib/firebase';

async function deleteOkinawaTrips() {
  try {
    const tripsRef = collection(db, 'trips');
    const q = query(tripsRef, where('title', '>=', '오키나와'), where('title', '<=', '오키나와\uf8ff'));
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No Okinawa trips found.');
      return;
    }

    console.log(`Found ${snapshot.size} trips to delete.`);

    for (const d of snapshot.docs) {
      const tripId = d.id;
      console.log(`Deleting trip: ${d.data().title} (${tripId})`);

      // Delete subcollections
      const subcollections = ['itineraries', 'budgets', 'photos', 'comments'];
      for (const sub of subcollections) {
        const subSnap = await getDocs(collection(db, `trips/${tripId}/${sub}`));
        for (const subDoc of subSnap.docs) {
          await deleteDoc(subDoc.ref);
        }
        console.log(`Deleted ${subSnap.size} documents from ${sub} subcollection.`);
      }

      // Delete the trip itself
      await deleteDoc(d.ref);
      console.log(`Successfully deleted trip ${tripId}.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting trips:', error);
    process.exit(1);
  }
}

deleteOkinawaTrips();
