# Manuel Cosovschi - Impact Page Backend

## Setup
1. Install dependencies: `npm install`
2. Set environment variables in `.env` (see `.env.example`)
3. Run development server: `npm run dev`

## API Endpoints

### Public
- `GET /api/profile`: Get profile information.
- `GET /api/projects`: Get list of projects.
- `POST /api/events`: Log an interaction event.
- `POST /api/contact`: Send a contact message.
- `GET /api/cv`: Download CV (placeholder).

### Admin (Protected)
- `POST /api/admin/login`: Login to get JWT.
- `PUT /api/profile`: Update profile.
- `POST /api/projects`: Create project.
- `PUT /api/projects/:id`: Update project.
- `DELETE /api/projects/:id`: Delete project.
- `GET /api/events/stats`: Get analytics summary.

## Security
- JWT Authentication for admin routes.
- Rate limiting on contact and event endpoints.
- Input validation using Zod.
- Helmet for security headers.
- CORS configured for frontend.
