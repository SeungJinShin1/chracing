# 🏎️ CH Racing System

초음파 센서 + NFC 태그 기반 실시간 RC카 레이싱 시스템.

## 아키텍처

```
Hardware (MakeCode) ──USB Serial──▶ Bridge (Python :8765) ──WebSocket──▶ Frontend (Next.js :3000)
                                                                              │
                                                                              ▼
                                                                     Backend (FastAPI :8000)
                                                                              │
                                                                              ▼
                                                                     Firebase Firestore
```

## 빠른 시작

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # API_SECRET_KEY 수정, serviceAccountKey.json 배치
python main.py               # http://localhost:8000
```

### 2. Bridge (Python)

```bash
cd bridge
pip install -r requirements.txt
SERIAL_PORT=COM3 python bridge_server.py   # ws://localhost:8765
```

### 3. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev                  # http://localhost:3000
```

## 페이지

| 경로 | 용도 |
|---|---|
| `/` | 메인 레이싱 화면 (타이머, 신호등, Ghost Pacer) |
| `/admin?pw=chracing2026` | 관리자 대시보드 (학생 관리, 수동 제어) |
| `/leaderboard` | 서브 모니터 리더보드 (실시간 TOP 10) |

## 환경변수

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_API_KEY=your-secret-key
ADMIN_PASSWORD=chracing2026
```

### Backend (`backend/.env`)
```
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
API_SECRET_KEY=your-secret-key
```

### Bridge (환경변수 또는 config.py)
```
SERIAL_PORT=COM3
WS_HOST=localhost
WS_PORT=8765
```

## 기술 스택

- **Frontend**: Next.js 15, TypeScript, Zustand, Firebase Client SDK
- **Backend**: FastAPI, Firebase Admin SDK, Pydantic
- **Bridge**: Python, websockets, pyserial, nfcpy
- **Hardware**: micro:bit (MakeCode), 초음파 센서, NFC 리더
- **Database**: Firebase Firestore
