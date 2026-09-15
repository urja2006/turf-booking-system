# 🏟️ TURFBOOK — AI-Powered Sports Turf Booking System

> **A modern, responsive full-stack sports turf and ground booking web application with real-time slot booking, geolocation search, Admin dashboard, and an AI-powered booking assistant.**

Built with **HTML5, Vanilla JavaScript, Bootstrap 5, Leaflet.js, Node.js, Express, and Supabase PostgreSQL & Authentication**.

---

## 🌟 Key Features

### 👤 User Features
* 🔍 **Location-Based Search**: Request live GPS coordinates or search by city/area (*Ahmedabad, Surat, Vadodara, Mumbai, Pune, Bengaluru, Delhi*) with live Haversine distance calculations (*e.g., "📍 2.4 km away"*).
* 🗺️ **Interactive Leaflet Maps**: View all matching turfs plotted on an OpenStreetMap with interactive preview popups and Google Maps turn-by-turn directions.
* ⚽ **Sport & Facility Filters**: Filter by Sport (*Football, Cricket, Box Cricket, Badminton, Futsal, Basketball, Volleyball, Tennis*), Distance radius (*5km, 10km, 25km, 50km*), Price range, and Facilities (*Floodlights, Parking, Changing Room, Canteen*).
* 📅 **Slot Booking Engine**: Real-time slot availability from `06:00 AM` to `11:00 PM` with **strict backend double-booking prevention**.
* 💳 **Payment Modes**: Support for **Pay at Venue** and **Demo Online Payment Gateway Simulator**.
* 👤 **User Dashboard**: Track upcoming matches, cancel eligible bookings with 1 click, view past booking history, and manage saved favorite turfs.
* ⭐ **Reviews & Ratings**: Submit star ratings and feedback for completed bookings.
* 🤖 **TurfBook AI Assistant**: Conversational assistant that extracts sports, budget, dates, and locations from plain English (*e.g., "Football turf near me under ₹1000"*), plus personalized recommendations based on your play history!

### 👑 Admin Features
* 📊 **Analytics Dashboard**: Real-time KPI summary cards (*Total users, active turfs, total bookings, today's bookings, revenue, pending requests*) and **Chart.js graphs** (*7-day booking trends and sports popularity*).
* 🏟️ **Turf Management**: Add new turfs with photos, custom per-sport pricing, coordinates, facilities, edit details, and soft-delete/deactivate turfs.
* 📑 **Booking Management**: View all customer bookings, filter by status (*Confirmed, Completed, Cancelled, Pending*), and update booking statuses.
* 👥 **User Management**: View player profiles, total spent, and toggle account activation.
* 🏅 **Sports Management**: Add and manage sport categories.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+), Bootstrap 5.3, Bootstrap Icons, Leaflet.js, OpenStreetMap, Chart.js, Google Fonts (*Plus Jakarta Sans*) |
| **Backend** | Node.js, Express.js, JWT, BcryptJS, CORS, Dotenv |
| **Database & Auth** | Supabase (PostgreSQL, Row Level Security, Storage) + In-Memory Fallback Engine |
| **APIs / AI** | Browser Geolocation API, Nominatim Geocoding, Built-in Rule-Based NLP Engine, OpenAI / Gemini API support |

---

## 🚀 Quick Start Guide (Run in 2 Minutes)

You can run TurfBook locally **immediately** without setting up cloud accounts first, thanks to the built-in local store!

