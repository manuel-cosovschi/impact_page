import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { z } from "zod";
import dotenv from "dotenv";

import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for Vite dev
}));
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Database Setup
const db = new Database("impact.db");
db.pragma("journal_mode = WAL");

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT,
    title TEXT,
    subtitle TEXT,
    pitch TEXT,
    email TEXT,
    linkedin TEXT,
    github TEXT,
    status TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    type TEXT,
    summary TEXT,
    problem TEXT,
    solution TEXT,
    stack TEXT, -- JSON array
    highlights TEXT, -- JSON array
    challenges TEXT, -- JSON array
    architecture_diagram TEXT,
    links TEXT, -- JSON object
    order_index INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT,
    page TEXT,
    metadata TEXT, -- JSON object
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );
`);

// Seed Initial Data if empty
const profileCount = db.prepare("SELECT COUNT(*) as count FROM profile").get() as { count: number };
if (profileCount.count === 0) {
  db.prepare(`
    INSERT INTO profile (id, name, title, subtitle, pitch, email, linkedin, github, status)
    VALUES (1, 'Manuel Cosovschi', 'Estudiante avanzado de Ingeniería en Sistemas', 'Proyectos full-stack en producción.', 
    'Aprendí construyendo: Desde scripts de automatización hasta aplicaciones web completas durante la carrera. Capacidad para adaptarme a nuevas tecnologías (Node, React, Python) demostrada en proyectos académicos y prácticas. Busco mi primera experiencia formal con ganas de aportar valor desde el primer día y crecer profesionalmente.',
    'manuel.cosovschi@example.com', 'linkedin.com/in/manuelcosou', 'github.com/manuelcosou', 'DISPONIBLE')
  `).run();

  const projects = [
    {
      title: 'FitNow App',
      type: 'Tesis',
      summary: 'App iOS en SwiftUI con backend en Node.js/Express y MySQL. Módulo de recomendaciones en Python usando Ridge Regression.',
      problem: 'Falta de personalización en rutinas de entrenamiento y seguimiento eficiente de telemetría.',
      solution: 'Implementación de IA para sugerencias personalizadas y optimización de navegación GPS/batería.',
      stack: JSON.stringify(['SwiftUI', 'NodeJS', 'MySQL', 'Python', 'Jupyter']),
      highlights: JSON.stringify(['Navegación paso a paso', 'Telemetría en tiempo real', 'Ridge Regression']),
      challenges: JSON.stringify(['Optimización de batería', 'Manejo eficiente de datos GPS']),
      architecture_diagram: 'https://picsum.photos/seed/fitnow/800/600',
      links: JSON.stringify({ github: '#' })
    },
    {
      title: 'Las Cañas - Web',
      type: 'Producción',
      summary: 'Landing Page y Wizard de Reservas para complejo deportivo.',
      problem: 'Información operativa fragmentada y procesos de reserva manuales ineficientes.',
      solution: 'Estandarización de políticas y validación de disponibilidad en tiempo real mediante un wizard guiado.',
      stack: JSON.stringify(['React', 'Tailwind', 'NodeJS']),
      highlights: JSON.stringify(['Wizard de reservas', 'Validación en tiempo real', 'Políticas unificadas']),
      challenges: JSON.stringify(['Manejo de rangos bloqueados', 'UX simplificada']),
      architecture_diagram: 'https://picsum.photos/seed/lascanas/800/600',
      links: JSON.stringify({ web: '#' })
    },
    {
      title: 'Las Cañas - Bot',
      type: 'Automatización',
      summary: 'Bot de WhatsApp para gestión de reservas y FAQs.',
      problem: 'Alta carga de consultas repetitivas por canales de mensajería.',
      solution: 'Automatización con n8n y derivación a humano para casos complejos.',
      stack: JSON.stringify(['n8n', 'JavaScript', 'WhatsApp API']),
      highlights: JSON.stringify(['Flujos automatizados', 'Hand-off a humano', 'Sugerencia de fechas']),
      challenges: JSON.stringify(['Tono de marca consistente', 'Manejo de excepciones']),
      architecture_diagram: 'https://picsum.photos/seed/bot/800/600',
      links: JSON.stringify({ github: '#' })
    },
    {
      title: 'Inmuebles Comerciales SRL',
      type: 'Prácticas',
      summary: 'Plataforma inmobiliaria para gestión de inmuebles comerciales.',
      problem: 'Necesidad de una herramienta interna para mantenimiento de catálogo y clientes.',
      solution: 'Desarrollo full-stack con Angular y SQL para gestión eficiente de datos.',
      stack: JSON.stringify(['Angular', 'SQL', '.NET']),
      highlights: JSON.stringify(['Panel de administración', 'Gestión de catálogo', 'Mantenimiento']),
      challenges: JSON.stringify(['Integración con sistemas legados', 'Validación de datos']),
      architecture_diagram: 'https://picsum.photos/seed/inmuebles/800/600',
      links: JSON.stringify({ web: '#' })
    }
  ];

  const insertProject = db.prepare(`
    INSERT INTO projects (title, type, summary, problem, solution, stack, highlights, challenges, architecture_diagram, links)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of projects) {
    insertProject.run(p.title, p.type, p.summary, p.problem, p.solution, p.stack, p.highlights, p.challenges, p.architecture_diagram, p.links);
  }

  // Create admin user
  const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", hashedPassword);
}

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 429, message: "Too many requests" } }
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 429, message: "Too many contact requests" } }
});

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: { code: 401, message: "Unauthorized" } });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: { code: 403, message: "Forbidden" } });
    req.user = user;
    next();
  });
};

