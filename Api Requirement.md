# Backend API Refactoring Requirements

### Logic Change: Member QR Code

**Please note at the outset:** The QR code generated during the booking process is no longer a booking-specific QR code. It has now been changed to a **Member QR Code**. The QR code should map to the `userId` rather than a specific `bookingId`. Scanning this Member QR code at the gate should process the entry/exit based on the user's active/confirmed bookings.

---

### Core Refactoring Principles:

1. **Completely eliminate snake_case**: All HTTP Request Bodies (incoming payloads) and Response Bodies (returned JSON) MUST strictly use **camelCase**.
2. **No Database Schema Changes Required**: You **DO NOT** need to change the existing field names in the Firebase database (e.g., `user_id`, `entry_time`). Please implement a data interception and transformation layer (e.g., a `_serialize` helper function) at the Flask routing layer to map the database fields to the required camelCase fields.

---

## Specific API Refactoring Requirements

### 1. Bookings Module (`routes/bookings.py`)

#### 1.1 Create Booking (`POST /api/bookings/`)

- **Frontend Request Payload**:
  ```json
  {
    "userId": "user-001",
    "slotId": 2,
    "slotName": "A2",
    "date": "2026-04-28",
    "startTime": "09:00",
    "duration": 2,
    "cost": 4.00
  }
  ```

- **Backend Requirement**: Please parse the parameters exactly as shown above (do not expect `user_id` or `slot_id`). Return the completely created booking information using the "Standard Booking Object" format below.

#### 1.2 Standard Booking Response Object

For any endpoint returning booking data (list, single, entry, exit), the returned JSON object must contain and strictly name the following fields:

```json
{
  "id": "BK-001",           // Maps to doc.id
  "userId": "user-001",     // Maps to user_id
  "slotId": 2,              // Maps to slot_id
  "slotName": "A2",         // Maps to slot_number
  "date": "2026-04-28",
  "startTime": "09:00",
  "duration": 2,
  "cost": 4.00,             // Maps to fare_amount
  "status": "pending",      // pending | active | completed | cancelled
  "entryTime": "...",       // Maps to entry_time
  "exitTime": "...",        // Maps to exit_time
  "createdAt": "2026-05-15T00:00:00Z" // MUST be ISO 8601 format
}
```

#### 1.3 New/Updated Endpoints

- The existing `PUT /<id>/entry` and `PUT /<id>/exit` must guarantee that their return values conform to the Standard Booking Object structure above.
- **Required Addition**: Add a `PUT /api/bookings/<bookingId>/complete` endpoint. This is used after the frontend simulates payment completion to update the booking status to `completed`.

---

### 2. Slots Module (`routes/slots.py`)

#### 2.1 Slot List and Details (`GET /api/slots/` & `GET /api/slots/<slotId>`)

- **Standard Slot Response Object**:
  ```json
  {
    "id": 1,
    "name": "A1",           // Maps to DB slot_number
    "status": "free",       // free | occupied | reserved
    "sensorIR": false,
    "sensorUltrasonic": 120
  }
  ```

#### 2.2 Vehicle Count (`GET /api/slots/count`)

- **Return Value**: Change the current `vehicle_count` key to simply `count`.
  ```json
  {
    "count": 5
  }
  ```

---

### 3. Payments Module (`routes/payments.py`)

#### 3.1 Create Payment Intent (`POST /api/payments/create-intent`)

- **Request Payload**: Expect `{"bookingId": "...", "amount": 4.00}`.
- **Return Value**:
  ```json
  {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentId": "pi_xxx",
    "amountAud": 4.00
  }
  ```
  *(Note: Do not return `client_secret` or `stripe_payment_intent_id`)*

#### 3.2 Simulate/Process Payment (`POST /api/payments/<bookingId>/process`) (NEW)

Since the frontend includes a simulated payment flow, please add this endpoint. It should accept arbitrary payment details, update the order's payment status to `paid` in the database, and return `{"success": true, "paymentId": "..."}`.

---

### 4. Authentication Module (`routes/auth.py`)

#### 4.1 Register (`POST /api/auth/register`)

- **Request Payload**: Must parse `{"name": "", "email": "", "phone": "", "password": "", "licensePlate": ""}`.
- **Return Value**:
  ```json
  {
    "token": "eyJhb...",
    "userId": "user-001"    // Replaces user_id
  }
  ```

#### 4.2 Login (`POST /api/auth/login`)

- **Request Payload**: `{"email": "", "password": ""}`
- **Return Value**: Must also return `{"token": "...", "userId": "..."}`.
