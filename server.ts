import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Database
const db = new Database("transport.db");

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    name TEXT,
    role TEXT
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    type TEXT,
    driverId TEXT,
    lat REAL,
    lng REAL,
    totalSeats INTEGER,
    availableSeats INTEGER,
    destination TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    passengerId TEXT,
    vehicleId TEXT,
    seatCount INTEGER,
    status TEXT,
    bookingPlace TEXT,
    destination TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial vehicles if empty
const vehicleCount = db.prepare("SELECT COUNT(*) as count FROM vehicles").get() as { count: number };
if (vehicleCount.count === 0) {
  const seedVehicles = [
    { id: 'RAA 101 A', type: 'bus', driverId: 'd1', lat: -1.9441, lng: 30.0619, totalSeats: 30, availableSeats: 12, destination: 'Kimironko', status: 'active' },
    { id: 'RAB 202 B', type: 'minibus', driverId: 'd2', lat: -1.9355, lng: 30.0601, totalSeats: 18, availableSeats: 5, destination: 'Remera', status: 'active' },
    { id: 'RAC 303 C', type: 'taxi', driverId: 'd3', lat: -1.9501, lng: 30.0585, totalSeats: 4, availableSeats: 2, destination: 'Nyabugogo', status: 'active' },
    { id: 'RAD 404 D', type: 'bus', driverId: 'd4', lat: -1.9362, lng: 30.0751, totalSeats: 30, availableSeats: 25, destination: 'Kimironko - Remera', status: 'active' },
  ];

  const insertVehicle = db.prepare("INSERT INTO vehicles (id, type, driverId, lat, lng, totalSeats, availableSeats, destination, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  seedVehicles.forEach(v => {
    insertVehicle.run(v.id, v.type, v.driverId, v.lat, v.lng, v.totalSeats, v.availableSeats, v.destination, v.status);
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Smart Transport SQL API is running" });
  });

  // Auth
  app.post("/api/auth/profile", (req, res) => {
    try {
      const { uid, name, role } = req.body;
      const stmt = db.prepare("INSERT OR REPLACE INTO users (uid, name, role) VALUES (?, ?, ?)");
      stmt.run(uid, name, role);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vehicles
  app.get("/api/vehicles", (req, res) => {
    try {
      const vehicles = db.prepare("SELECT * FROM vehicles").all();
      // Format for frontend
      const formatted = vehicles.map((v: any) => ({
        ...v,
        location: { lat: v.lat, lng: v.lng }
      }));
      res.json(formatted);
    } catch (error: any) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Bookings
  app.get("/api/bookings", (req, res) => {
    try {
      const { passengerId, role } = req.query;
      let bookings;
      if (role === 'agent') {
        bookings = db.prepare("SELECT * FROM bookings ORDER BY timestamp DESC").all();
      } else {
        bookings = db.prepare("SELECT * FROM bookings WHERE passengerId = ? ORDER BY timestamp DESC").all(passengerId);
      }
      res.json(bookings);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bookings", (req, res) => {
    const { id, passengerId, vehicleId, seatCount, status, bookingPlace, destination } = req.body;
    
    try {
      const transaction = db.transaction(() => {
        // Check seats
        const vehicle = db.prepare("SELECT availableSeats FROM vehicles WHERE id = ?").get(vehicleId) as any;
        if (!vehicle || vehicle.availableSeats < seatCount) {
          throw new Error("No seats available");
        }

        // Create booking
        db.prepare("INSERT INTO bookings (id, passengerId, vehicleId, seatCount, status, bookingPlace, destination) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run(id, passengerId, vehicleId, seatCount, status, bookingPlace, destination);

        // Update vehicle
        db.prepare("UPDATE vehicles SET availableSeats = availableSeats - ? WHERE id = ?")
          .run(seatCount, vehicleId);
      });

      transaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/routes", (req, res) => {
    try {
      const routes = [
        { id: 'R1', name: 'Nyabugogo - Kimironko', startHub: 'NYABUGOGO', endHub: 'KIMIRONKO', baseFare: 800 },
        { id: 'R2', name: 'Downtown - Remera', startHub: 'DOWNTOWN', endHub: 'REMERA', baseFare: 600 },
        { id: 'R3', name: 'Nyabugogo - Downtown', startHub: 'NYABUGOGO', endHub: 'DOWNTOWN', baseFare: 400 },
        { id: 'R4', name: 'Kimironko - Remera', startHub: 'KIMIRONKO', endHub: 'REMERA', baseFare: 1500 },
        { id: 'R5', name: 'Kimironko - Downtown', startHub: 'KIMIRONKO', endHub: 'DOWNTOWN', baseFare: 1000 },
      ];
      res.json(routes);
    } catch (error: any) {
      console.error("Error fetching routes:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
