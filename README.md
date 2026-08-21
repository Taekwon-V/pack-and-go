# Pack to Go - 여행 협업 및 일정·예산 관리 서비스

Pack to Go는 여행을 계획하고 진행하는 사용자들이 여행 정보, 일정, 예산, 멤버, 사진 기록을 실시간으로 공유하고 협업할 수 있도록 돕는 웹 기반 여행 통합 관리 플랫폼입니다.

---

## 📚 프로젝트 사양 및 요구사항 문서
- 📄 **[요구사항 정의서 (Requirements Specification)](docs/REQUIREMENTS_SPECIFICATION.md)**: 기능/비기능 요구사항, 사용자 역할 및 권한 정의
- 📐 **[시스템 사양서 (System Specification)](docs/SYSTEM_SPECIFICATION.md)**: 시스템 아키텍처, Firestore 데이터 모델, API 명세, 컴포넌트 구조, 시퀀스 다이어그램
- 🗄️ **[Firestore 스키마 (Legacy Schema)](firestore_schema.md)**: 기본 데이터베이스 컬렉션 명세

---

## 🚀 빠른 시작 (Getting Started)

1. **환경 변수 설정 (`.env.local`)**:
```env
GEMINI_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="....firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="....firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
```

2. **개발 서버 실행**:
```bash
npm install
npm run dev
```

3. **브라우저 접속**: [http://localhost:3000](http://localhost:3000)

---

## 🛠️ 주요 기술 스택
- **Framework**: Next.js 16.3.1 (App Router, Turbopack), React 19.2.8, TypeScript 5
- **Styling**: Tailwind CSS v4, Lucide React
- **BaaS & DB**: Firebase Authentication (Google OAuth), Cloud Firestore
- **AI**: Vercel AI SDK, Google Gemini 2.5 Flash (`@ai-sdk/google`)

