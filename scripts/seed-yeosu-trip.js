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

async function seedYeosuTrip() {
  const tripId = 'yeosu-parents-gourmet';
  const ownerEmail = 'inchul17.kim@gmail.com';
  
  let ownerId = 'admin';
  try {
    const userRecord = await adminAuth.getUserByEmail(ownerEmail);
    ownerId = userRecord.uid;
    console.log(`Found owner: ${ownerId} (${ownerEmail})`);
  } catch {
    console.log(`User ${ownerEmail} not found, using fallback ownerId: admin`);
  }

  console.log(`Seeding Yeosu Trip: ${tripId}...`);

  const tripRef = adminDb.collection('trips').doc(tripId);
  const tripSnap = await tripRef.get();
  let collaboratorIds = [];
  let collaboratorEmails = [];
  if (tripSnap.exists) {
    const existingData = tripSnap.data();
    // Preserve existing collaborators so schedule updates never wipe out members!
    collaboratorIds = existingData.collaboratorIds || [];
    collaboratorEmails = existingData.collaboratorEmails || [];
  }

  await tripRef.set({
    title: '남도의 자연과 맛, 부모님과 순천·여수 힐링 미식 여행',
    destination: '전라남도 순천시 & 여수시 (순천만, 웅천, 이순신광장, 오동도)',
    startDate: new Date('2026-09-24T09:00:00Z'),
    endDate: new Date('2026-09-25T18:00:00Z'),
    ownerId: ownerId,
    collaboratorIds: collaboratorIds,
    collaboratorEmails: collaboratorEmails,
    concept: '70대 부모님을 모시는 순천만국가정원과 갈대밭 힐링 산책, 여수 이순신광장 핫플 스트리트 투어와 벨메르 오션뷰 호캉스',
    destinationDesc: '순천만의 광활한 갈대밭과 대한민국 1호 국가정원의 초록빛 자연, 그리고 푸른 바다와 화려한 야경이 펼쳐지는 해양 관광도시 여수입니다. 이동과 주차 피로를 줄인 스마트한 동선과 함께 정갈한 꼬막정식, 이순신광장 명물 먹거리, 남도 한정식의 깊은 맛을 선사합니다.',
    weatherDesc: '9월 하순 청명한 초가을 날씨 (평균 20~25℃). 쾌청하고 시원한 가을 바닷바람',
    clothingDesc: '부모님을 위한 편안한 운동화, 낮 동안의 가벼운 옷차림과 아침/저녁 바닷바람 대비용 가디건 또는 바람막이',
    mapQuery: 'Yeosu, South Korea',
    coverImage: '/images/yeosu/1_suncheon_reeds.jpg',
    gallery: [
      '/images/yeosu/1_suncheon_reeds.jpg',
      '/images/yeosu/2_suncheon_garden.jpg',
      '/images/yeosu/3_yeosu_night_sea.jpg',
      '/images/yeosu/4_yeosu_odongdo.jpg'
    ],
    highlights: [
      {
        title: '대한민국 1호 순천만국가정원과 순천만 갈대밭',
        description: '선선한 아침 관람차로 둘러보는 국가정원과 평지 데크길로 걷는 순천만습지 황금 갈대숲 (원티켓 통합 관람).'
      },
      {
        title: '남도 꼬막정식 & 이순신광장 핫플 먹거리 투어',
        description: '알찬 꼬막 한상차림과 이순신광장 7대 명물 먹거리(바다김밥, 구봉만두, 서녹씨 등)를 2인 1조 분업으로 신속 포장하여 즐기는 바다 벤치 만찬.'
      },
      {
        title: '여수 빅오 해상분수쇼와 하멜등대 밤바다 야경',
        description: '여수 밤바다 위에서 펼쳐지는 화려한 조명·음악 분수쇼와 거북선대교 불빛을 택시로 편안하게 즐기는 야경 투어.'
      },
      {
        title: '웅천 마리나 오션뷰 호캉스와 2일차 한정식/사우나',
        description: '호텔 벨메르 슈페리어 스위트의 편안한 휴식, 통창 오션뷰 사우나, 그리고 여수 한일관 명품 해산물 한정식.'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'planning'
  });

  // 2. Itineraries subcollection
  const itineraries = adminDb.collection('trips').doc(tripId).collection('itineraries');
  const existingItineraries = await itineraries.get();
  const batch1 = adminDb.batch();
  existingItineraries.forEach(doc => batch1.delete(doc.ref));
  await batch1.commit();

  const dailyPlans = [
    {
      dayNumber: 1,
      date: new Date('2026-09-24T09:00:00Z'),
      activities: [
        {
          time: '07:00 AM',
          title: '금산인삼랜드휴게소 부모님 픽업',
          location: '금산인삼랜드휴게소(하행)',
          description: '부모님 댁(금산) 연계 픽업. 가벼운 스트레칭 후 탑승하여 순천완주고속도로 직행 (약 178km)',
          costEstimate: 0,
          mapQuery: '금산인삼랜드휴게소(하행)'
        },
        {
          time: '09:15 AM',
          title: '순천만국가정원 관람 (관람차 & 호수정원)',
          location: '순천만국가정원 동문',
          description: '선선한 아침 타임 관람. 순환 관람차(전기차, 25분) 탑승으로 부모님 체력 안배, 호수정원 및 메타세쿼이아길 평지 산책 (순천만습지 당일 무료 연계)',
          costEstimate: 30000,
          mapQuery: '순천만국가정원'
        },
        {
          time: '11:35 AM',
          title: '순천 낙원회관 남도 꼬막정식 점심',
          location: '낙원회관 (순천 장천동)',
          description: '삶은 통꼬막, 새콤달콤 꼬막무침, 꼬막전과 정갈한 남도 계절 밑반찬 4인 한상차림',
          costEstimate: 88000,
          mapQuery: '낙원회관'
        },
        {
          time: '01:05 PM',
          title: '순천만습지 황금 갈대밭 산책',
          location: '순천만습지 (대대동)',
          description: '무진교를 건너 평지 목재 데크 갈대숲길 힐링 산책 (계단 오르막 배제, 오전 국가정원 티켓으로 무료 입장)',
          costEstimate: 0,
          mapQuery: '순천만습지'
        },
        {
          time: '03:15 PM',
          title: '여수 벨메르 호텔 체크인 & 꿀잠 휴식',
          location: '호텔 벨메르 바이 한화호텔앤드리조트',
          description: '슈페리어 스위트 객실 입실. 새벽 장거리 운전 피로 회복을 위한 2시간 15분 낮잠 및 파노라마 오션뷰 휴식',
          costEstimate: 0,
          mapQuery: '호텔 벨메르 바이 한화호텔앤드리조트'
        },
        {
          time: '05:50 PM',
          title: '이순신광장 핫플 먹거리 투어 & 저녁 만찬',
          location: '이순신광장',
          description: '택시 이동(운전/주차 스트레스 제로). 2인 1조 분업 픽업(바다김밥, 구봉만두, 좌수영바게트버거, 서녹씨 딸기모찌, 이순신버거) 후 바다 벤치 만찬 및 여수당 쑥아이스크림 후식',
          costEstimate: 98500,
          mapQuery: '이순신광장'
        },
        {
          time: '07:30 PM',
          title: '여수엑스포 빅오 해상분수쇼 관람',
          location: '여수엑스포 빅오 해상무대',
          description: '택시로 이동. 바다 위에서 펼쳐지는 화려한 음악·조명 분수쇼 무료 관람 (20:00~20:30, 30분간 진행)',
          costEstimate: 4500,
          mapQuery: '빅오 해상분수쇼'
        },
        {
          time: '08:35 PM',
          title: '종포해양공원 & 하멜등대 야경 산책 후 복귀',
          location: '하멜등대 & 종포해양공원',
          description: '낭만포차 거리, 붉은 하멜등대, 오색 거북선대교 야경 감상 후 택시로 호텔 벨메르 복귀',
          costEstimate: 8500,
          mapQuery: '하멜등대'
        },
        {
          time: '09:30 PM',
          title: '호텔 테라스 티타임 및 휴식',
          location: '호텔 벨메르 바이 한화호텔앤드리조트',
          description: '포장 디저트와 함께 즐기는 웅천 요트마리나 밤바다 티타임 및 편안한 취침',
          costEstimate: 20000,
          mapQuery: '호텔 벨메르 바이 한화호텔앤드리조트'
        }
      ]
    },
    {
      dayNumber: 2,
      date: new Date('2026-09-25T09:00:00Z'),
      activities: [
        {
          time: '08:30 AM',
          title: '벨메르 풀에버(Paul Ewer) 조식 뷔페',
          location: '호텔 벨메르 3층 레스토랑',
          description: '바다를 마주하며 여유롭게 즐기는 4인 뷔페 조식 (신선한 한식 및 베이커리)',
          costEstimate: 0,
          mapQuery: '호텔 벨메르 바이 한화호텔앤드리조트'
        },
        {
          time: '09:30 AM',
          title: '벨메르 통창 오션뷰 사우나',
          location: '호텔 벨메르 사우나',
          description: '푸른 바다가 시원하게 내려다보이는 고급 사우나에서 부모님 여행 피로를 푸는 온천욕 타임',
          costEstimate: 40000,
          mapQuery: '호텔 벨메르 바이 한화호텔앤드리조트 사우나'
        },
        {
          time: '11:00 AM',
          title: '체크아웃 & 오동도 이동',
          location: '오동도 입구',
          description: '체크아웃 후 오동도 공영주차장으로 여유로운 이동 (차량 15분)',
          costEstimate: 0,
          mapQuery: '오동도'
        },
        {
          time: '11:30 AM',
          title: '오동도 동백열차 & 평지 해송 숲길',
          location: '오동도',
          description: '동백열차로 편안하게 방파제 건너기, 걷기 좋은 평탄한 데크 숲길 20~30분 힐링 산책',
          costEstimate: 8000,
          mapQuery: '오동도'
        },
        {
          time: '01:00 PM',
          title: '여수 한일관 본점 해산물 남도 한정식',
          location: '여수 한일관 본점',
          description: '30년 전통의 여수 대표 한정식 명가. 활어회, 전복구이, 떡갈비, 갓김치와 솥밥 반상 코스 (4인)',
          costEstimate: 200000,
          mapQuery: '여수 한일관'
        },
        {
          time: '02:40 PM',
          title: '이순신광장 수제딸기모찌 & 돌산 갓김치 쇼핑',
          location: '이순신광장',
          description: '여수 명물 수제딸기모찌 구매 및 어르신 지인/친지 선물용 갓김치 택배 주문',
          costEstimate: 120000,
          mapQuery: '이순신광장'
        },
        {
          time: '03:30 PM',
          title: '안전한 귀가길 출발',
          location: '여수',
          description: '양손 가득 여수 특산품과 즐거운 가족 추억을 안고 안전하게 귀가 출발',
          costEstimate: 0,
          mapQuery: '여수종합버스터미널'
        }
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
  console.log(`Seeded ${dailyPlans.length} daily itineraries for Yeosu.`);

  // 3. Budgets subcollection
  const budgets = adminDb.collection('trips').doc(tripId).collection('budgets');
  const existingBudgets = await budgets.get();
  const batch2 = adminDb.batch();
  existingBudgets.forEach(doc => batch2.delete(doc.ref));
  await batch2.commit();

  const budgetData = {
    totalBudget: 1211000, // 1,211,000 KRW
    currency: 'KRW',
    expenses: [
      { id: 'exp_ys_1', category: 'accommodation', amount: 420000, description: '여수 벨메르 바이 한화리조트 슈페리어 스위트 (1박, 4인 조식 뷔페 포함)', date: new Date('2026-09-24T00:00:00Z'), paidBy: ownerId },
      { id: 'exp_ys_2', category: 'activity', amount: 30000, description: '1일차 순천만국가정원 입장료(성인 2인 2만원/경로 2인 무료) 및 순환 관람차 4인(1만원)', date: new Date('2026-09-24T09:30:00Z'), paidBy: ownerId },
      { id: 'exp_ys_3', category: 'food', amount: 88000, description: '1일차 점심 순천 낙원회관 남도 꼬막정식 4인 한상차림', date: new Date('2026-09-24T12:00:00Z'), paidBy: ownerId },
      { id: 'exp_ys_4', category: 'food', amount: 90000, description: '1일차 저녁 이순신광장 7대 먹거리 포장 투어 (바다김밥, 구봉만두, 좌수영바게트버거, 서녹씨, 여수당 등)', date: new Date('2026-09-24T18:30:00Z'), paidBy: ownerId },
      { id: 'exp_ys_5', category: 'transport', amount: 25000, description: '1일차 저녁 여수 시내 택시비 3회 (벨메르 ➔ 광장 ➔ 엑스포 ➔ 벨메르 복귀)', date: new Date('2026-09-24T20:00:00Z'), paidBy: ownerId },
      { id: 'exp_ys_6', category: 'food', amount: 20000, description: '1일차 야식/음료 벨메르 로비 폴 바셋 음료 및 객실 과일', date: new Date('2026-09-24T21:30:00Z'), paidBy: ownerId },
      { id: 'exp_ys_7', category: 'activity', amount: 40000, description: '2일차 벨메르 오션뷰 통창 사우나 4인 (투숙객 할인)', date: new Date('2026-09-25T09:30:00Z'), paidBy: ownerId },
      { id: 'exp_ys_8', category: 'activity', amount: 8000, description: '2일차 오동도 동백열차 4인 왕복 탑승권', date: new Date('2026-09-25T11:30:00Z'), paidBy: ownerId },
      { id: 'exp_ys_9', category: 'food', amount: 200000, description: '2일차 점심 여수 한일관 본점 명품 해산물 남도 한정식 4인 코스', date: new Date('2026-09-25T13:00:00Z'), paidBy: ownerId },
      { id: 'exp_ys_10', category: 'shopping', amount: 120000, description: '여수 돌산 갓김치 선물 택배 주문(8만원) 및 이순신광장 선물용 디저트/모찌(4만원)', date: new Date('2026-09-25T15:00:00Z'), paidBy: ownerId },
      { id: 'exp_ys_11', category: 'transport', amount: 120000, description: '차량 왕복 주유비 및 고속도로 통행료', date: new Date('2026-09-24T09:00:00Z'), paidBy: ownerId },
      { id: 'exp_ys_12', category: 'shopping', amount: 50000, description: '현장 음료 및 돌발 지출 대비 예비비', date: new Date('2026-09-25T16:00:00Z'), paidBy: ownerId }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await budgets.add(budgetData);
  console.log(`Seeded budget document with ${budgetData.expenses.length} expenses.`);

  console.log('Successfully completed seeding Yeosu Trip!');
}

seedYeosuTrip().catch(console.error);