// API Routes

// 1. Content API
app.get("/api/profile", (req, res) => {
  try {
    const profile = db.prepare("SELECT * FROM profile WHERE id = 1").get();
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (e) {
    console.error("DB Error:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/projects", (req, res) => {
  try {
    const projects = db.prepare("SELECT * FROM projects ORDER BY order_index ASC").all();
    const parsedProjects = projects.map((p: any) => ({
      ...p,
      stack: JSON.parse(p.stack),
      highlights: JSON.parse(p.highlights),
      challenges: JSON.parse(p.challenges),
      links: JSON.parse(p.links)
    }));
    res.json(parsedProjects);
  } catch (e) {
    console.error("DB Error:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. Admin Auth
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;

  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: { code: 401, message: "Invalid credentials" } });
  }
});

// 3. Event Logging
app.post("/api/events", apiLimiter, (req, res) => {
  const schema = z.object({
    eventType: z.string(),
    page: z.string(),
    metadata: z.record(z.string(), z.any()).optional()
  });

  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error });

  db.prepare("INSERT INTO events (event_type, page, metadata) VALUES (?, ?, ?)")
    .run(result.data.eventType, result.data.page, JSON.stringify(result.data.metadata || {}));
  
  res.status(201).json({ status: "ok" });
});

app.get("/api/events/stats", authenticateToken, (req, res) => {
  const stats = db.prepare(`
    SELECT event_type, COUNT(*) as count, date(timestamp) as day 
    FROM events 
    GROUP BY event_type, day
    ORDER BY day DESC
  `).all();
  res.json(stats);
});

// 4. Contact
app.post("/api/contact", contactLimiter, (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    message: z.string().min(10)
  });

  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error });

  db.prepare("INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)")
    .run(result.data.name, result.data.email, result.data.message);
  
  res.status(201).json({ status: "ok" });
});

// 5. CV Download
app.get("/api/cv", (req, res) => {
  // In a real app, we'd serve a file. For now, redirect or send placeholder.
  res.json({ url: "/cv-placeholder.pdf", message: "CV placeholder. In production, this would be a real PDF." });
});

// 6. Admin CRUD (Protected)
app.put("/api/profile", authenticateToken, (req, res) => {
  const { name, title, subtitle, pitch, email, linkedin, github, status } = req.body;
  db.prepare(`
    UPDATE profile SET 
    name = ?, title = ?, subtitle = ?, pitch = ?, email = ?, linkedin = ?, github = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(name, title, subtitle, pitch, email, linkedin, github, status);
  res.json({ status: "ok" });
});

app.post("/api/projects", authenticateToken, (req, res) => {
  const { title, type, summary, problem, solution, stack, highlights, challenges, architecture_diagram, links } = req.body;
  db.prepare(`
    INSERT INTO projects (title, type, summary, problem, solution, stack, highlights, challenges, architecture_diagram, links)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, type, summary, problem, solution, JSON.stringify(stack), JSON.stringify(highlights), JSON.stringify(challenges), architecture_diagram, JSON.stringify(links));
  res.status(201).json({ status: "ok" });
});

// Vite Middleware for Development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"), {});
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
