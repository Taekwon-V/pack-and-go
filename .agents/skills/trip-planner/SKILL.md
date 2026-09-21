---
name: trip-planner
description: >-
  Interactive travel planning assistant for Pack to Go. Plans full travel itineraries,
  structures requirements, calculates itemized budgets, produces standard trip markdown
  documents (01-04), and generates/runs Firestore seed scripts to register trips in the web application.
  Trigger whenever the user wants to plan, create, draft, or seed a new trip, travel plan, or itinerary.
---

# Pack to Go - Travel Planner Skill

This skill guides the agent in gathering travel requirements, drafting comprehensive itineraries and budgets, writing standard project documentation under `trips/<trip_id>/`, and generating/executing a Firestore seed script to make the trip immediately viewable and editable in the Pack to Go web application.

---

## 🎯 Workflow Overview

```mermaid
flowchart TD
    A[User Request] --> B[Phase 1: Interview & Requirements]
    B --> C[Phase 2: Generate 4 Markdown Documents]
    C --> D[Phase 3: Generate Seed Script in scripts/]
    D --> E[Phase 4: Run Seed Script & Verify In-App]
```

---

## 📋 Phase 1: Intake & Requirements Gathering

Before generating documents, interactively align on the following parameters (infer defaults when reasonable, but confirm key elements):

1. **Destination**: City/Country, season/month.
2. **Dates & Duration**: Total days/nights, departure and return dates.
3. **Travelers**: Group size, composition (e.g., couple, two 40s couples, family with kids, friends).
4. **Theme & Style**: Relaxation, fine dining, cultural exploration, nature/adventure, shopping.
5. **Pacing**: Reference [trip-spec-guidelines.md](./references/trip-spec-guidelines.md) for group pacing (e.g. 40s prefer max 2 key spots per day + resort rest).
6. **Budget Target**: Luxury, mid-tier, or budget.

---

## 📝 Phase 2: Create Standard 4-Document Suite

Create a new folder: `trips/<trip_key>/` (e.g. `trips/sapporo_winter_healing/`).
Generate the four core markdown documents following the templates in `trips/_template/`:

### 1. `01_Requirements.md`
- **General Info**: Title, Dates, Travelers, Destination.
  - **⚠️ Title Length Rule**: 여행명은 모바일 및 웹 카드 UI에서 말줄임표(`...`)로 잘리지 않도록 **20~25자 내외**로 간결하고 임팩트 있게 작성 (예: "남도의 자연과 맛, 부모님과 순천·여수 힐링 미식 여행").
- **Concept & Themes**: 3 core thematic pillars (e.g., Onsen & Relax, Gourmet, Winter Landscape).
- **Core Requirements**: Accommodations (room count, star rating), Transportation (private van / rental car / transit), Dining, Pacing.
- **Destination Highlights**: 3~4 distinct, bespoke highlights tailored specifically to the destination and travel group (DO NOT use generic or copy-pasted place descriptions).

### 2. `02_Itinerary_Plan.md`
- **Day-by-Day Timeline**:
  - `Day 1 ~ Day N` breakdown with Morning / Afternoon / Evening activities.
  - Precise time markers (e.g. `09:30 AM`, `01:00 PM`).
  - Realistic travel durations and transit methods.
  - Valid Google Maps query names for every stop (`mapQuery`).

### 3. `03_Budget_Cost.md`
- **Total Estimated Budget**: KRW total and per-person cost.
- **Categorized Breakdown**:
  - `flight`: Airline, route, per-person & total.
  - `accommodation`: Hotel/resort, room count, nights, breakfast.
  - `transport`: Rental car, fuel, tolls, Grab, airport van.
  - `food`: Meal allowance (breakfast, lunch, fine-dining dinner, cafe/drinks).
  - `activity`: Admission tickets, tours, spa/massage.
  - `shopping & extra`: Local souvenirs, emergency contingency (5~10%).

### 4. `04_Summary.md`
- **Trip Summary**: Highlights, flight/hotel quick summary table.
- **Pre-trip Checklist**: Passport validity, reservations, packing list, currency exchange/cards.

---

## 💾 Phase 3: Generate Seed Script

1. Copy or adapt [resources/seed-template.js](./resources/seed-template.js) to `scripts/seed-<trip_key>.js`.
2. Populate the script with:
   - `tripId`: Hyphenated ID (e.g., `sapporo-winter-healing`).
   - `title`, `destination`, `startDate`, `endDate`, `concept`, `destinationDesc`, `weatherDesc`, `clothingDesc`, `mapQuery`.
   - `highlights`: Array of 3~4 `{ title, description }` objects matching the destination highlights defined in `01_Requirements.md`!
   - `gallery`: Array of 4 high-quality Unsplash image URLs fitting the destination.
   - `dailyPlans`: Array of days matching `02_Itinerary_Plan.md`.
   - `budgetData`: Total budget and individual expense items matching `03_Budget_Cost.md`.
3. Set `ownerEmail = 'inchul17.kim@gmail.com'`.
4. **Member / Collaborator Management Rules**:
   - **New Trips**: 디폴트 멤버는 오직 관리자(Owner) 본인만 지정 (`collaboratorIds: []`, `collaboratorEmails: []`). 협업자는 사용자가 앱에서 직접 필요할 때 추가함.
   - **Update / Re-seed Trips**: 기존 여행 문서가 이미 존재할 경우, 이미 등록된 멤버(`collaboratorIds`, `collaboratorEmails`)를 절대 덮어쓰거나 초기화하지 않고 **기존 멤버 데이터를 그대로 유지(Preserve)**할 것.

---

## 🚀 Phase 4: Execute & Verify

1. Run the seed script:
   ```bash
   node scripts/seed-<trip_key>.js
   ```
2. Verify terminal output shows:
   - `Found owner: ...`
   - `Seeded N daily itineraries.`
   - `Seeded budget document with N expenses.`
   - `Successfully completed seeding trip!`
3. Provide the user with the direct local web link:
   - `http://localhost:3000/trips/<tripId>`
