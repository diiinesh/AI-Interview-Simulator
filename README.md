# Start Backend
**uvicorn backend.app:app --reload**

# Start Frontend
**python -m http.server 3001**
## Environment Variables

The backend requires a few API keys defined in your `.env` file:

```bash
ELEVEN_API_KEY=<your elevenlabs key>
GROQ_API_KEY=<your groq key>
ASSEMBLY_API_KEY=<your assemblyai key>
```

