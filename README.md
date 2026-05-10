# CITS_5506
IoT Group Project

## Smart Parking System - Frontend

This is the frontend interface for the Smart Parking IoT system, built with **Next.js 14** and **Tailwind CSS**.

### Quick Start
1. Navigate to the `frontend` folder: `cd frontend`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

**Test Account**
- **Email:** `test@example.com`
- **Password:** `123456`

---

### User Tutorial (Currently Implemented Features)

The frontend currently simulates the complete user journey for the smart parking application. No real hardware or backend is required to test this flow:

**1. Authentication (`/login`, `/register`)**
- Users can create a new account or log in using the test credentials provided above.

**2. Real-time Dashboard (`/dashboard`)**
- Displays a visual map of the parking lot with 3 distinct slots.
- Color-coded status: **Green** (Available), **Red** (Occupied).
- Shows real-time statistics including a total vehicle counter.

**3. Booking System (`/booking`)**
- Users can select a parking slot, date, start time, and estimated duration.
- The system prevents double-booking for the same time and slot.

**4. Member QR Code (`/qrcode`)**
- Generates a unique QR code for the user. In the real system, this is scanned at the physical entrance/exit gates.
- Displays all currently active or confirmed bookings.

**5. Simulated Exit & Payment Flow (`/payment`)**
- **How to test:** Go to the QR Code page and click the `🚙 Simulate Exit & Pay` button under your active booking.
- The system simulates driving out of the parking lot. It captures the real-time exit time, calculates the actual duration you parked, and computes the final cost ($2/hr).
- A mock checkout form is presented. Completing the payment marks the session as `Completed`.

**6. Booking History (`/history`)**
- A comprehensive table showing all past and current bookings.
- Filter bookings by status: `All`, `Confirmed`, `Active`, `Completed`, or `Cancelled`.
