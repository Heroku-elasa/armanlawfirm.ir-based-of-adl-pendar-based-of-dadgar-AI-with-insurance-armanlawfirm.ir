import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { runNewsSync } from "../services/newsScraper";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for Replit's infrastructure
app.set("trust proxy", 1);

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "../dist");
  app.use(express.static(distPath));
  console.log(`Serving static files from ${distPath}`);
}

(async () => {
  const server = await registerRoutes(app);

  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "../dist");
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const port = Number(process.env.PORT) || 3001;
  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`Port ${port} is in use, retrying...`);
      setTimeout(() => {
        server.close();
        server.listen(port);
      }, 1000);
    }
  });
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  // Run initial news sync on startup
  runNewsSync().catch(console.error);

  // Set up interval for news sync (every 6 hours)
  setInterval(() => {
    runNewsSync().catch(console.error);
  }, 6 * 60 * 60 * 1000);
})();
