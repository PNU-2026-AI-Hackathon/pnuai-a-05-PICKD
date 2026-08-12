# PICKD Server Setup

This repository keeps each application in a separate directory.

```text
pnuai-a-05-PICKD/
  BE/          Spring Boot backend server
  AI/          FastAPI / AI server
```

## Backend

```bash
cd BE
./gradlew bootRun --args='--spring.profiles.active=local'
```

- API server: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- H2 console: `http://localhost:8080/h2-console`

## AI Server

The current AI implementation is under `AI/myeongsung`.

```bash
cd AI/myeongsung
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- AI server: `http://localhost:8000`
- Health check: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`

## Notes

- Do not commit `.env`, `.venv`, `build`, `.gradle`, or IDE files.
- Backend dependencies are managed inside `BE/build.gradle`.
- AI dependencies should be managed inside the AI server directory.
