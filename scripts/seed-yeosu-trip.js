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

  // 1. Trips collection document
  await adminDb.collection('trips').doc(tripId).set({
    title: '남도의 맛과 푸른 바다, 70대 부모님과 함께하는 여수 힐링 미식 여행',
    destination: '전라남도 여수시 (웅천, 돌산, 오동도)',
    startDate: new Date('2026-09-24T09:00:00Z'),
    endDate: new Date('2026-09-25T18:00:00Z'),
    ownerId: ownerId,
    collaboratorIds: ['u9O6lfsHMFgPLrxj5kKYxDBdqdq1', 'L2WJiaWOYPTo3B0N5ZmcvErzkwd2'],
    collaboratorEmails: ['mybest1725@gmail.com', 'j789945661@gmail.com'],
    concept: '70대 부모님을 모시는 안심 힐링 코스, 여수 제철 하모 샤브샤브와 게장 정식, 벨메르 오션뷰 호캉스',
    destinationDesc: '남도의 푸른 바다와 다도해 섬들이 한눈에 펼쳐지는 아름다운 해양 관광도시 여수입니다. 웅천 마리나의 이국적인 정취, 여수 밤바다와 돌산대교의 낭만적인 야경, 그리고 싱싱한 해산물과 정갈한 남도 손맛이 가득합니다.',
    weatherDesc: '9월 하순 청명한 초가을 날씨 (평균 20~25℃). 쾌청하고 시원한 가을 바닷바람',
    clothingDesc: '부모님을 위한 편안한 운동화, 낮 동안의 가벼운 옷차림과 아침/저녁 바닷바람 대비용 가디건 또는 바람막이',
    mapQuery: 'Yeosu, South Korea',
    gallery: [
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=1000&auto=format&fit=crop&q=80'
    ],
    highlights: [
      {
        title: '남도 맛의 수도, 명품 게장과 제철 하모 샤브샤브',
        description: '알이 꽉 찬 꽃돌게장, 갈치조림과 9월 제철 영양 만점 갯장어(하모) 샤브샤브로 즐기는 여수 최고의 미식 성지.'
      },
      {
        title: '낭만 가득한 여수 밤바다와 돌산대교 야경',
        description: '오색 찬란한 조명이 수놓는 돌산대교와 해안선, 잔잔한 파도 소리와 함께 차 안에서 즐기는 환상적인 야경 드라이브.'
      },
      {
        title: '웅천 마리나와 프리미엄 오션뷰 호캉스',
        description: '호텔 벨메르 슈페리어 스위트에서 마주하는 탁 트인 남해 전망과 바다 조망 통창 사우나에서 누리는 여유로운 온천 휴식.'
      },
      {
        title: '푸른 바다 위 오동도 동백 숲길 산책',
        description: '걷지 않고 편안하게 동백열차를 타고 들어가는 오동도 방파제와 평탄한 해송 숲길 너머 펼쳐지는 시원한 다도해 풍경.'
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
          time: '11:30 AM',
          title: '꽃돌게장1번가 명품 점심 식사',
          location: '꽃돌게장1번가 (봉산동)',
          description: '알이 꽉 찬 꽃게장 정식(2인)과 왕갈치조림 정식(2인)으로 부모님 입맛을 돋우는 첫 식사',
          costEstimate: 140000,
          mapQuery: '꽃돌게장1번가'
        },
        {
          time: '01:30 PM',
          title: '웅천친수공원 & 오션뷰 티타임',
          location: '웅천친수공원',
          description: '숙소 앞 웅천 마리나 요트 선착장과 평탄한 해안 산책로, 오션뷰 카페에서 여유로운 차 한 잔',
          costEstimate: 35000,
          mapQuery: '웅천친수공원'
        },
        {
          time: '03:00 PM',
          title: '여수 벨메르 한화리조트 체크인',
          location: '호텔 벨메르 바이 한화호텔앤드리조트',
          description: '슈페리어 스위트 객실 입실. 파노라마 바다 전망 감상 및 장거리 이동 피로를 푸는 낮잠 휴식',
          costEstimate: 0,
          mapQuery: '호텔 벨메르 바이 한화호텔앤드리조트'
        },
        {
          time: '05:30 PM',
          title: '경도회관 9월 제철 하모 샤브샤브 만찬',
          location: '경도회관 국동점',
          description: '여수 최고의 가을 보양식 갯장어(하모) 샤브샤브 4인 대(大)자 코스와 칼국수',
          costEstimate: 180000,
          mapQuery: '경도회관 국동점'
        },
        {
          time: '07:30 PM',
          title: '돌산공원 전망대 & 돌산대교 야경',
          location: '돌산공원',
          description: '걷지 않고 주차장 바로 앞에서 조망하는 형형색색 돌산대교와 여수 밤바다 파노라마 드라이브',
          costEstimate: 0,
          mapQuery: '돌산공원'
        },
        {
          time: '09:00 PM',
          title: '리조트 복귀 및 가족 다과 타임',
          location: '호텔 벨메르 바이 한화호텔앤드리조트',
          description: '스위트 거실에서 부모님과 나누는 따뜻한 차와 과일, 편안한 취침',
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
    totalBudget: 1333000, // 1,333,000 KRW
    currency: 'KRW',
    expenses: [
      { id: 'exp_ys_1', category: 'accommodation', amount: 420000, description: '여수 벨메르 바이 한화리조트 슈페리어 스위트 (1박, 4인 조식 뷔페 포함)', date: new Date('2026-09-24T00:00:00Z'), paidBy: ownerId },
      { id: 'exp_ys_2', category: 'food', amount: 140000, description: '1일차 점심 꽃돌게장 1번가 (꽃게정식 2인 + 왕갈치조림 2인)', date: new Date('2026-09-24T12:00:00Z'), paidBy: ownerId },
      { id: 'exp_ys_3', category: 'food', amount: 35000, description: '1일차 웅천 마리나 오션뷰 베이커리 카페 음료 4잔 및 디저트', date: new Date('2026-09-24T14:00:00Z'), paidBy: ownerId },
      { id: 'exp_ys_4', category: 'food', amount: 180000, description: '1일차 저녁 경도회관 국동점 하모(갯장어) 샤브샤브 대(大)자 4인 만찬', date: new Date('2026-09-24T18:00:00Z'), paidBy: ownerId },
      { id: 'exp_ys_5', category: 'food', amount: 20000, description: '1일차 리조트 스위트룸 과일 및 다과', date: new Date('2026-09-24T21:00:00Z'), paidBy: ownerId },
      { id: 'exp_ys_6', category: 'activity', amount: 40000, description: '2일차 벨메르 오션뷰 통창 사우나 4인 (투숙객 할인)', date: new Date('2026-09-25T09:30:00Z'), paidBy: ownerId },
      { id: 'exp_ys_7', category: 'activity', amount: 8000, description: '2일차 오동도 동백열차 4인 왕복 탑승권', date: new Date('2026-09-25T11:30:00Z'), paidBy: ownerId },
      { id: 'exp_ys_8', category: 'food', amount: 200000, description: '2일차 점심 여수 한일관 본점 명품 해산물 남도 한정식 4인 코스', date: new Date('2026-09-25T13:00:00Z'), paidBy: ownerId },
      { id: 'exp_ys_9', category: 'shopping', amount: 120000, description: '여수 돌산 갓김치 선물 택배 주문(8만원) 및 이순신광장 딸기모찌(4만원)', date: new Date('2026-09-25T15:00:00Z'), paidBy: ownerId },
      { id: 'exp_ys_10', category: 'transport', amount: 120000, description: '차량 왕복 주유비 및 고속도로 통행료', date: new Date('2026-09-24T09:00:00Z'), paidBy: ownerId },
      { id: 'exp_ys_11', category: 'shopping', amount: 50000, description: '현장 음료 및 돌발 지출 대비 예비비', date: new Date('2026-09-25T16:00:00Z'), paidBy: ownerId }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await budgets.add(budgetData);
  console.log(`Seeded budget document with ${budgetData.expenses.length} expenses.`);

  console.log('Successfully completed seeding Yeosu Trip!');
}

seedYeosuTrip().catch(console.error);
