import { adminDb, adminAuth } from '../src/lib/firebaseAdmin';

async function seedOkinawa40s() {
  const tripId = 'okinawa_40s_last';
  const ownerEmail = 'inchul17.kim@gmail.com';
  
  let ownerId = 'admin'; // fallback
  try {
    const userRecord = await adminAuth.getUserByEmail(ownerEmail);
    ownerId = userRecord.uid;
    console.log(`Found owner: ${ownerId}`);
  } catch {
    console.log(`User ${ownerEmail} not found, using fallback ownerId: admin`);
  }

  console.log(`Seeding trip: ${tripId}...`);

  await adminDb.collection('trips').doc(tripId).set({
    title: '푸른 바람 부는 오키나와에서',
    destination: '오키나와',
    startDate: new Date('2027-09-17T09:00:00Z'),
    endDate: new Date('2027-09-20T18:00:00Z'),
    ownerId: ownerId,
    collaboratorIds: [],
    concept: '맛있는 일본 여행, 여유와 평안함, 그리고 오키나와의 정취',
    clothingDesc: '초가을의 선선한 바람이 부는 날씨. 반팔 위주의 가벼운 옷차림과 저녁을 위한 가벼운 외투',
    mapQuery: 'Okinawa',
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
        { time: '11:00 AM', title: '오키나와 나하 공항 도착', location: '나하 공항', description: '렌터카 수령 및 여정의 시작. 고급 알파드 렌트 완료.', costEstimate: 10000, mapQuery: 'Naha Airport' },
        { time: '01:00 PM', title: '이토만 해산물 식당 점심', location: '이토만 어민식당', description: '신선한 로컬 해산물 덮밥과 버터구이 생선', costEstimate: 6000, mapQuery: 'Itoman Gyomin Shokudo' },
        { time: '03:30 PM', title: '최고급 해변 리조트 체크인', location: '할레쿨라니 오키나와', description: '탁 트인 오션뷰와 조용한 휴식을 위한 럭셔리 리조트', costEstimate: 0, mapQuery: 'Halekulani Okinawa' },
        { time: '07:00 PM', title: '전통 류큐 요리 저녁식사', location: '나키진 촌 인근 요정', description: '잔잔한 샤미센 음악과 함께 즐기는 코스 요리와 아와모리 한 잔', costEstimate: 20000, mapQuery: 'Nakijin Okinawa' }
      ]
    },
    {
      dayNumber: 2,
      date: new Date('2027-09-18T09:00:00Z'),
      activities: [
        { time: '09:00 AM', title: '리조트 조식 및 산책', location: '할레쿨라니 오키나와', description: '파도 소리를 들으며 즐기는 여유로운 아침', costEstimate: 0, mapQuery: 'Halekulani Okinawa' },
        { time: '11:30 AM', title: '코우리 대교 드라이브', location: '코우리 섬', description: '에메랄드빛 바다 위를 가로지르는 드라이브 코스', costEstimate: 0, mapQuery: 'Kouri Bridge' },
        { time: '01:00 PM', title: '흑돼지 아구 샤브샤브 점심', location: '아구돈테이', description: '입에서 녹는 오키나와 특산물 아구 돼지', costEstimate: 12000, mapQuery: 'Okinawa Agu pork' },
        { time: '03:30 PM', title: '비세자쿠라 가로수길 산책', location: '비세노 후쿠기 가로수길', description: '오래된 나무들 사이로 불어오는 힐링 바람', costEstimate: 0, mapQuery: 'Bise Fukugi Tree Road' },
        { time: '07:00 PM', title: '야키니쿠와 생맥주 저녁', location: '류큐노우시', description: '최상급 와규와 함께하는 40대 두 커플의 진솔한 대화 시간', costEstimate: 25000, mapQuery: 'Ryukyu no Ushi' }
      ]
    },
    {
      dayNumber: 3,
      date: new Date('2027-09-19T09:00:00Z'),
      activities: [
        { time: '10:00 AM', title: '아메리칸 빌리지 산책 및 카페', location: '아메리칸 빌리지', description: '이국적인 바닷가 카페에서 즐기는 여유로운 커피 타임', costEstimate: 3000, mapQuery: 'American Village Okinawa' },
        { time: '12:30 PM', title: '오키나와 소바 명가 점심', location: '슈리소바', description: '깊은 국물과 쫄깃한 면발의 정통 오키나와 소바', costEstimate: 4000, mapQuery: 'Shuri Soba' },
        { time: '02:30 PM', title: '츠보야 도자기 거리', location: '츠보야 야치문 도리', description: '부부끼리 사용할 예쁜 일본 도자기 그릇 쇼핑', costEstimate: 15000, mapQuery: 'Tsuboya Yachimun Dori' },
        { time: '06:30 PM', title: '선셋 요트 투어 및 프라이빗 디너', location: '나하 마리나', description: '노을 지는 바다 위에서의 낭만적인 저녁 식사', costEstimate: 40000, mapQuery: 'Naha Marina' }
      ]
    },
    {
      dayNumber: 4,
      date: new Date('2027-09-20T09:00:00Z'),
      activities: [
        { time: '10:00 AM', title: '국제거리 마지막 쇼핑', location: '고쿠사이 도리', description: '가족과 지인들을 위한 오미야게 및 자색고구마 타르트 구매', costEstimate: 10000, mapQuery: 'Kokusai Dori' },
        { time: '01:00 PM', title: '철판구이 스테이크 하우스', location: '샘스 세일러 인', description: '셰프의 화려한 퍼포먼스와 함께 즐기는 마지막 오찬', costEstimate: 18000, mapQuery: 'Sams Sailor Inn Naha' },
        { time: '04:00 PM', title: '나하 공항 도착 및 출국', location: '나하 공항', description: '렌터카 반납 후 아쉬운 작별, 그리고 다음 여행을 기약', costEstimate: 0, mapQuery: 'Naha Airport' }
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
    { category: 'accommodation', amount: 2400000, description: '할레쿨라니 오키나와 3박 (투룸 럭셔리 스위트)', date: new Date('2027-07-05T00:00:00Z'), paidBy: ownerId },
    { category: 'transport', amount: 450000, description: '알파드 렌터카 4일 (프리미엄 보험 포함)', date: new Date('2027-08-01T00:00:00Z'), paidBy: ownerId },
    { category: 'food', amount: 1200000, description: '4일간의 최고급 미식 비용 (식비 전체 예상)', date: new Date('2027-09-20T00:00:00Z'), paidBy: ownerId },
    { category: 'activities', amount: 350000, description: '선셋 요트 투어 및 관광지 입장료', date: new Date('2027-09-10T00:00:00Z'), paidBy: ownerId },
    { category: 'shopping', amount: 200000, description: '공동 쇼핑 예산 (간식 및 음료 등)', date: new Date('2027-09-17T00:00:00Z'), paidBy: ownerId }
  ];

  for (const item of budgetItems) {
    await budgets.add({
      ...item,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  console.log(`Seeded ${budgetItems.length} budget items.`);

  console.log('Successfully completed seeding 40s Okinawa Trip!');
}

seedOkinawa40s().catch(console.error);
