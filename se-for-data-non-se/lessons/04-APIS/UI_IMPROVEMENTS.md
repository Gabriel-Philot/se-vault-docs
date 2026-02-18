# UI Improvements Plan - Pet Shop Virtual

## Overview

This document outlines the UI/UX improvements for the Pet Shop Virtual frontend. The goal is to create an engaging, pet-themed educational interface that makes learning APIs fun and interactive.

---

## 1. Theme & Colors

### Pet-Themed Palette (Pastel)

```css
:root {
  /* Primary - Pet Green (nature/health) */
  --pet-green-50: #f0fdf4;
  --pet-green-100: #dcfce7;
  --pet-green-200: #bbf7d0;
  --pet-green-300: #86efac;
  --pet-green-400: #4ade80;
  --pet-green-500: #22c55e;
  --pet-green-600: #16a34a;
  
  /* Accent - Pet Orange (energy/play) */
  --pet-orange-50: #fff7ed;
  --pet-orange-100: #ffedd5;
  --pet-orange-200: #fed7aa;
  --pet-orange-300: #fdba74;
  --pet-orange-400: #fb923c;
  --pet-orange-500: #f97316;
  
  /* Neutral - Pet Brown (warmth/earth) */
  --pet-brown-50: #faf5f0;
  --pet-brown-100: #f5ebe0;
  --pet-brown-200: #e6d5c3;
  --pet-brown-300: #d4b896;
  --pet-brown-400: #c4a373;
  --pet-brown-500: #a78a5c;
  
  /* Background */
  --bg-primary: #fffbf5;
  --bg-secondary: #fef7ed;
  --bg-card: #ffffff;
  
  /* Text */
  --text-primary: #3d2914;
  --text-secondary: #7c5d3a;
  --text-muted: #a68b6a;
}
```

### Design Tokens

- Border radius: `12px` for cards, `8px` for buttons, `20px` for pet cards
- Shadows: Soft, warm shadows with brown tint
- Fonts: Rounded, friendly sans-serif (Nunito or Quicksand)

---

## 2. Animated Pet Emojis

### Pet States

Each pet has visual states that reflect their hunger/happiness:

```typescript
type PetMood = 'happy' | 'neutral' | 'hungry' | 'sad';

const petEmojis = {
  dog: { happy: '🐕', neutral: '🐶', hungry: '🦮', sad: '🐕‍🦺' },
  cat: { happy: '😺', neutral: '🐱', hungry: '🙀', sad: '😿' },
  bird: { happy: '🐦', neutral: '🐤', hungry: '🦜', sad: '🐧' },
  fish: { happy: '🐠', neutral: '🐟', hungry: '🐡', sad: '🌊' },
  hamster: { happy: '🐹', neutral: '🐹', hungry: '🐹', sad: '🐹' },
};
```

### Animation Effects

```css
.pet-emoji {
  animation: bounce 2s ease-in-out infinite;
}

.pet-emoji.happy {
  animation: wiggle 1s ease-in-out infinite;
}

.pet-emoji.hungry {
  animation: shake 0.5s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes wiggle {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}
```

---

## 3. Collapsible Code Terminal

Based on OOP03's `CodeTerminal.tsx`, create a collapsible panel that shows real-time API requests/responses.

### Features

- Collapsible by default (minimized to a bar)
- Expandable to show full request/response
- Syntax highlighting for JSON
- Copy to clipboard button
- Request timing display
- Status code with color coding

### Component Structure

```tsx
interface CodeTerminalProps {
  title: string;
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: object;
  };
  response: {
    status: number;
    statusText: string;
    data: object;
    duration: number; // ms
  };
  defaultExpanded?: boolean;
}
```

### Visual Design

```
┌─────────────────────────────────────────────────────┐
│ 📡 API Terminal                          [▼] [📋]  │
├─────────────────────────────────────────────────────┤
│ REQUEST ─────────────────────────────────────────── │
│ POST /api/pets                                      │
│ { "name": "Rex", "species": "dog" }                │
│                                                     │
│ RESPONSE ────────────────────────────────────────── │
│ 201 Created · 45ms                                  │
│ { "id": 1, "name": "Rex", ... }                    │
└─────────────────────────────────────────────────────┘
```

---

## 4. Sidebar Navigation

### Structure

```
📚 Aprenda APIs
├── 🏠 Dashboard
├── 🐾 Meus Pets
├── 🔍 API Explorer
├── 🏗️ Arquitetura
├── 💻 Code Lab
└── 📖 Lições
    ├── O que é API?
    ├── HTTP Verbs
    ├── Status Codes
    ├── FastAPI + Pydantic
    ├── CRUD Completo
    ├── Nginx
    └── Redis Cache
```

### Behavior

- Collapsible on mobile (hamburger menu)
- Active state with pet-green highlight
- Smooth scroll to sections
- Icons for quick recognition

---

## 5. Interactive Architecture Page

### Visual Diagram

Create an interactive diagram showing:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│    Nginx    │────▶│   FastAPI   │
│  (React)    │     │  (Port 80)  │     │  (Port 8000)│
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐            │
                    │    Redis    │◀───────────┤
                    │  (Cache)    │            │
                    └─────────────┘            │
                                               │
                    ┌─────────────┐            │
                    │ PostgreSQL  │◀───────────┘
                    │  (Database) │
                    └─────────────┘
