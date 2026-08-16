import { adminDb } from '../src/lib/firebaseAdmin';

async function main() {
  const tripId = 'okinawa_trip_123';
  
  await adminDb.collection('trips').doc(tripId).set({
    title: '오키나와 가족 여행',
    destination: '오키나와',
    startDate: new Date('2023-03-30T00:00:00Z'),
    endDate: new Date('2023-04-03T00:00:00Z'),
    ownerId: 'admin',
    collaboratorIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active'
  });

  const itineraries = adminDb.collection('trips').doc(tripId).collection('itineraries');

  await itineraries.add({
    dayNumber: 1,
    date: new Date('2023-03-30T00:00:00Z'),
    activities: [
      { time: '10:00', title: '슈리성', location: '슈리성' },
      { time: '15:00', title: '우미카지 테라스', location: '우미카지 테라스' }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await itineraries.add({
    dayNumber: 2,
    date: new Date('2023-03-31T00:00:00Z'),
    activities: [
      { time: '10:00', title: '오키나와 월드', location: '오키나와 월드' }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await itineraries.add({
    dayNumber: 3,
    date: new Date('2023-04-01T00:00:00Z'),
    activities: [
      { time: '10:00', title: '츄라우미 수족관', location: '츄라우미 수족관' }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('Seed completed.');
}

main().catch(console.error);
