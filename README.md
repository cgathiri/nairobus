# NairoBus - A Public Transport Scheduling System for Nairobi

**NairoBus** is a web-based public transport scheduling system developed as a capstone BSc Computer Science project
The system was designed to address the unpredictability of public transport scheduling in Nairobi by providing commuters with access to standardized route and departure information, while giving administrators tools to manage routes and schedules. The project focuses on the scheduling of **matatus and buses**, with Nairobi's public transport environment serving as the primary context.

## Features
### For commuters
- Create an account and log in securely
- Browse available public transport routes
- View scheduled departure and arrival times
- Select routes and view them on an interactive map
- Receive route information through a simple, user-friendly interface

### For administrators
- Add and delete routes
- Add and delete schedules
- View schedules associated with individual routes
- Generate route reports
- Review scheduling information and basic route statistics

### System functionality
- Session-based authentication
- Password hashing using bcrypt
- Role-based access for commuter and administrator accounts
- PostgreSQL database integration
- Interactive route visualization using Leaflet and Leaflet Routing Engine

---

## Tech Stack
| Layer | Technologies |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | express-session, bcrypt |
| Maps | Leaflet, Leaflet Routing Machine, OSRM |
| Map Tiles | Carto |
| Environment Configuration | dotenv |
| Development | Visual Studio Code |

---

### Prerequisites

Before running NairoBus locally, you will need:
- Node.js
- PostgreSQL
- Git

### 1. Clone the repository
```bash
git clone https://github.com/YOUR-USERNAME/nairobus.git
cd nairobus
```
### 2. Install dependencies
```bash
npm install
```
### 3. Configure environment variables
Create a `.env` file in the project root using `.env.example` as a template.
```env
DB_USER=your_database_user
DB_HOST=localhost
DB_NAME=your_database_name
DB_PASSWORD=your_database_password
DB_PORT=5432
SESSION_SECRET=your_session_secret
```

### 4. Set up PostgreSQL
Create a PostgreSQL database named `nairobus` and configure the required tables for users, routes, and schedules.
Update the database credentials in your `.env` file accordingly.

### 5. Start the server
```bash
node server/server.js
```
The application will run locally at:
```text
http://localhost:3000
```

---

## Database Design
The core database entities are:
- **Users** – stores commuter and administrator account information
- **Routes** – stores public transport route information
- **Schedules** – stores departure and arrival times associated with routes
Passwords are stored as bcrypt hashes rather than plaintext credentials.

---

## Testing
The system was tested throughout development using functional testing scenarios covering:
- User registration
- Successful and unsuccessful login
- Session management
- Route creation and deletion
- Schedule creation and deletion
- Route and schedule retrieval
- Route report generation
- Map and route visualization
- Error handling and validation

---

## Limitations
- The routing engine does not always accurately represent the exact paths followed by Nairobi matatus, meaning some route coordinates had to be manually specified.
- Map responsiveness on smaller screens could be improved.
- Administrator privileges are currently assigned directly in the database rather than through an administrative interface.
- The application currently uses a local PostgreSQL database and has not been deployed as a production service.
- Route and schedule validation could be strengthened to prevent all possible duplicate or inconsistent entries.

---

## Future Development
- Integration with **GTFS or Digital Matatus** data to reduce reliance on manually specified routes
- Email or OTP-based authentication
- Saved/favourite routes for commuters
- Notifications when saved route schedules change
- Downloadable administrative reports
- Improved auditability through `created_by` fields for routes and schedules
- Administrative user promotion through the dashboard
- Improved mobile map responsiveness
- Deployment as a production-ready web application

---

No open-source license has currently been assigned to this project. The repository is primarily intended as a portfolio and academic project showcase.
