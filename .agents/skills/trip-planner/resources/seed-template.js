/* eslint-disable @typescript-eslint/no-require-imports */
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');

// 1. Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../../../../.env.local');
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

/**
 * Seed a new trip into Firestore.
 * Replace placeholders marked with <...> before running.
 */
async function seedTrip() {
  const tripId = '<TRIP_ID>'; // e.g. 'sapporo-winter-healing'
  const ownerEmail = 'inchul17.kim@gmail.com';
  
  let ownerId = 'admin';
  try {
    const userRecord = await adminAuth.getUserByEmail(ownerEmail);
    ownerId = userRecord.uid;
    console.log(`Found owner: ${ownerId} (${ownerEmail})`);
  } catch {
    console.log(`User ${ownerEmail} not found, using fallback ownerId: admin`);
  }

  console.log(`Seeding Trip: ${tripId}...`);

  // 1. Set Main Trip Document
  await adminDb.collection('trips').doc(tripId).set({
    title: '<TRIP_TITLE>',
    destination: '<DESTINATION_NAME>',
    startDate: new Date('<START_DATE_ISO>'), // e.g. 2027-02-10T09:00:00Z
    endDate: new Date('<END_DATE_ISO>'),     // e.g. 2027-02-14T18:00:00Z
    ownerId: ownerId,
    collaboratorIds: [],
    collaboratorEmails: [],
    concept: '<TRIP_CONCEPT>',
    destinationDesc: '<DESTINATION_DESCRIPTION>',
    weatherDesc: '<WEATHER_DESCRIPTION>',
    clothingDesc: '<CLOTHING_DESCRIPTION>',
    mapQuery: '<MAIN_MAP_QUERY>', // e.g. 'Sapporo, Hokkaido'
    gallery: [
      '<IMAGE_URL_1>',
      '<IMAGE_URL_2>',
      '<IMAGE_URL_3>',
      '<IMAGE_URL_4>'
    ],
    highlights: [
      {
        title: '<HIGHLIGHT_1_TITLE>',
        description: '<HIGHLIGHT_1_DESCRIPTION>'
      },
      {
        title: '<HIGHLIGHT_2_TITLE>',
        description: '<HIGHLIGHT_2_DESCRIPTION>'
      },
      {
        title: '<HIGHLIGHT_3_TITLE>',
        description: '<HIGHLIGHT_3_DESCRIPTION>'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'planning'
  });

  // 2. Set Daily Itineraries
  const itineraries = adminDb.collection('trips').doc(tripId).collection('itineraries');
  const existingItineraries = await itineraries.get();
  const batch1 = adminDb.batch();
  existingItineraries.forEach(doc => batch1.delete(doc.ref));
  await batch1.commit();

  const dailyPlans = [
    /* Example:
    {
      dayNumber: 1,
      date: new Date('2027-02-10T09:00:00Z'),
      activities: [
        {
          time: '11:00 AM',
          title: '신치토세 공항 도착 & 삿포로 이동',
          location: '신치토세 공항',
          description: '쾌속 에어포트 탑승 후 삿포로역 이동',
          costEstimate: 40000,
          mapQuery: 'New Chitose Airport'
        }
      ]
    }
    */
  ];

  for (const day of dailyPlans) {
    await itineraries.add({
      ...day,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  console.log(`Seeded ${dailyPlans.length} daily itineraries.`);

  // 3. Set Budget & Expenses
  const budgets = adminDb.collection('trips').doc(tripId).collection('budgets');
  const existingBudgets = await budgets.get();
  const batch2 = adminDb.batch();
  existingBudgets.forEach(doc => batch2.delete(doc.ref));
  await batch2.commit();

  const budgetData = {
    totalBudget: 0, // e.g. 5000000
    currency: 'KRW',
    expenses: [
      /* Example:
      {
        id: 'exp_1',
        category: 'flight', // 'flight' | 'accommodation' | 'transport' | 'food' | 'activity' | 'shopping'
        amount: 2000000,
        description: '왕복 항공권 (4인)',
        date: new Date('<DATE_ISO>'),
        paidBy: ownerId
      }
      */
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await budgets.add(budgetData);
  console.log(`Seeded budget document with ${budgetData.expenses.length} expenses.`);

  console.log(`Successfully completed seeding trip: ${tripId}!`);
}

module.exports = { seedTrip };

if (require.main === module) {
  seedTrip().catch(console.error);
}
