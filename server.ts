import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Smart Transport API is running" });
  });

  // Recommendation Logic (Mocked for now, will use Firestore data)
  app.post("/api/recommend", (req, res) => {
    const { lat, lng, destination } = req.body;
    res.json({ 
      message: "Recommendation engine active",
      params: { lat, lng, destination }
    });
  });

  app.get("/api/routes", (req, res) => {
    const routes = [
      { id: 'R1', name: 'Nyabugogo - Kimironko', startHub: 'NYABUGOGO', endHub: 'KIMIRONKO', baseFare: 500 },
      { id: 'R2', name: 'Downtown - Remera', startHub: 'DOWNTOWN', endHub: 'REMERA', baseFare: 400 },
      { id: 'R3', name: 'Nyabugogo - Downtown', startHub: 'NYABUGOGO', endHub: 'DOWNTOWN', baseFare: 300 },
    ];
    res.json(routes);
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
