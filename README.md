# Farm Fresh Platform ✨

Welcome to the comprehensive documentation for the Farm Fresh Platform. Farm Fresh is a highly scalable, robust, and feature-rich digital ecosystem engineered specifically to seamlessly connect organic farmer groups with large-scale agricultural collectives, distributors, and bulk purchasers. By aggressively digitizing the agricultural supply chain, Farm Fresh fundamentally streamlines complex logistics, deeply manages crop scheduling, and provides the necessary operational tools required for a modern, efficient, and transparent agricultural network. 

Our overarching platform mission is to completely eliminate food waste by accurately predicting market demand, ensuring fair trade and prompt, secure payments for local farmers, and giving large collectives a deeply reliable, transparent pipeline of high-quality organic products. We remove the opaque layers of traditional middlemen, returning the profit margins directly to the people who grow the food.

## 📜 Table of Contents
- [✨ Overview and Mission Statement](#-overview-and-mission-statement)
- [🔸 Frontend Architecture & Design](#-frontend-architecture--design)
- [⚡ Backend Architecture & Infrastructure](#-backend-architecture--infrastructure)
- [🛡️ Authentication, Authorization & Security](#-authentication-authorization--security)
- [🟨 Database, Storage & Indexing](#-database-storage--indexing)
- [♦️ Schema Design & Data Flow](#-schema-design--data-flow)
- [📜 Detailed API Endpoints & Usage](#-detailed-api-endpoints--usage)
- [🟢 Current Progress & Milestones](#-current-progress--milestones)
- [🔥 Future Targets & Technology Roadmap](#-future-targets--technology-roadmap)
- [💡 Getting Started & Installation Guide](#-getting-started--installation-guide)

## ✨ Overview and Mission Statement

Farm Fresh was meticulously built from the ground up to bridge the critical and historically inefficient gap between organic crop producers (referred to in the platform as Farmers or Farmer Groups) and bulk agricultural purchasers (referred to as Collectives). In traditional agricultural systems, farmers often struggle significantly to find consistent, well-paying buyers for their yields, leading to massive post-harvest losses and financial instability. Conversely, collectives, supermarkets, and distributors constantly struggle to track down reliable, high-quality organic suppliers who can meet their strict seasonal demands and quality control metrics.

By digitally managing everything from the initial membership requests to granular, crop-specific supply deals, Farm Fresh creates a highly transparent, heavily audited, and remarkably efficient agricultural supply chain. We empower farmers to list their anticipated yields, expected harvest dates, and current crop stages, while collectives can actively seek out specific produce and establish long-term, mutually beneficial supply contracts. This symbiotic relationship ensures that farmers plant exactly what the market demands, and collectives receive exactly what they paid for.

## 🔸 Frontend Architecture & Design

The frontend application is built to deliver a highly responsive, extremely intuitive, and lightning-fast experience. It must cater to two wildly different demographics: farmers utilizing mobile devices in rural areas with potentially unstable internet connections, and collective managers operating powerful desktop machines in urban offices. We utilize modern web technologies to ensure that the application feels exactly like a native experience.

**Core Technologies & Libraries:**
- **Framework:** React & Vite ⚡ - We explicitly chose Vite over traditional bundlers like Webpack due to its ultra-fast Hot Module Replacement (HMR) during development and its heavily optimized, Rollup-based production builds. This ensures our JavaScript bundles remain incredibly small, decreasing initial load times for rural users.
- **Styling:** TailwindCSS 🔸 - A utility-first CSS framework that allows for rapid UI development and enforces a highly consistent, responsive design system. By utilizing Tailwind, we eliminate dead CSS code, further shrinking our asset payload.
- **State Management:** We utilize a combination of the React Context API and localized component state (via `useState` and `useReducer`) for managing complex user sessions, dynamic UI toggles, and real-time data fetching.
- **HTTP Client:** We utilize Axios with heavily customized interceptors to automatically attach JWT authorization headers to outgoing requests and seamlessly handle token refreshes in the background without interrupting the user experience.

<details>
<summary>🔸 <strong>Dynamic Dashboards & Component Hierarchy</strong></summary>

The platform features distinct, highly tailored dashboards for Farmers and Collectives, strictly separated via React Router based on the authenticated user's role.
- **The Farmer Dashboard:** Focuses heavily on crop lifecycle tracking. Components are designed to be highly legible on small screens. Farmers can update the stage of their crops (e.g., from `SOWING` to `HARVEST`), adjust yield estimations, and monitor active deal statuses with various collectives.
- **The Collective Dashboard:** Built for high-density data consumption. It provides a bird's-eye tabular view of all incoming crop supplies, pending membership requests from various farmers, and overall inventory fulfillment metrics. Components utilize advanced data tables with sorting and filtering capabilities.
</details>

<details>
<summary>💡 <strong>FarmAssist AI Interface Integration</strong></summary>

A dedicated, chat-like interface that connects directly to our AI backend. We recognize that modern farming requires data. Farmers can input specific details about their local soil quality, current weather conditions, and regional historical data. The frontend securely transmits this to our backend AI module, which processes the context and streams back real-time, AI-driven recommendations on what crops to plant next to maximize their yield and market profitability.
</details>

## ⚡ Backend Architecture & Infrastructure

Our server relies on a highly scalable, robust MVC-inspired (Model-View-Controller) structure built on top of Node.js and Express.js. It is strictly designed to handle thousands of concurrent requests while maintaining low latency, high reliability, and preventing race conditions during crop booking.

**Core Technologies & Paradigms:**
- **Environment:** Node.js 🟩 - Leveraging the asynchronous, event-driven, non-blocking I/O model of Node.js to handle numerous simultaneous database read/write operations without locking the main thread.
- **Framework:** Express.js - A minimal and flexible Node.js web application framework that provides a robust set of features for building our REST API.

<details>
<summary>⚡ <strong>Controllers & Services Isolation (Business Logic)</strong></summary>

We strictly separate our business logic from our route handling to adhere to the Single Responsibility Principle. 
- **Services (e.g., `collective.service.js`, `farmer.service.js`):** These modules contain all the complex database queries, multi-document transactions, and core algorithmic logic. 
- **Controllers (e.g., `collective.controller.js`):** These modules simply handle the HTTP request/response cycle. They extract parameters from the `req` object, pass them to the appropriate service function, and format the returned data into standardized JSON responses via the `res` object. This strict separation ensures our code is deeply testable and highly maintainable.
</details>

<details>
<summary>✅ <strong>Express Async Handler & Centralized Error Management</strong></summary>

To keep our controller logic exceptionally clean and readable, we wrap all our asynchronous route handlers in a utility called `express-async-handler`. This completely eliminates the need for deeply nested, repetitive `try/catch` blocks that clutter the codebase. If any promise within the controller or service rejects (or if we explicitly call our custom `throwErr` function), the error is automatically caught and forwarded to our global error-handling middleware via the `next()` function. The global handler then determines the appropriate HTTP status code (e.g., 400 Bad Request, 404 Not Found, 500 Internal Server Error) and returns a consistent error schema to the frontend.
</details>

## 🛡️ Authentication, Authorization & Security

Security is an absolute, critical priority for Farm Fresh. Because we are dealing with people's livelihoods and financial contracts, we must ensure unwavering trust between farmers and collectives. A single data breach or unauthorized modification of a crop deal could severely damage the ecosystem.

- **JWT-Based Authentication:** We implement secure, stateless session management using JSON Web Tokens (JWT). ⭐ Upon successful login, the server issues an access token. This token is cryptographically signed and must be included in the `Authorization` header of all subsequent API requests.
- **OTP Email Verification:** To completely prevent spam accounts and ensure all platform users are reachable, we mandate an OTP (One-Time Password) verification flow during the registration process. 📧
- **Rate Limiting Protection:** We actively protect highly sensitive endpoints (specifically `/api/auth/login`, `/api/auth/get-otp`, and `/api/auth/forgot-password`) from brute-force password guessing, credential stuffing, and SMS/Email pumping attacks using sliding-window rate limiters. 🔴

<details>
<summary>🛡️ <strong>Role-Based Access Control (RBAC) Implementation</strong></summary>

Our custom authorization middleware strictly protects endpoints based on the authenticated user's assigned role inside their JWT payload. We define distinct roles such as `ADMIN`, `USER`, `COLLECTIVE`, and `FARMER`. 
When a request hits an endpoint like `POST /api/collective/accept-membership`, it first passes through the `verifyToken` middleware to ensure the user is authenticated, and then passes through the `authorizeRoles("COLLECTIVE")` middleware. If a Farmer maliciously attempts to access this endpoint to approve their own request, the middleware immediately intercepts the request and returns a 403 Forbidden response.
</details>

<details>
<summary>⚠️ <strong>Data Sanitization, Validation & Helmet</strong></summary>

All incoming client requests are aggressively sanitized and validated before they ever touch the execution context of the controller. We utilize middleware to enforce strict validation schemas on request bodies, query parameters, and URL parameters. This instantly rejects malformed data injections and completely neutralizes NoSQL injection attack vectors. Furthermore, we utilize the `Helmet` package to automatically set hardened HTTP response headers, mitigating cross-site scripting (XSS), clickjacking, and other common web vulnerabilities.
</details>

## 🟨 Database, Storage & Indexing

**Database Choice:** MongoDB (via Mongoose ODM) 🟡

MongoDB is the absolute perfect architectural choice for this platform due to its inherently flexible, document-based schema. Agriculture is highly dynamic; our data models must contain varying, deeply nested properties. For instance, Farmer addresses may require complex geospatial coordinates, while Crop yields require deeply nested historical tracking arrays. A rigid SQL structure would demand constant, painful schema migrations as our feature set grows. 

MongoDB's BSON (Binary JSON) document structure aligns perfectly with our Node.js/JavaScript stack, eliminating the need for complex Object-Relational Mapping (ORM) translation layers. We utilize Mongoose on top of the native MongoDB driver to add necessary application-level strictness: enforcing data types, providing pre-save lifecycle hooks (e.g., automatically updating `lastUpdated` timestamps), and enabling powerful relational population mechanisms (SQL `JOIN` equivalents). We also heavily utilize MongoDB database indexing on frequently queried fields like `email`, `role`, and `status` to ensure database reads remain near-instantaneous even as the platform scales to millions of records.

## ♦️ Schema Design & Data Flow

Our database schema is deeply optimized for scalability, read performance, and clear relational mapping across the vast ecosystem. We specifically design our documents to avoid unbounded array growth while maintaining necessary references.

<details>
<summary>♦️ <strong>Core Base Entities (Users, Farmers & Collectives)</strong></summary>

- **Users Collection:** The foundational authentication record. Stores the email, securely hashed password (via bcrypt), and the RBAC `role`.
- **Farmers Collection:** Linked to the User record. Contains highly specific profile data for crop producers. Includes fields for their total farm size (in acres/hectares), specific location zones, and preferred growing methodologies (e.g., Organic, Hydroponic, Traditional).
- **Collectives Collection:** Linked to the User record. Represents the buyers. Includes fields for their warehouse storage capacities, required supply volumes, operational logistics regions, and overall reputation scores.
</details>

<details>
<summary>♦️ <strong>The Crop Management System (FarmerCrops)</strong></summary>

- **Crops Collection:** A master, read-only dictionary of all recognized crops in the platform (e.g., "Tomato", "Wheat", "Soybean"). This ensures naming consistency across the entire database.
- **FarmerCrops Collection:** When a farmer declares they are growing a specific crop, a document is created here linking the Farmer to the Master Crop. It tracks real-time data: `expectedYield`, `plantedDate`, `harvestDate`, and current `stage` (`SOWING`, `PLANTING`, `MATURE`, `HARVEST`).
</details>

<details>
<summary>♦️ <strong>The Membership & CropDeal Ecosystem (The Core Engine)</strong></summary>

- **Membership Collection:** Acts as a macro-level join-structure connecting a specific Farmer to a specific Collective. It tracks the overarching relationship, such as the farmer's assigned zone relative to the collective.
- **CropDeal Collection:** This is where the magic happens. Approvals are not handled at the macro Membership level, but at the micro CropDeal level. A `CropDeal` strictly tracks the specific agreement for a single crop type between that farmer and collective. 
It maintains granular activity statuses:
  - `status`: Determines if the request is active in the system (`ACTIVE`, `INACTIVE`).
  - `dealStatus`: The exact phase of the negotiation (`REQUESTED`, `APPROVED`, `REJECTED`, `CANCELLED`, `ABANDONED`).
This robust architecture allows a collective to explicitly approve a farmer's request to supply Apples (`APPROVED`), while simultaneously rejecting their request to supply Oranges (`REJECTED`). If a farmer stops growing a crop, the system automatically cascades and marks the associated CropDeal as `ABANDONED`. 📜
</details>

Below are the visual schema relationship diagrams illustrating our database structure:

![Schema Diagram](Resources/ER-Diagram.png)
<br/>
![Entity Tables](Resources/Entity-Tables.png)

## 📜 Detailed API Endpoints & Usage

Our RESTful API is comprehensively structured around domain-driven design principles. Below is a detailed breakdown of the endpoints available to the client applications, categorized by their domain. 

<details>
<summary>🛡️ <strong>Auth Routes (`/api/auth`)</strong></summary>

Handles all identity management, session creation, and secure token dispatching.

- `POST /login` - Authenticates a user.
  - **Payload:** `{ "email": "farmer@test.com", "password": "SecurePassword123!" }`
  - **Response:** Returns a signed JWT and base user info.
- `POST /register` - Registers a new user account into the system.
- `POST /get-otp` - Generates a secure One-Time Password and dispatches it to the user's email for identity verification. 📧
- `POST /forgot-otp` - Validates the submitted OTP for a forgotten password reset flow.
- `POST /forgot-password` - Updates the user's password securely after OTP validation.
- `POST /refresh` - Issues a new JWT using a valid refresh token.
- `GET /google` - Initiates the OAuth2 SSO flow via Google. ⭐
</details>

<details>
<summary>🔸 <strong>User Routes (`/api/user`)</strong></summary>

Handles profile management and administrative access.

- `GET /user` - Fetches the current authenticated user's base profile data.
- `GET /admin` - Fetches system-wide administrative metrics. Strictly requires the `ADMIN` role.
- `PATCH /update-profile` - Allows authenticated users to modify their personal contact details and platform preferences.
</details>

<details>
<summary>🟩 <strong>Collective Routes (`/api/collective`)</strong></summary>

Endpoints specifically restricted to users with the `COLLECTIVE` role.

- `GET /` - Fetches a public directory of all registered collectives.
- `POST /me/add-crop` - Allows a collective manager to append a new crop requirement to their demand list.
  - **Payload:** `{ "cropCode": "TOM", "requiredQuantity": 500 }`
- `PUT /me/update-crop` - Modifies existing crop requirements.
- `POST /accept-membership` - Executes a multi-document database transaction to accept a farmer's crop deal request, updating the status of multiple `CropDeal` documents to `APPROVED` simultaneously. ✅
</details>

<details>
<summary>🟨 <strong>Farmer Routes (`/api/farmers`)</strong></summary>

Endpoints specifically restricted to users with the `FARMER` role.

- `GET /` - Fetches a directory of all registered farmer groups.
- `POST /add-crop` - Allows a farmer to declare a new crop they are currently cultivating.
- `PUT /edit-crop` - Edits ongoing crop yield projections or updates harvest completion dates.
- `POST /request-membership` - Initiates a multi-document transaction to request supplying specific crops to a chosen collective. Automatically generates pending `CropDeal` records with a `REQUESTED` status. 📜
</details>

<details>
<summary>💡 <strong>AI & Data Routes (`/api/ai` & `/api/data`)</strong></summary>

Handles machine learning integrations and master data lists.

- `POST /api/ai/advise` - Transmits environmental data (soil, weather) to the AI engine, returning actionable crop recommendations. ✨
- `GET /api/data/crops` - Fetches the master, read-only list of all available and supported crop types in the system.
</details>

## 🟢 Current Progress & Milestones

We have made significant strides in completing the foundational architecture of the Farm Fresh platform. The following core milestones have been successfully delivered and rigorously tested:

- ✅ **Robust Core Infrastructure:** The entire server architecture, MongoDB database connections, global error handling, and secure environment configurations are 100% completed.
- ✅ **Secure Authentication Flow:** Secure login, encrypted registration, and highly reliable OTP-based email verification are fully operational.
- ✅ **Advanced Membership & Deal Engine:** The highly complex transactional logic for sending, accepting, and completely canceling crop-specific membership requests is fully implemented. Mongoose sessions are utilized heavily here to ensure ACID-compliant transactions across the `Membership` and `CropDeal` collections.
- ✅ **Dynamic Crop Management:** Farmers can seamlessly add, edit, and safely delete crops from their profiles. The system intelligently detects deletions and automatically cascades database updates to permanently abandon any dependent, active crop deals.

## 🔥 Future Targets & Technology Roadmap

The future of Farm Fresh is deeply intertwined with cutting-edge agricultural technology. We have an aggressive roadmap for the upcoming development quarters:

- 🔸 **Advanced AI Integration Expansion:** Implement much deeper, predictive AI-powered recommendations. Rather than just suggesting crops based on soil composition, the AI will actively map national market demand trends, historical pricing data, and weather forecasts to maximize farmer profit margins.
- 🔸 **Real-Time Logistics Tracking:** Implement GPS-based IoT real-time tracking of crop shipments as they travel from the rural farm to the central collective warehouses, providing collectives with exact ETAs.
- 🔸 **Comprehensive Analytics Dashboard:** Build advanced, interactive data visualization metrics (using libraries like D3.js or Chart.js) for collectives to actively track seasonal supply trends and identify potential inventory shortages weeks in advance.
- 🔸 **Escrow Payment Gateway:** Integrate secure, smart-contract-based escrow and direct payment settlements for crop deals using Stripe or crypto-based ledgers to guarantee prompt payment upon delivery.
- 🔸 **Real-Time Alerts & Notifications:** Push real-time WebSocket status updates and push notifications to clients for changing deals, approved requests, and sudden market shifts. 🔔
- 🐦 **Dedicated Mobile Application:** Port the core frontend features to a native React Native application, creating a highly optimized, offline-first mobile app for on-the-go access by farmers working directly in the field with poor cellular reception.

## 💡 Getting Started & Installation Guide

Follow these highly detailed instructions to bootstrap the Farm Fresh environment on your local development machine.

1. **System Prerequisites:** Ensure you have Node.js (version 18 or higher recommended) and MongoDB installed locally. Alternatively, you can utilize a cloud-based MongoDB Atlas cluster for your database.
2. **Repository Setup:** Clone the repository to your local machine and navigate directly into the `Backend/` directory using your terminal.
3. **Environment Configuration:** Locate the provided `.env.example` file. Duplicate it and rename the copy strictly to `.env`. Carefully fill in your specific MongoDB connection URI, secure JWT secret strings, and any required email SMTP credentials for OTP dispatching:
   ```bash
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/FarmFresh
   JWT_SECRET=your_super_secure_randomized_string_here
   PORT=5000
   ```
4. **Database Seeding:** Run the database seed script. This vital step will automatically populate your empty database with the initial master crop types and generate a suite of test user accounts (Admin, Farmer, Collective) for immediate testing:
   ```bash
   node src/seed.js
   ```
5. **Launch Environments:** Open two entirely separate terminal instances. In the first, navigate to the `Backend/` folder and start the Express server. In the second, navigate to the `Frontend/` folder and launch the Vite development server. Both can be started utilizing:
   ```bash
   npm run dev
   ```
   ⭐ Enjoy building the future of agriculture with Farm Fresh!
