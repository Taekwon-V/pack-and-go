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

async function seedGermanyTrip() {
  const tripId = 'germany-romantic-road';
  const ownerEmail = 'inchul17.kim@gmail.com';
  
  let ownerId = 'admin';
  try {
    const userRecord = await adminAuth.getUserByEmail(ownerEmail);
    ownerId = userRecord.uid;
    console.log(`Found owner: ${ownerId} (${ownerEmail})`);
  } catch {
    console.log(`User ${ownerEmail} not found, using fallback ownerId: admin`);
  }

  console.log(`Seeding Germany Trip: ${tripId}...`);

  await adminDb.collection('trips').doc(tripId).set({
    title: '낭만 가득 독일 로맨틱 가도 & 바이에른 로드트립',
    destination: '독일 (뮌헨, 로텐부르크, 프랑크푸르트)',
    startDate: new Date('2027-10-08T09:00:00Z'),
    endDate: new Date('2027-10-14T18:00:00Z'),
    ownerId: ownerId,
    collaboratorIds: [],
    collaboratorEmails: ['tour.mate@gmail.com', 'traveler.de@gmail.com'],
    concept: '동화 같은 고성과 맥주의 본고장, 가을빛 물든 로맨틱 가도를 달리는 힐링 여행',
    destinationDesc: `중세의 고풍스러운 멋과 현대의 역동성이 공존하는 독일 바이에른 및 로맨틱 가도 여정입니다.
디즈니 성의 모티브가 된 노이슈반슈타인 성부터 동화 속 중세 마을 로텐부르크, 활기 넘치는 맥주와 예술의 도시 뮌헨까지, 가을 단풍과 함께 독일의 진수를 만끽합니다.`,
    weatherDesc: '10월 초순 평균 기온 8~16℃. 맑고 청명한 가을 날씨이나 아침저녁으로는 쌀쌀함',
    clothingDesc: '도톰한 가을 니트, 트렌치코트 또는 경량 패딩, 울 머플러, 울퉁불퉁한 돌길 보행을 위한 편안한 워킹화',
    mapQuery: 'Munich, Germany',
    gallery: [
      'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000&auto=format&fit=crop&q=80'
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
      date: new Date('2027-10-08T09:00:00Z'),
      activities: [
        { time: '02:30 PM', title: '뮌헨 국제공항 도착 및 렌터카 수령', location: '뮌헨 국제공항', description: '아우토반을 달릴 프리미엄 BMW 렌터카 수령 및 시내 이동', costEstimate: 0, mapQuery: 'Munich International Airport' },
        { time: '04:30 PM', title: '마리엔 광장 & 신시청사 산책', location: '마리엔 광장 (Marienplatz)', description: '고딕 양식의 웅장한 시청사와 인형 시계탑(Glockenspiel) 관람', costEstimate: 0, mapQuery: 'Marienplatz Munich' },
        { time: '06:30 PM', title: '호프브로이하우스 정통 디너', location: 'Hofbräuhaus München', description: '바이에른 전통 학센(Schweinshaxe)과 1L 생맥주 만찬', costEstimate: 120000, mapQuery: 'Hofbrauhaus Munchen' }
      ]
    },
    {
      dayNumber: 2,
      date: new Date('2027-10-09T09:00:00Z'),
      activities: [
        { time: '09:00 AM', title: '알프스 산맥 드라이브 (퓌센 이동)', location: '퓌센 (Füssen)', description: '그림 같은 바이에른 알프스 풍경을 감상하며 퓌센으로 이동', costEstimate: 30000, mapQuery: 'Fussen Germany' },
        { time: '11:30 AM', title: '노이슈반슈타인 성 & 마리엔 다리', location: '노이슈반슈타인 성', description: '디즈니 성의 모티브가 된 백조의 성 관람 및 마리엔 다리 인생샷 촬영', costEstimate: 65000, mapQuery: 'Neuschwanstein Castle' },
        { time: '02:30 PM', title: '호엔슈방가우 호숫가 런치', location: 'Alpsee Hohenschwangau', description: '에메랄드빛 알프스 호수를 바라보며 즐기는 슈니첼과 맥주', costEstimate: 80000, mapQuery: 'Alpsee Hohenschwangau' },
        { time: '06:30 PM', title: '뮌헨 복귀 및 영국정원 산책', location: '영국 정원 (Englischer Garten)', description: '유럽 최대 규모의 도심 공원에서 즐기는 여유로운 산책', costEstimate: 0, mapQuery: 'Englischer Garten Munich' }
      ]
    },
    {
      dayNumber: 3,
      date: new Date('2027-10-10T09:00:00Z'),
      activities: [
        { time: '09:30 AM', title: '로맨틱 가도 드라이브 & 딘켈스뷜', location: 'Dinkelsbühl', description: '전쟁의 피해를 입지 않은 완벽한 중세 성벽 요새 마을 탐방', costEstimate: 0, mapQuery: 'Dinkelsbuhl Germany' },
        { time: '01:00 PM', title: '동화마을 로텐부르크 도착 & 슈네발', location: 'Rothenburg ob der Tauber', description: '눈송이 모양의 로텐부르크 전통 과자 슈네발(Schneeball) 맛보기', costEstimate: 20000, mapQuery: 'Rothenburg ob der Tauber' },
        { time: '03:00 PM', title: '플뢴라인 & 크리스마스 빌리지', location: 'Plönlein & Käthe Wohlfahrt', description: '엽서 속 명소 플뢴라인과 1년 내내 크리스마스인 환상적인 샵 쇼핑', costEstimate: 150000, mapQuery: 'Plonlein Rothenburg' },
        { time: '07:00 PM', title: '중세 고성 호텔 체크인 및 와인 디너', location: 'Hotel BurgGartenpalais', description: '중세 분위기 가득한 호텔에서 프랑켄 와인과 스테이크 디너', costEstimate: 140000, mapQuery: 'Hotel BurgGartenpalais Rothenburg' }
      ]
    },
    {
      dayNumber: 4,
      date: new Date('2027-10-11T09:00:00Z'),
      activities: [
        { time: '10:00 AM', title: '뉘른베르크 카이저부르크 성', location: 'Kaiserburg Nürnberg', description: '신성로마제국 황제의 성채에서 내려다보는 뉘른베르크 전경', costEstimate: 40000, mapQuery: 'Kaiserburg Nurnberg' },
        { time: '12:30 PM', title: '원조 뉘른베르거 소시지 점심', location: 'Bratwursthäusle', description: '참나무 숯불에 구워내는 600년 전통 소시지와 사우어크라우트', costEstimate: 50000, mapQuery: 'Bratwursthausle Nurnberg' },
        { time: '03:30 PM', title: '뷔르츠부르크 레지덴츠 궁전', location: 'Würzburger Residenz', description: '유네스코 세계문화유산, 바로크 건축의 최고 걸작 관람', costEstimate: 35000, mapQuery: 'Wurzburg Residence' },
        { time: '06:00 PM', title: '알테 마인교 프랑켄 와인 노을', location: 'Alte Mainbrücke', description: '오래된 다리 위에서 잔 와인을 들고 마시는 낭만적인 석양 타임', costEstimate: 30000, mapQuery: 'Alte Mainbrucke Wurzburg' }
      ]
    },
    {
      dayNumber: 5,
      date: new Date('2027-10-12T09:00:00Z'),
      activities: [
        { time: '10:30 AM', title: '하이델베르크 고성 & 대형 와인통', location: 'Heidelberg Castle', description: '22만 리터 거대 와인통과 낭만주의 시인들이 사랑한 폐허의 성', costEstimate: 45000, mapQuery: 'Heidelberg Castle' },
        { time: '01:30 PM', title: '네카어 강변 레스토랑 점심', location: 'Neckar River Heidelberg', description: '강변 테라스에서 즐기는 수제 버거와 독일 필스너', costEstimate: 60000, mapQuery: 'Neckar River Heidelberg' },
        { time: '03:30 PM', title: '철학자의 길 산책', location: 'Philosophenweg', description: '괴테와 헤겔이 사색했던 언덕길에서 조망하는 구시가지 파노라마', costEstimate: 0, mapQuery: 'Philosophenweg Heidelberg' }
      ]
    },
    {
      dayNumber: 6,
      date: new Date('2027-10-13T09:00:00Z'),
      activities: [
        { time: '11:00 AM', title: '프랑크푸르트 뢰머 광장', location: 'Römerberg Frankfurt', description: '삼각 지붕이 매력적인 프랑크푸르트의 역사적 중심지', costEstimate: 0, mapQuery: 'Romerberg Frankfurt' },
        { time: '01:30 PM', title: '작센하우젠 아펠바인 런치', location: 'Sachsenhausen', description: '프랑크푸르트 명물 전통 사과와인(Apfelwein)과 그린소스 요리', costEstimate: 70000, mapQuery: 'Sachsenhausen Frankfurt' },
        { time: '04:00 PM', title: '차일 거리 기념품 및 선물 쇼핑', location: 'Zeil Frankfurt', description: '독일 주방용품(WMF, 헨켈), 영양제, 초콜릿 쇼핑', costEstimate: 300000, mapQuery: 'Zeil Frankfurt' },
        { time: '07:00 PM', title: '프랑크푸르트 공항 및 귀국 준비', location: '프랑크푸르트 공항', description: '렌터카 반납 후 면세점 구경 및 아쉬운 여행 마무리', costEstimate: 0, mapQuery: 'Frankfurt Airport' }
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
  console.log(`Seeded ${dailyPlans.length} daily itineraries.`);

  const budgets = adminDb.collection('trips').doc(tripId).collection('budgets');
  
  // Clear existing
  const existingBudgets = await budgets.get();
  const batch2 = adminDb.batch();
  existingBudgets.forEach(doc => batch2.delete(doc.ref));
  await batch2.commit();

  const budgetData = {
    totalBudget: 8500000, // 8,500,000 KRW
    currency: 'KRW',
    expenses: [
      { id: 'exp_de_1', category: 'flight', amount: 3200000, description: '루프트한자 인천-뮌헨 / 프랑크푸르트-인천 직항 2인', date: new Date('2027-08-01T00:00:00Z'), paidBy: ownerId },
      { id: 'exp_de_2', category: 'accommodation', amount: 2200000, description: '뮌헨 시내 호텔 2박 + 로텐부르크 고성호텔 1박 + 프랑크푸르트 호텔 2박', date: new Date('2027-08-10T00:00:00Z'), paidBy: ownerId },
      { id: 'exp_de_3', category: 'transport', amount: 950000, description: 'BMW 투어링 왜건 렌트 6일 + 풀커버 보험 + 고속도로 통행료', date: new Date('2027-09-01T00:00:00Z'), paidBy: ownerId },
      { id: 'exp_de_4', category: 'food', amount: 900000, description: '호프브로이하우스 학센, 프랑켄 와인, 수제 소시지 등 식비 일체', date: new Date('2027-10-13T00:00:00Z'), paidBy: ownerId },
      { id: 'exp_de_5', category: 'activity', amount: 250000, description: '노이슈반슈타인 성, 레지덴츠 궁전, 하이델베르크 고성 통합 패스', date: new Date('2027-10-09T00:00:00Z'), paidBy: ownerId },
      { id: 'exp_de_6', category: 'shopping', amount: 600000, description: '케테 볼파르트 크리스마스 오너먼트, 쌍둥이칼, 독일 영양제', date: new Date('2027-10-12T00:00:00Z'), paidBy: ownerId }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await budgets.add(budgetData);
  console.log(`Seeded budget document with ${budgetData.expenses.length} expenses.`);

  console.log('Successfully completed seeding Germany Trip!');
}

seedGermanyTrip().catch(console.error);