### 1. Prerequisites
* Install **Node.js** (v18 or newer) from [nodejs.org](https://nodejs.org/).

### 2. Install Dependencies
Open your terminal in the project root directory and run:
```bash
npm install
```

### 3. Start the Application
```bash
npm start
```
*Or for automatic restart on code edits:*
```bash
npm run dev
```

### 4. Access the Web Application
* 🌐 **Player Web Application**: [http://localhost:5000](http://localhost:5000)
* 👑 **Admin Portal**: [http://localhost:5000/admin-login.html](http://localhost:5000/admin-login.html)

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@turfbook.com` | `admin123` | Full Admin Dashboard & Turf CRUD |
| **Demo Player** | `user@turfbook.com` | `user123` | Slot Booking, Dashboard & Favorites |

*(You can also register a brand new account anytime from the registration tab)*

---

## 🗄️ Setting Up Supabase (Production PostgreSQL)

When you are ready to connect to a cloud Supabase project:

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **"New project"**, choose a name (*e.g., TurfBook*), set a database password, and select your nearest region.

### 2. Run Database SQL Scripts
1. In your Supabase Dashboard, open the **SQL Editor** tab on the left sidebar.
2. Open `database/schema.sql` from this project, paste its content into the SQL Editor, and click **Run**.
3. Next, open `database/seed.sql`, paste its content, and click **Run** to seed 18 realistic turfs, sports, and sample reviews.

### 3. Get Your API Credentials
1. In Supabase, go to **Project Settings** (gear icon) -> **API**.
2. Copy your **Project URL** (`https://xyz.supabase.co`).
3. Copy your **anon (public)** key.
4. Copy your **service_role (secret)** key (keep this safe!).

### 4. Configure `.env`
Update your `.env` file in the project root:
```env
PORT=5000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=turfbook_super_secret_jwt_key_2026

# Optional: Add your OpenAI or Gemini key for advanced LLM reasoning
OPENAI_API_KEY=
GEMINI_API_KEY=
```

Restart the server with `npm start`. The server will log:
```
✅ Supabase connected successfully to: https://your-project-id.supabase.co
```

---

## 📁 Project Structure

```text
turf-booking/
├── database/
│   ├── schema.sql              # Supabase PostgreSQL DDL, RLS policies, indexes
│   └── seed.sql                # 18 realistic turfs in Indian cities, sports & reviews
│
├── server/
│   ├── server.js               # Express application entrypoint & static server
│   ├── supabase.js             # Supabase client & in-memory fallback engine
│   ├── aiService.js            # NLP query parser & recommendation algorithm
│   ├── middleware/
│   │   └── auth.js             # Token verification & requireAdmin authorization
│   └── routes/
│       ├── auth.js             # Register, Login, Admin Login, Profile
│       ├── turfs.js            # Search, distance calculation, details & reviews
│       ├── bookings.js         # Slot availability, double-booking check & history
│       ├── favorites.js        # User favorites toggle and retrieval
│       ├── ai.js               # AI natural language chat & recommendations
│       └── admin.js            # Admin stats, Chart.js data, Turf CRUD, user management
│
├── public/
│   ├── index.html              # Landing page (Hero GPS search, AI matches, sports)
│   ├── turfs.html              # Browse turfs with multi-filters & Leaflet map view
│   ├── turf-details.html       # Turf photo gallery, specs, directions map & reviews
│   ├── booking.html            # Slot picker, conflict validation & summary checkout
│   ├── dashboard.html          # User dashboard (Upcoming matches, history, favorites)
│   ├── login.html              # User login & registration
│   ├── admin-login.html        # Secure admin login portal
│   ├── admin.html              # Admin dashboard with Chart.js analytics & controls
│   ├── css/
│   │   └── style.css           # Sports emerald & navy responsive design system
│   └── js/
│       ├── common.js           # Auth state listener, navbar renderer & toast manager
│       ├── location.js         # Geolocation API, Nominatim geocoder, Haversine formula
│       ├── auth.js             # Login/Register form handlers
│       ├── turfs.js            # Dynamic card rendering, filter pipeline & map pins
│       ├── turf-details.js     # Details page loader & review submission
│       ├── booking.js          # Multi-step slot booking & checkout simulator
│       ├── dashboard.js        # Dashboard stats, cancellations & profile editor
│       ├── admin.js            # Admin Chart.js charts & management modals
│       └── ai.js               # Floating AI assistant widget & prompt sender
│
├── .env.example                # Environment variables template
├── .env                        # Local environment settings
├── package.json                # Project dependencies & npm scripts
└── README.md                   # Full documentation
```

---

## 📍 How Geolocation & Distance Search Works

1. **GPS Current Location**: When you click *"GPS"*, the browser requests high-accuracy latitude and longitude from the HTML5 Geolocation API.
2. **Place Geocoding**: When you type *"Vastrapur, Ahmedabad"* or *"Bandra, Mumbai"*, the system matches it with verified locality coordinates or uses the OpenStreetMap Nominatim geocoding service.
3. **Haversine Distance Formula**:
   $$\text{Distance} = 2 R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lon}}{2}\right)}\right)$$
4. **Radius Filtering**: The backend and frontend compute exact road distance in kilometers (*e.g., 2.4 km away*) and filter turfs within your chosen radius (5km, 10km, 25km, 50km).

---

## 🤖 How the AI Assistant Works

The AI Assistant handles natural language requests in the floating widget:
1. **Query**: *"I want a football turf near me under ₹1000"*
2. **NLP Extraction**:
   - `sport`: **football**
   - `maxPrice`: **₹1000**
   - `location`: **User's current GPS location**
3. **Database Querying**: Filters candidate turfs matching sport, price, and proximity, and renders interactive booking cards right inside the chat window!
4. **Resilient Fallback**: If no OpenAI API key is supplied, the built-in rule-based NLP engine processes the request without any external dependencies or crashes.

---

## 🧪 Testing the Complete Workflow

### 1. User Booking Test Flow
1. Open [http://localhost:5000](http://localhost:5000).
2. Type `Vastrapur` in the search box and click **Find Turfs**.
3. Filter by **Football** and select **Kick Arena Sports Hub**.
4. Click **Book Now** -> If not logged in, you will be prompted to sign in with `user@turfbook.com` / `user123`.
5. Select a date, choose an available green slot (e.g. `07:00 PM - 08:00 PM`), select **Pay at Venue**, and click **Confirm Booking**.
6. A confirmation modal with reference `TB-2026...` will pop up.
7. Open **My Dashboard** to see the booking in your active matches!

### 2. Admin Management Flow
1. Open [http://localhost:5000/admin-login.html](http://localhost:5000/admin-login.html).
2. Sign in with `admin@turfbook.com` / `admin123`.
3. View analytics charts, add a new turf arena in your city, and manage booking statuses.

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)
1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com) and import your repository.
3. Framework Preset: **Other** (Root Directory: `./`).
4. Under **Environment Variables**, add:
   - `SUPABASE_URL` (optional if using local fallback mode)
   - `SUPABASE_ANON_KEY`
   - `JWT_SECRET`
   - `OPENAI_API_KEY` (optional)
5. Click **Deploy**. Vercel will automatically serve the static files from `public/` and route all `/api/*` endpoints to the serverless function in `api/index.js`.

### Deploy to Render / Railway / Heroku
1. Push this repository to GitHub.
2. In [Render](https://render.com) or [Railway](https://railway.app), create a new **Web Service** and connect your repository.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add your `.env` variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `JWT_SECRET`).
6. Deploy! Your app will be live on a public HTTPS URL.

---

## 📄 License
This project is licensed under the ISC License. Created for educational, portfolio, and sports management purposes.