```

### Interactive Features

- Click on each component to see details
- Animated data flow lines (particles moving)
- Hover to highlight connections
- "View Logs" button for each service
- "Restart Service" button (for learning)

### Component Cards

Each component card shows:

- Icon/emoji
- Name and purpose
- Port number
- Health status (green/yellow/red)
- Key configuration
- Link to relevant lesson

---

## 6. Code Lab Page

### Purpose

A sandbox environment where students can:

1. Write and execute Python code
2. Make real API calls
3. See results immediately
4. Learn by doing

### Features

#### Code Editor

- Monaco Editor (VS Code-like)
- Pre-filled code snippets
- Syntax highlighting
- Auto-complete for API endpoints

#### Pre-built Exercises

```python
# Exercise 1: List all pets
import httpx

response = httpx.get("http://localhost/api/pets")
print(response.json())
```

```python
# Exercise 2: Create a pet
import httpx

pet_data = {
    "name": "Mel",
    "species": "cat",
    "age": 2
}
response = httpx.post("http://localhost/api/pets", json=pet_data)
print(f"Created pet with ID: {response.json()['id']}")
```

```python
# Exercise 3: Feed a pet
import httpx

pet_id = 1
response = httpx.post(f"http://localhost/api/pets/{pet_id}/feed")
pet = response.json()
print(f"{pet['name']}'s hunger: {pet['hunger']}")
```

### Safe Execution

- Code runs in a sandboxed container
- Timeout limits (5 seconds)
- Restricted imports
- Output capture and display

---

## 7. Dashboard Improvements

### Stats Cards

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 🐾 Total     │  │ 😊 Happy     │  │ 🍖 Hungry    │
│    Pets: 12  │  │    Pets: 8   │  │    Pets: 4   │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Activity Feed

Real-time feed showing:

- Pet created
- Pet fed
- Pet played with
- Cache hit/miss

### Quick Actions

- "Create Random Pet" button
- "Feed All Pets" button
- "Play with All Pets" button

---

## 8. Pet Manager Improvements

### Pet Cards

```
┌─────────────────────────────────┐
│  🐕 Rex                         │
│  ─────────────────────────────  │
│  Species: Dog    Age: 3 years   │
│                                 │
│  😊 Happiness: ████████░░ 80%   │
│  🍖 Hunger:    ████░░░░░░ 40%   │
│                                 │
│  [🍖 Feed]  [🎾 Play]  [❌ Delete] │
└─────────────────────────────────┘
```

### Create Pet Form

- Species dropdown with emoji icons
- Name input with validation
- Age slider
- Details JSON editor (optional)

---

## 9. API Explorer Improvements

### Endpoint Cards

Each endpoint as an interactive card:

```
┌─────────────────────────────────────────┐
│ GET /api/pets                           │
│ ─────────────────────────────────────── │
│ List all pets in the database           │
│                                         │
│ Parameters:                             │
│   species (optional): Filter by species │
│                                         │
│ [Try it!] [View Response]               │
└─────────────────────────────────────────┘
```

### Response Viewer

- Formatted JSON with syntax highlighting
- Response time display
- Status code badge (color-coded)
- Headers collapsible section

---

## 10. Implementation Priority

### Phase 1 - Foundation (MVP)
1. ✅ Basic layout with routing
2. ✅ Dashboard with stats
3. ✅ Pet Manager (CRUD)
4. ✅ API Explorer

### Phase 2 - Theme & Polish
1. Pet-themed colors
2. Animated emojis
3. Improved card designs
4. Better forms and buttons

### Phase 3 - Interactive Learning
1. Collapsible Code Terminal
2. Interactive Architecture page
3. Code Lab (sandboxed)

### Phase 4 - Navigation & UX
1. Sidebar navigation
2. Mobile responsiveness
3. Keyboard shortcuts
4. Dark mode (optional)

---

## 11. File Structure

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   ├── pets/
│   │   ├── PetCard.tsx
│   │   ├── PetForm.tsx
│   │   └── PetList.tsx
│   ├── api/
│   │   ├── EndpointCard.tsx
│   │   ├── ResponseViewer.tsx
│   │   └── CodeTerminal.tsx
│   ├── architecture/
│   │   ├── ArchitectureDiagram.tsx
│   │   └── ServiceCard.tsx
│   └── codelab/
│       ├── CodeEditor.tsx
│       ├── ExerciseList.tsx
│       └── OutputViewer.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── PetManager.tsx
│   ├── ApiExplorer.tsx
│   ├── Architecture.tsx
│   └── CodeLab.tsx
├── hooks/
│   ├── usePets.ts
│   ├── useApi.ts
│   └── useCache.ts
├── styles/
│   └── pet-theme.css
└── App.tsx
```

---

## 12. Dependencies to Add

```json
{
  "dependencies": {
    "react-router-dom": "^6.x",
    "@monaco-editor/react": "^4.x",
    "react-syntax-highlighter": "^15.x",
    "framer-motion": "^10.x",
    "lucide-react": "^0.x"
  }
}
```

---

## Notes

- All colors should pass WCAG AA contrast requirements
- Animations should respect `prefers-reduced-motion`
- Code Terminal should be keyboard accessible
- Mobile-first responsive design
