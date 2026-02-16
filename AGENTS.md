# Project Structure

- `frontend/`: Expo mobile app
- `backend/`: FastAPI backend service
- `backend/uploads/`: user-uploaded files (MUST be ignored in git)
- `docs/`: PRD and architecture docs
------

## Package Managers

- Frontend MUST use `pnpm`
- Backend MUST use `uv`
- No global dependencies allowed
------

## Development Commands

### Frontend

- `pnpm install`
- `pnpm dev`
- `pnpm test`

### Backend

- `uv sync`
- `uv run main.py`
- `pytest`

## API Rules

### Module Structure

Each backend module MUST include:

- `router.py`
- `schemas.py`
- `models.py`
- `service.py`

Routers MUST NOT contain business logic.
---

### Authentication

All protected endpoints MUST use Bearer token authentication.

Header format:
Authorization: Bearer <token>
---

### Endpoint Standards

All API routes MUST:

- Use type annotations
- Use Pydantic models
- Define `response_model`
- Include a docstring
---

### File Upload
Upload endpoints MUST validate:
- File type
- File size
---

### Quality Gates
Before commit:
- Frontend: `pnpm build` MUST succeed
- Backend: `pytest` MUST pass

## Testing Rules

### Frontend
- Use Vitest
- Test components and services
- No untested API calls

### Backend
- Use Pytest
- Test:
  - request creation
  - reply creation
  - feedback update
- Mock file storage

## Commit Rules
- Use Conventional Commits:
  - `feat:`
  - `fix:`
  - `refactor:`
  - `docs:`
- Tests MUST pass before commit.

## Security Rules
- Never log sensitive user data.
- Never commit `.env`.
- Uploaded files MUST not be public by default.