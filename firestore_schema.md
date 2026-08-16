# Firestore Database Schema - Travel Planning Service

## Collections

### 1. `users`
Stores user profile information.
- **Document ID**: `uid` (from Firebase Auth)
- **Fields**:
  - `displayName` (string)
  - `email` (string)
  - `photoURL` (string, optional)
  - `status` (string) - 'approved' | 'pending'
  - `role` (string) - 'admin' | 'user'
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)

### 2. `trips`
Stores top-level information about travel plans.
- **Document ID**: Auto-generated
- **Fields**:
  - `title` (string) - e.g., "Summer in Paris"
  - `destination` (string)
  - `startDate` (timestamp)
  - `endDate` (timestamp)
  - `ownerId` (string) - Reference to `users.uid`
  - `collaboratorIds` (array of strings) - References to `users.uid`
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)
  - `status` (string) - e.g., "planning", "active", "completed"
  - `concept` (string, optional) - e.g., "맛집을 찾아 떠나는 여행"
  - `mapQuery` (string, optional) - e.g., "Okinawa, Japan"
  - `destinationDesc` (string, optional)
  - `weatherDesc` (string, optional)
  - `clothingDesc` (string, optional)
  - `gallery` (array of strings, optional) - URLs of destination placeholder photos

### 3. `itineraries` (Sub-collection under `trips`)
Stores daily schedules and activities for a trip.
- **Path**: `trips/{tripId}/itineraries/{itineraryId}`
- **Document ID**: Auto-generated
- **Fields**:
  - `dayNumber` (number) - e.g., 1, 2, 3
  - `date` (timestamp)
  - `activities` (array of objects):
    - `time` (string) - e.g., "09:00 AM"
    - `title` (string) - e.g., "Visit Eiffel Tower"
    - `location` (string)
    - `description` (string, optional)
    - `costEstimate` (number, optional)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)

### 4. `budgets` (Sub-collection under `trips`)
Stores expense tracking for a trip.
- **Path**: `trips/{tripId}/budgets/{budgetId}`
- **Document ID**: Auto-generated
- **Fields**:
  - `totalBudget` (number)
  - `currency` (string) - e.g., "USD", "EUR"
  - `expenses` (array of objects):
    - `id` (string)
    - `category` (string) - e.g., "flight", "accommodation", "food", "activity"
    - `amount` (number)
    - `description` (string)
    - `date` (timestamp)
    - `paidBy` (string) - Reference to `users.uid`
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)

### 5. `invites`
Stores trip invitations.
- **Document ID**: `inviteCode` (Short random code)
- **Fields**:
  - `tripId` (string)
  - `createdBy` (string) - Reference to `users.uid`
  - `createdAt` (timestamp)

### 6. `photos` (Sub-collection under `trips`)
Stores photos uploaded to a trip gallery.
- **Path**: `trips/{tripId}/photos/{photoId}`
- **Document ID**: Auto-generated
- **Fields**:
  - `url` (string) - URL to Firebase Storage
  - `uploadedBy` (string) - Reference to `users.uid`
  - `createdAt` (timestamp)

### 7. `comments` (Sub-collection under `photos`)
Stores comments for a specific photo.
- **Path**: `trips/{tripId}/photos/{photoId}/comments/{commentId}`
- **Document ID**: Auto-generated
- **Fields**:
  - `text` (string)
  - `authorId` (string) - Reference to `users.uid`
  - `authorName` (string)
  - `createdAt` (timestamp)
