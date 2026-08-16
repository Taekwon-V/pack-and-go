import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  try {
    const tripId = 'okinawa-sample-trip';
    const tripRef = doc(db, 'trips', tripId);
    
    await setDoc(tripRef, {
      title: '오키나와 가족 여행',
      destination: '오키나와, 일본',
      startDate: '2023-03-30',
      endDate: '2023-04-03',
      ownerId: 'admin_user', // Dummy
      collaboratorIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'planning'
    });

    const itinerariesRef = collection(db, `trips/${tripId}/itineraries`);
    
    await setDoc(doc(itinerariesRef, 'day1'), {
      dayNumber: 1,
      date: new Date('2023-03-30'),
      activities: [
        { time: '11:00', title: '도착, 입국 수속', location: '인천공항' },
        { time: '12:00', title: '렌터카 수령', location: '오키나와 공항' },
        { time: '13:00', title: '점심식사: 수이둔치', location: '슈리성 근처' },
        { time: '15:00', title: '슈리성 구경', location: '슈리성' },
        { time: '17:00', title: '저녁 식사: 우미카지 테라스', location: '우미카지 테라스' },
        { time: '19:00', title: '호텔 체크인', location: 'Hewitt Resort Naha' }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await setDoc(doc(itinerariesRef, 'day2'), {
      dayNumber: 2,
      date: new Date('2023-03-31'),
      activities: [
        { time: '09:00', title: '오키나와 월드', location: '오키나와 월드' },
        { time: '13:00', title: '미바루 해변에서 글라스보트', location: '미바루 해변' },
        { time: '15:00', title: '하마베노차야 카페', location: '카페' }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await setDoc(doc(itinerariesRef, 'day3'), {
      dayNumber: 3,
      date: new Date('2023-04-01'),
      activities: [
        { time: '09:00', title: '추라우미 수족관', location: '추라우미' },
        { time: '14:00', title: '코우리대교 (하트바위)', location: '코우리섬' },
        { time: '18:00', title: '저녁식사: 카진호', location: '식당' }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seed();
