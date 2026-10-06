require("dotenv").config(); // load env variables from .env file

//importing modules and libraries
const express = require("express"); // middleware
const path = require("path"); // file directory paths
const db = require("./db"); // db connection
const bcrypt = require("bcrypt"); // password hashing
const session = require("express-session"); // session mgt

const app = express(); // creates an instance of an express application - the object has middleware and routing methods that define how the server responds to client requests
const PORT = 3000;

app.use(express.json()); // allows express server to read data sent in a request body from the frontend, eg form data

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // allows cookies on localhost (should be true in production with HTTPS to ensure cookies are only sent over secure connections)
    maxAge: 1200000 // 20 minutes
  }
}));

app.use(express.urlencoded({ extended: true })); // allows express server to read URL-encoded data sent in a request body from the frontend, eg form data. extended: true allows for objects and arrays to be encoded into the URL-encoded format, which is useful for complex form data. if set to false, it will use the classic encoding which does not support nested objects or arrays. in this application, we use it to handle form submissions from the admin dashboard for adding routes and schedules

//serve frontend
app.use(express.static(path.join(__dirname, "../client"))); // serves the index.html file from the client directory

// handle user sign up and create a session for the new user
app.post("/api/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user details into db. the $1, $2, etc are placeholders for the values in the array that follows, which helps prevent SQL injection attacks. without them, a malicious user could input SQL code into the form fields that would be executed by the database, potentially leading to data breaches or loss. using parameterized queries with placeholders ensures that user input is treated as data rather than executable code.
    const result = await db.query(
      `INSERT INTO users (first_name, last_name, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, first_name, email`, // RETURNING allows us to get the id, first name, and email of the newly created user back from the database, which we can then use to create a session for the user and send a response back to the frontend with a welcome message and the user's details. this way, after signing up, the user can be automatically logged in and redirected to the home page without having to go through the login process again.
      [firstName, lastName, email, hashedPassword]
    );

    const user = result.rows[0];

    req.session.user = {
      id: user.id,
      name: user.first_name,
      email: user.email,
      role: "user"
    };

    res.json({
      message: "Account created! Redirecting...",
      redirect: "/home.html"
    });

  } catch (error) {
    console.error(error);

    if (error.code === "23505") { // error code for "unique constraint" violation in PostgreSQL, ie a user with the same email already exists
      return res.json({ message: "This email is already registered." });
    }

    res.json({ message: "Signup failed. Please try again." });
  }
});

// handle user login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) { // query returns an empty array
      return res.json({ message: "This email is not registered. Create an account instead." }) // error message if no user is found with the email address
    }

    const user = result.rows[0]; // user record from the database that matches the email provided in the login form. rows is an array of results returned by the database query, and since we're querying by email which should be unique, we expect either 0 or 1 results. if there is a match, we take the first (and only) result from the array

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.json({ message: "Incorrect password for this account." }) // error message if incorrect password is provided
    }

    req.session.user = {
      id: user.id,
      name: user.first_name,
      email: user.email,
      role: user.role
    };

    if (user.role === "admin") {
      return res.json({ redirect: "/admin-dashboard.html" });
    }

    res.json({ redirect: "/home.html" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed." });
  }
});

// handle user logout
app.post("/api/logout", (req, res) => {
  req.session.destroy((error) => { // deletes session from server

    if (error) {
      return res.status(500).json({ message: "Logout failed. Please try again." });
    }

    res.clearCookie("connect.sid"); // removes session cookie from browser

    res.json({
      message: "Logged out successfully.",
      redirect: "/index.html"
    });
  });
});

// send route data from admin dashboard form to backend
app.post("/add-route", async (req,res) => {
  const { route_name, start_stop, end_stop } = req.body;

  try {
    await db.query(
      `INSERT INTO routes (route_name, start_stop, end_stop)
      VALUES ($1, $2, $3)`,
      [route_name, start_stop, end_stop]
    );

    res.json({ message: "Route added successfully!" });

  } catch (error) {
    res.json({ message: "Error adding route. Please try again." });
  }
});

// send schedule data from admin dashboard form to backend
app.post("/add-schedule", async (req,res) => {
  const { route_id, departure_time, arrival_time } = req.body;

  try {
    await db.query(
      `INSERT INTO schedules (route_id, departure_time, arrival_time)
      VALUES ($1, $2, $3)`,
      [route_id, departure_time, arrival_time]
    );

    res.json({ message: "Schedule added successfully!" });

  } catch (error) {
    res.json({ message: "Error adding schedule. Please try again." });
  }
});

// populate route dropdown in the admin dashboard (schedule form, route card, report card) and home page (planner card)
app.get("/routes", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM routes ORDER BY id"
    );

    res.json(result.rows); // send array of routes to frontend

  } catch (error) {

    console.error(error);
    res.status(500).json({ message: "Error fetching routes. Please try again." });
  }
});

// route deletion
app.delete("/delete-route/:id", async (req, res) => {
  
  try {
    const routeId = req.params.id;

    await db.query(
      "DELETE FROM routes WHERE id = $1",
      [routeId]
    );

    res.json({ message: "Route deleted successfully." });

  } catch (error) {
    console.error(error);

    res.json({ message: "Failed to delete route." });
  }
});

// schedule deletion
app.delete("/delete-schedule/:id", async (req, res) => {

  try {
    const scheduleId = req.params.id;

    await db.query(
      "DELETE FROM schedules WHERE id = $1",
      [scheduleId]
    );
    res.json({ message: "Schedule deleted successfully." });

  } catch (error) {
    console.error(error);

    res.json({ message: "Failed to delete schedule." });
  }
});

// fetch schedules for display on admin dashboard and home page tables
app.get("/route-schedules/:routeId", async (req, res) => {

  const { routeId } = req.params;

  try {
    const result = await db.query(
      `SELECT id, departure_time, arrival_time
      FROM schedules
      WHERE route_id = $1
      ORDER BY departure_time`,
      [routeId]
    );

    res.json(result.rows);

  } catch (error) {

    console.error(error);
    res.json({ message: "Error fetching schedules." });
  
  }
});

// report generation for admin dashboard
app.get("/route-report/:routeId", async (req, res) => {
  
  try {
    const routeId = req.params.routeId;
    const result = await db.query(
      `
      WITH departure_gaps AS (
        SELECT
          departure_time,
          departure_time - LAG(departure_time) OVER (ORDER BY departure_time) AS gap
        FROM schedules
        WHERE route_id = $1
      )
      
      SELECT
        COUNT(*) AS total_schedules,
        MIN(departure_time) AS first_departure,
        MAX (departure_time) AS last_departure,
        ROUND(EXTRACT(EPOCH FROM AVG(arrival_time - departure_time)) / 60) AS avg_duration,
        ROUND(EXTRACT(EPOCH FROM AVG(gap)) / 60) AS avg_frequency
      FROM schedules
      LEFT JOIN departure_gaps USING (departure_time)
      WHERE route_id = $1
      `,
      [routeId]
    );
    
    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.json({ message: "Error generating report. Please try again." });
  }
});

// test backend connection
app.get("/api/test", (req, res) => {
  res.json({ message: "the backend connection is working!" });
});

// test database connection
app.get("/test-db", async (req, res) => {
  const result = await db.query("SELECT NOW()"); // posts the current time from the database, as defined by the NOW() function in SQL
  res.json(result.rows);
});

// test session management
app.get("/api/session", (req, res) => {

  if (req.session.user) {
    res.json({
      loggedIn: true,
      user: req.session.user
    });
  } else {
    res.json({
      loggedIn: false
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});