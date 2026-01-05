import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";

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

  const port = process.env.PORT || 3001;
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();
