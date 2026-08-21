/* eslint-disable @typescript-eslint/no-require-imports */
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1').replace(/\\n/g, '\n');
  return acc;
}, {});

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: envConfig.FIREBASE_PROJECT_ID || envConfig.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: envConfig.FIREBASE_CLIENT_EMAIL,
      privateKey: envConfig.FIREBASE_PRIVATE_KEY
    })
  });
}

const db = getFirestore();

async function seedTripDetails() {
  const tripId = 'okinawa-sample-trip';
  const tripRef = db.collection('trips').doc(tripId);

  try {
    const doc = await tripRef.get();
    if (!doc.exists) {
      console.error(`Trip ${tripId} does not exist. Please run seed-trips.ts first.`);
      return;
    }

    console.log(`Seeding details for trip: ${tripId}`);

    // --- 1. Seed Itineraries ---
    const itinerariesRef = tripRef.collection('itineraries');
    
    // Clear existing itineraries
    const existingItineraries = await itinerariesRef.get();
    const batch = db.batch();
    existingItineraries.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    const itineraries = [
      {
        dayNumber: 1,
        date: new Date('2024-03-30T09:00:00Z'),
        activities: [
          { time: '10:00 AM', title: '나하 공항 도착', location: '나하 공항', description: '렌터카 수령 및 오키나와 여행 시작', costEstimate: 0, mapQuery: 'Naha Airport' },
          { time: '12:30 PM', title: '우미카지 테라스 점심', location: '우미카지 테라스', description: '탁 트인 바다를 보며 햄버거/팬케이크 식사', costEstimate: 3000, mapQuery: 'Umikaji Terrace Senagajima' },
          { time: '03:00 PM', title: '슈리성 공원 산책', location: '슈리성 공원', description: '류큐 왕국의 숨결을 느낄 수 있는 세계문화유산', costEstimate: 800, mapQuery: 'Shurijo Castle' },
          { time: '06:00 PM', title: '국제거리 구경 및 저녁식사', location: '국제거리', description: '나하의 명동, 각종 기념품샵과 맛집 탐방', costEstimate: 5000, mapQuery: 'Kokusai Dori' }
        ]
      },
      {
        dayNumber: 2,
        date: new Date('2024-03-31T09:00:00Z'),
        activities: [
          { time: '09:00 AM', title: '만좌모 아침 산책', location: '만좌모', description: '만 명이 앉을 수 있는 벌판, 코끼리 코 모양의 바위', costEstimate: 0, mapQuery: 'Cape Manzamo' },
          { time: '11:00 AM', title: '푸른 동굴 스노클링', location: '마에다 곶', description: '투명하고 푸른 바다에서 열대어와 함께 수영', costEstimate: 6000, mapQuery: 'Cape Maeda' },
          { time: '01:30 PM', title: '오키나와 소바 점심', location: '키시모토 식당', description: '오키나와 전통 소바 맛집', costEstimate: 1500, mapQuery: 'Kishimoto Shokudo' },
          { time: '03:30 PM', title: '츄라우미 수족관', location: '해양박 공원', description: '거대한 고래상어가 있는 세계 최대 규모의 수족관', costEstimate: 2180, mapQuery: 'Okinawa Churaumi Aquarium' }
        ]
      },
      {
        dayNumber: 3,
        date: new Date('2024-04-01T09:00:00Z'),
        activities: [
          { time: '10:00 AM', title: '아메리칸 빌리지 구경', location: '아메리칸 빌리지', description: '미국 서해안 분위기가 물씬 풍기는 테마 구역', costEstimate: 0, mapQuery: 'Mihama American Village' },
          { time: '12:30 PM', title: '이온몰 쇼핑 및 점심', location: '이온몰 오키나와 라이카무', description: '오키나와 최대 규모의 쇼핑몰', costEstimate: 10000, mapQuery: 'AEON Mall Okinawa Rycom' },
          { time: '04:00 PM', title: '나하 공항으로 이동', location: '나하 공항', description: '렌터카 반납 및 귀국 준비', costEstimate: 0, mapQuery: 'Naha Airport' }
        ]
      }
    ];

    for (const day of itineraries) {
      await itinerariesRef.add({
        ...day,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    console.log(`Seeded ${itineraries.length} daily itineraries.`);

    // --- 2. Seed Budgets ---
    const budgetsRef = tripRef.collection('budgets');
    
    // Clear existing
    const existingBudgets = await budgetsRef.get();
    const batch2 = db.batch();
    existingBudgets.forEach(doc => {
      batch2.delete(doc.ref);
    });
    await batch2.commit();

    const budgetData = {
      totalBudget: 150000, // 150,000 JPY
      currency: 'JPY',
      expenses: [
        { id: 'exp1', category: 'flight', amount: 45000, description: '제주항공 왕복 2인', date: new Date('2024-02-15T10:00:00Z'), paidBy: 'owner' },
        { id: 'exp2', category: 'accommodation', amount: 32000, description: '나하 시내 호텔 2박', date: new Date('2024-02-16T14:00:00Z'), paidBy: 'owner' },
        { id: 'exp3', category: 'transport', amount: 15000, description: '도요타 렌터카 3일', date: new Date('2024-02-17T09:00:00Z'), paidBy: 'owner' },
        { id: 'exp4', category: 'food', amount: 8500, description: '우미카지 테라스 점심', date: new Date('2024-03-30T13:00:00Z'), paidBy: 'owner' },
        { id: 'exp5', category: 'activity', amount: 12000, description: '푸른 동굴 스노클링 2인', date: new Date('2024-03-31T12:00:00Z'), paidBy: 'owner' },
        { id: 'exp6', category: 'food', amount: 5500, description: '국제거리 저녁 식사 및 맥주', date: new Date('2024-03-30T19:00:00Z'), paidBy: 'owner' },
        { id: 'exp7', category: 'shopping', amount: 10000, description: '이온몰 기념품', date: new Date('2024-04-01T14:00:00Z'), paidBy: 'owner' }
      ],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await budgetsRef.add(budgetData);
    console.log('Seeded budget with 7 expenses.');

    console.log('Seed completed successfully!');

  } catch (error) {
    console.error('Error seeding trip details:', error);
  }
}

seedTripDetails();
