# FarmFresh Backend

Simple Express.js backend for the Mandakini Organic Collective platform.
Uses a JSON file instead of a real database for now.

## How to run backend locally

1. Go into the Backend folder:

   ```
   cd Backend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):

   ```
   cp .env.example .env
   ```

   Then open `.env` and set `JWT_SECRET` to anything you want, like `mysecretkey123`.

4. Start the server:
   ```
   npm run dev
   ```

Server runs on `http://localhost:5001`

---

## User Roles

There are three roles in the system:

| Role           | Who it is                                  |
| -------------- | ------------------------------------------ |
| `ADMIN`        | Platform administrator                     |
| `COLLECTIVE`   | Zone coordinator from Mandakini Collective |
| `FARMER_GROUP` | Lead farmer of a registered group          |

---

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint             | Who can use | What it does          |
| ------ | -------------------- | ----------- | --------------------- |
| POST   | `/api/auth/register` | Anyone      | Create a new account  |
| POST   | `/api/auth/login`    | Anyone      | Login and get a token |

**Register body:**

```json
{
  "username": "mahesh_rana",
  "email": "mahesh@kedarcollective.in",
  "password": "password123",
  "role": "FARMER_GROUP"
}
```

**Login body:**

```json
{
  "email": "mahesh@kedarcollective.in",
  "password": "password123"
}
```

---

### Farmer Groups — `/api/groups`

All these need a `Authorization: Bearer <token>` header.

| Method | Endpoint                   | Who can use       | What it does              |
| ------ | -------------------------- | ----------------- | ------------------------- |
| GET    | `/api/groups`              | All roles         | Get all farmer groups     |
| GET    | `/api/groups?zone=Zone+C`  | All roles         | Filter by zone            |
| GET    | `/api/groups?status=Ready` | All roles         | Filter by status          |
| GET    | `/api/groups/:id`          | All roles         | Get a single group        |
| POST   | `/api/groups`              | ADMIN, COLLECTIVE | Add a new group           |
| PATCH  | `/api/groups/:id`          | All roles         | Update status/yield/crops |
| DELETE | `/api/groups/:id`          | ADMIN only        | Remove a group            |

**POST /api/groups body:**

```json
{
  "groupName": "New Valley Farmers",
  "leadFarmer": "Ramesh Kumar",
  "email": "ramesh@newvalley.in",
  "zone": "Zone B",
  "address": "Ukhimath • 1,800m",
  "distance": "6.5 km",
  "phone": "+91 90000 11111",
  "crops": ["Potato", "Peas"]
}
```

**PATCH /api/groups/:id body (any combo of these):**

```json
{
  "status": "Ready",
  "yield": "520 kg",
  "crops": ["Rajma", "Barley"]
}
```

---

### Collections — `/api/collections`

All need a `Authorization: Bearer <token>` header.

| Method | Endpoint                            | Who can use       | What it does                 |
| ------ | ----------------------------------- | ----------------- | ---------------------------- |
| GET    | `/api/collections`                  | All roles         | Get all collection schedules |
| GET    | `/api/collections?status=Scheduled` | All roles         | Filter by status             |
| GET    | `/api/collections?zone=Zone+A`      | All roles         | Filter by zone               |
| POST   | `/api/collections`                  | ADMIN, COLLECTIVE | Schedule a new collection    |
| PATCH  | `/api/collections/:id`              | ADMIN, COLLECTIVE | Update collection status     |

**POST /api/collections body:**

```json
{
  "farmerGroupId": "fg1",
  "crops": ["Rajma", "Red Rice"],
  "quantityKg": 430,
  "scheduledDate": "2026-07-05",
  "coordinatorNote": "Check road conditions before dispatch"
}
```

**PATCH /api/collections/:id body:**

```json
{
  "status": "Completed",
  "coordinatorNote": "Picked up successfully"
}
```

Valid collection statuses: `Scheduled`, `In Transit`, `Completed`, `Cancelled`

---

## Notes

- All data lives in `src/data/db.json` — this is the "database" for now
- CORS is set up to allow requests from `http://localhost:5173`
