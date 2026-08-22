/* eslint-disable @typescript-eslint/no-require-imports */
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

async function seedPhuQuocTrip() {
  const tripId = 'phu-quoc-sunset-paradise';
  const ownerEmail = 'inchul17.kim@gmail.com';
  
  let ownerId = 'admin';
  try {
    const userRecord = await adminAuth.getUserByEmail(ownerEmail);
    ownerId = userRecord.uid;
    console.log(`Found owner: ${ownerId} (${ownerEmail})`);
  } catch {
    console.log(`User ${ownerEmail} not found, using fallback ownerId: admin`);
  }

  console.log(`Seeding Phu Quoc Trip: ${tripId}...`);

  await adminDb.collection('trips').doc(tripId).set({
    title: '에메랄드 바다와 황금빛 노을, 베트남 푸꾸옥 힐링 바캉스',
    destination: '베트남 푸꾸옥 (Phu Quoc, Vietnam)',
    startDate: new Date('2027-11-12T09:00:00Z'),
    endDate: new Date('2027-11-16T18:00:00Z'),
    ownerId: ownerId,
    collaboratorIds: [],
    collaboratorEmails: ['tour.mate@gmail.com', 'traveler.vn@gmail.com'],
    concept: '동양의 진주 푸꾸옥, 선셋 비치와 야시장, 럭셔리 리조트에서 누리는 온전한 휴식',
    destinationDesc: `베트남 최남단에 위치한 청정 휴양섬 푸꾸옥입니다. 세계 최장 해상 케이블카를 타고 만나는 혼똔섬, 핑크빛으로 물드는 롱비치 선셋, 신선한 해산물이 가득한 즈엉동 야시장과 사파리까지 다채로운 매력이 펼쳐집니다.`,
    weatherDesc: '11월 건기 시작 평균 기온 27~30℃. 맑고 청명한 하늘과 잔잔한 에메랄드빛 바다',
    clothingDesc: '시원한 린넨 셔츠, 원피스, 수영복, 래시가드, 선글라스와 라탄 모자, 편안한 샌들',
    mapQuery: 'Phu Quoc, Vietnam',
    gallery: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1000&auto=format&fit=crop&q=80'
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'planning'
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
      date: new Date('2027-11-12T09:00:00Z'),
      activities: [
        { time: '11:30 AM', title: '푸꾸옥 국제공항 도착 & 리조트 픽업', location: '푸꾸옥 국제공항', description: '따스한 남국의 햇살을 맞이하며 4인 전용 픽업 밴 탑승 및 이동', costEstimate: 0, mapQuery: 'Phu Quoc International Airport' },
        { time: '01:00 PM', title: '인터컨티넨탈 푸꾸옥 롱비치 체크인', location: 'InterContinental Phu Quoc Long Beach Resort', description: '오션뷰 객실 2개 체크인 후 프라이빗 비치 산책 및 웰컴 드링크', costEstimate: 0, mapQuery: 'InterContinental Phu Quoc Long Beach Resort' },
        { time: '05:30 PM', title: 'INK 360 루프탑 선셋 칵테일', location: 'INK 360 Rooftop Bar', description: '푸꾸옥에서 가장 높은 19층 루프탑에서 4인이 즐기는 환상적인 롱비치 일몰과 시그니처 칵테일', costEstimate: 120000, mapQuery: 'INK 360 Phu Quoc' },
        { time: '07:30 PM', title: '즈엉동 야시장 해산물 바비큐 디너', location: 'Phu Quoc Night Market', description: '신선한 랍스터 구이, 가리비 버터구이와 시원한 사이공 맥주 4인 만찬', costEstimate: 180000, mapQuery: 'Phu Quoc Night Market' }
      ]
    },
    {
      dayNumber: 2,
      date: new Date('2027-11-13T09:00:00Z'),
      activities: [
        { time: '09:30 AM', title: '혼똔섬 세계 최장 해상 케이블카', location: 'Sun World Hon Thom Nature Park', description: '7.9km 바다 위를 가로지르는 케이블카에서 바라보는 에메랄드빛 군도 파노라마 (4인)', costEstimate: 140000, mapQuery: 'Hon Thom Cable Car Station' },
        { time: '11:30 AM', title: '아쿠아토피아 워터파크 & 혼똔 비치', location: 'Aquatopia Water Park', description: '열대 테마의 익사이팅 워터 슬라이드와 야자수 그늘 아래 해변 휴식', costEstimate: 0, mapQuery: 'Aquatopia Water Park Phu Quoc' },
        { time: '03:30 PM', title: '사오 비치 (Sao Beach) 화이트 샌드', location: 'Sao Beach Phu Quoc', description: '밀가루처럼 부드러운 백사장 산책, 썬베드 휴식 및 야자수 그네 인생샷 촬영', costEstimate: 40000, mapQuery: 'Sao Beach Phu Quoc' },
        { time: '06:30 PM', title: '선셋 사나토 비치 클럽 디너', location: 'Sunset Sanato Beach Club', description: '바다 위 조형물 너머로 지는 석양과 함께하는 비치사이드 4인 디너', costEstimate: 200000, mapQuery: 'Sunset Sanato Beach Club' }
      ]
    },
    {
      dayNumber: 3,
      date: new Date('2027-11-14T09:00:00Z'),
      activities: [
        { time: '09:00 AM', title: '빈펄 사파리 & 기린 레스토랑', location: 'Vinpearl Safari Phu Quoc', description: '아시아 최대 오픈 사파리 4인 투어 및 기린에게 직접 먹이를 주며 즐기는 브런치', costEstimate: 170000, mapQuery: 'Vinpearl Safari Phu Quoc' },
        { time: '01:30 PM', title: '그랜드월드 베네치아 곤돌라 투어', location: 'Grand World Phu Quoc', description: '알록달록한 유럽풍 수상도시 운하를 따라 낭만적인 곤돌라 유람 (2척/4인)', costEstimate: 60000, mapQuery: 'Grand World Phu Quoc' },
        { time: '04:30 PM', title: '푸꾸옥 오일 마사지 & 스파', location: 'La Veranda Resort Spa', description: '천연 아로마 오일로 여행의 피로를 풀어주는 4인 동시 90분 릴랙싱 전신 케어', costEstimate: 160000, mapQuery: 'La Veranda Resort Phu Quoc' },
        { time: '08:00 PM', title: '그랜드월드 분수 레이저 쇼 관람', location: 'The Charm of Venice Grand World', description: '호수 위에서 펼쳐지는 화려한 조명과 분수, 수상 오페라 퍼포먼스', costEstimate: 0, mapQuery: 'Grand World Phu Quoc' }
      ]
    },
    {
      dayNumber: 4,
      date: new Date('2027-11-15T09:00:00Z'),
      activities: [
        { time: '09:30 AM', title: '남부 3개 섬 스노클링 호핑 투어', location: 'An Thoi Islands', description: '4인 프라이빗 스피드보트로 감기섬, 핑거네일섬, 메이룻섬의 맑은 바다 산호초와 열대어 탐험', costEstimate: 240000, mapQuery: 'An Thoi Islands Phu Quoc' },
        { time: '01:00 PM', title: '무인도 프라이빗 선상 시푸드 런치', location: 'May Rut Island', description: '갓 낚아 올린 싱싱한 해산물과 열대 과일 뷔페 (투어 포함)', costEstimate: 0, mapQuery: 'May Rut Island Phu Quoc' },
        { time: '04:00 PM', title: '리조트 인피니티 풀 & 카바나 휴식', location: 'InterContinental Resort Pool', description: '해질녘 바다와 맞닿은 인피니티 풀에서 즐기는 여유로운 물놀이', costEstimate: 0, mapQuery: 'InterContinental Phu Quoc Long Beach Resort' },
        { time: '07:00 PM', title: '세일링 클럽 푸꾸옥 비치 파티 & 파이어 쇼', location: 'Sailing Club Phu Quoc', description: '해변 모래사장 위에서 펼쳐지는 불쇼와 디제잉, 지중해식 프리미엄 BBQ 4인 디너 & 와인', costEstimate: 240000, mapQuery: 'Sailing Club Phu Quoc' }
      ]
    },
    {
      dayNumber: 5,
      date: new Date('2027-11-16T09:00:00Z'),
      activities: [
        { time: '10:00 AM', title: '킹콩마트 특산품 쇼핑', location: 'Kingkong Mart Phu Quoc', description: '푸꾸옥 최고급 통후추, 슈슈 땅콩, 진주, 건망고 등 2커플 기념품 쇼핑', costEstimate: 300000, mapQuery: 'Kingkong Mart Phu Quoc' },
        { time: '12:30 PM', title: '망고베이 온더락스 오션뷰 런치', location: 'On The Rocks Restaurant Phu Quoc', description: '파도가 부서지는 바위 위 야외 테라스에서 즐기는 4인 마지막 만찬', costEstimate: 150000, mapQuery: 'On The Rocks Restaurant Phu Quoc' },
        { time: '03:30 PM', title: '공항 이동 및 아쉬운 귀국', location: '푸꾸옥 국제공항', description: '기념품 정리 및 면세점 방문 후 인천행 항공기 탑승', costEstimate: 0, mapQuery: 'Phu Quoc International Airport' }
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
  console.log(`Seeded ${dailyPlans.length} daily itineraries for Phu Quoc.`);

  const budgets = adminDb.collection('trips').doc(tripId).collection('budgets');
  
  // Clear existing
  const existingBudgets = await budgets.get();
  const batch2 = adminDb.batch();
  existingBudgets.forEach(doc => batch2.delete(doc.ref));
  await batch2.commit();

  const budgetData = {
    totalBudget: 7800000, // 7,800,000 KRW (4인 / 부부 2쌍 기준)
    currency: 'KRW',
    expenses: [
      { id: 'exp_pq_1', category: 'flight', amount: 2800000, description: '대한항공/비엣젯 인천-푸꾸옥 왕복 항공권 4인 (1인당 70만원)', date: new Date('2027-09-10T00:00:00Z'), paidBy: ownerId },
      { id: 'exp_pq_2', category: 'accommodation', amount: 2700000, description: '인터컨티넨탈 푸꾸옥 롱비치 리조트 오션뷰 객실 2개 * 4박 (조식 포함)', date: new Date('2027-09-20T00:00:00Z'), paidBy: ownerId },
      { id: 'exp_pq_3', category: 'transport', amount: 250000, description: '공항 프라이빗 밴 픽업/샌딩 및 7인승 그랩(Grab) 이동 경비', date: new Date('2027-11-12T00:00:00Z'), paidBy: ownerId },
      { id: 'exp_pq_4', category: 'food', amount: 950000, description: '4인 미식 비용 (야시장 해산물 만찬, INK 360 루프탑, 선셋 BBQ, 온더락스 런치 등)', date: new Date('2027-11-15T00:00:00Z'), paidBy: ownerId },
      { id: 'exp_pq_5', category: 'activity', amount: 750000, description: '4인 투어/액티비티 (혼똔섬 케이블카, 빈펄 사파리, 3개섬 프라이빗 호핑, 90분 스파)', date: new Date('2027-11-14T00:00:00Z'), paidBy: ownerId },
      { id: 'exp_pq_6', category: 'shopping', amount: 350000, description: '킹콩마트 특산품 쇼핑 및 공용 예비비 (통후추, 슈슈땅콩, 진주 등)', date: new Date('2027-11-16T00:00:00Z'), paidBy: ownerId }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await budgets.add(budgetData);
  console.log(`Seeded budget document with ${budgetData.expenses.length} expenses.`);

  console.log('Successfully completed seeding Phu Quoc Trip!');
}

seedPhuQuocTrip().catch(console.error);
