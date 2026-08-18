const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1').replace(/\\n/g, '\n').trim();
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

const adminDb = getFirestore();
const adminAuth = getAuth();

async function seedOkinawa40s() {
  const tripId = 'okinawa_40s_last';
  const ownerEmail = 'inchul17.kim@gmail.com';
  
  let ownerId = 'admin'; // fallback
  try {
    const userRecord = await adminAuth.getUserByEmail(ownerEmail);
    ownerId = userRecord.uid;
    console.log(`Found owner: ${ownerId}`);
  } catch (error) {
    console.log(`User ${ownerEmail} not found, using fallback ownerId: admin`);
  }

  console.log(`Seeding revised trip: ${tripId}...`);

  await adminDb.collection('trips').doc(tripId).set({
    title: '40대의 마지막 오키나와',
    destination: '오키나와 (나하 & 차탄)',
    startDate: new Date('2027-09-17T09:00:00Z'),
    endDate: new Date('2027-09-20T18:00:00Z'),
    ownerId: ownerId,
    collaboratorIds: [],
    concept: '맛있는 일본 여행, 이동 최소화, 그리고 오키나와의 여유',
    clothingDesc: '초가을의 선선한 바람이 부는 날씨. 반팔 위주의 가벼운 옷차림과 저녁을 위한 가벼운 외투',
    mapQuery: 'Chatan, Okinawa',
    gallery: [
      '/gallery/1.jpg',
      '/gallery/2.png',
      '/gallery/3.jpg',
      '/gallery/4.jpg'
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active'
  });

  const itineraries = adminDb.collection('trips').doc(tripId).collection('itineraries');
  
  // Clear existing
  const existingItineraries = await itineraries.get();
  const batch1 = adminDb.batch();
  existingItineraries.forEach(doc => batch1.delete(doc.ref));
  await batch1.commit();

  const dailyPlans = [
    {
      dayNumber: 1,
      date: new Date('2027-09-17T09:00:00Z'),
      activities: [
        { time: '11:00 AM', title: '오키나와 나하 공항 도착', location: '나하 공항', description: '렌터카 수령 후 도심으로 이동', costEstimate: 5000, mapQuery: 'Naha Airport' },
        { time: '01:00 PM', title: '우미카지 테라스 점심', location: '우미카지 테라스', description: '탁 트인 바다를 보며 즐기는 첫 식사', costEstimate: 6000, mapQuery: 'Umikaji Terrace' },
        { time: '03:30 PM', title: '국제거리 호텔 체크인', location: '하얏트 리젠시 나하', description: '도심 중심에 위치한 호텔에서 짐 풀기 및 휴식', costEstimate: 0, mapQuery: 'Hyatt Regency Naha' },
        { time: '07:00 PM', title: '철판구이 스테이크 만찬', location: '국제거리 데판야끼 식당', description: '셰프의 퍼포먼스가 어우러진 맛있는 저녁', costEstimate: 20000, mapQuery: 'Kokusai Dori Steak' }
      ]
    },
    {
      dayNumber: 2,
      date: new Date('2027-09-18T09:00:00Z'),
      activities: [
        { time: '10:00 AM', title: '도자기 마을 산책', location: '츠보야 야치문 도리', description: '나하 시내의 예쁜 도자기 골목 구경', costEstimate: 0, mapQuery: 'Tsuboya Yachimun Dori' },
        { time: '12:30 PM', title: '차탄으로 이동 및 런치', location: '중부 소바 맛집', description: '오키나와 현지 소바 맛보기', costEstimate: 4000, mapQuery: 'Chatan Soba' },
        { time: '02:30 PM', title: '아메리칸 빌리지 숙소 체크인', location: '힐튼 오키나와 차탄', description: '이국적인 미국 느낌이 물씬 나는 해안가 리조트', costEstimate: 0, mapQuery: 'Hilton Okinawa Chatan' },
        { time: '04:30 PM', title: '아메리칸 빌리지 구경', location: '아메리칸 빌리지', description: '선셋 비치를 산책하며 즐기는 인생샷 타임', costEstimate: 2000, mapQuery: 'American Village Okinawa' },
        { time: '07:00 PM', title: '해변가 이탈리안 디너', location: '차탄 오션뷰 레스토랑', description: '바닷바람과 함께하는 와인과 해산물', costEstimate: 18000, mapQuery: 'Chatan Sunset Restaurant' }
      ]
    },
    {
      dayNumber: 3,
      date: new Date('2027-09-19T09:00:00Z'),
      activities: [
        { time: '10:30 AM', title: '요미탄 힐링 드라이브', location: '잔파곶', description: '기암절벽과 푸른 바다, 하얀 등대가 있는 중부 절경', costEstimate: 0, mapQuery: 'Cape Zanpa' },
        { time: '01:00 PM', title: '오션뷰 절벽 카페 런치', location: '호시노 리조트 반타 카페', description: '바다 전망이 일품인 카페에서의 티타임', costEstimate: 5000, mapQuery: 'Hoshino Resorts Banta Cafe' },
        { time: '03:00 PM', title: '리조트 수영장 휴식', location: '힐튼 오키나와 차탄', description: '따뜻한 수영장에서의 진정한 여유', costEstimate: 0, mapQuery: 'Hilton Okinawa Chatan' },
        { time: '06:00 PM', title: '차탄 마리나 프라이빗 요트', location: '차탄 마리나', description: '우리만의 요트에서 즐기는 환상적인 일몰 투어', costEstimate: 30000, mapQuery: 'Chatan Marina' },
        { time: '08:00 PM', title: '아구 돼지 샤브샤브 디너', location: '차탄 샤브샤브 전문점', description: '고소한 흑돼지 샤브샤브와 함께하는 밤', costEstimate: 15000, mapQuery: 'Chatan Agu Pork' }
      ]
    },
    {
      dayNumber: 4,
      date: new Date('2027-09-20T09:00:00Z'),
      activities: [
        { time: '10:00 AM', title: '아라하 비치 산책', location: '아라하 비치', description: '눈부신 하얀 모래사장 산책 후 체크아웃', costEstimate: 0, mapQuery: 'Araha Beach' },
        { time: '12:00 PM', title: '나하 공항 인근 이온몰', location: '이온몰 오키나와 나하', description: '기념품과 주전부리 마지막 쇼핑', costEstimate: 10000, mapQuery: 'AEON Naha' },
        { time: '03:00 PM', title: '공항 도착 및 렌터카 반납', location: '나하 공항', description: '여유로운 귀국길, 다음 여행을 기약하며', costEstimate: 0, mapQuery: 'Naha Airport' }
      ]
    }
  ];

  for (const day of dailyPlans) {
    await itineraries.add({
      ...day,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  console.log(`Seeded ${dailyPlans.length} itineraries.`);

  const budgets = adminDb.collection('trips').doc(tripId).collection('budgets');
  
  // Clear existing
  const existingBudgets = await budgets.get();
  const batch2 = adminDb.batch();
  existingBudgets.forEach(doc => batch2.delete(doc.ref));
  await batch2.commit();

  const budgetItems = [
    { category: 'flights', amount: 1500000, description: '4인 왕복 항공권 (대한항공)', date: new Date('2027-07-01T00:00:00Z'), paidBy: ownerId },
    { category: 'accommodation', amount: 2000000, description: '하얏트 1박 + 힐튼 2박 (럭셔리 오션뷰 객실 2개)', date: new Date('2027-07-05T00:00:00Z'), paidBy: ownerId },
    { category: 'transport', amount: 400000, description: '알파드 렌터카 4일 (중/남부만 이동, 유류비 절감)', date: new Date('2027-08-01T00:00:00Z'), paidBy: ownerId },
    { category: 'food', amount: 1200000, description: '4일간의 최고급 미식 비용 (식비 전체 예상)', date: new Date('2027-09-20T00:00:00Z'), paidBy: ownerId },
    { category: 'activities', amount: 300000, description: '차탄 프라이빗 요트 선셋 투어', date: new Date('2027-09-10T00:00:00Z'), paidBy: ownerId },
    { category: 'shopping', amount: 300000, description: '공동 쇼핑 예산 (도자기 등 아기자기한 소품)', date: new Date('2027-09-17T00:00:00Z'), paidBy: ownerId }
  ];

  for (const item of budgetItems) {
    await budgets.add({
      ...item,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  console.log(`Seeded ${budgetItems.length} budget items.`);

  console.log('Successfully completed seeding REVISED 40s Okinawa Trip!');
}

seedOkinawa40s().catch(console.error);
