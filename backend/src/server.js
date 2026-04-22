import { app } from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${env.port}`);
});

server.on("error", (err) => {
  if (err && "code" in err && err.code === "EADDRINUSE") {
    // eslint-disable-next-line no-console
    console.error(
      `\n[career-guide-backend] Port ${env.port} is already in use (EADDRINUSE).\n` +
        `  Another process is listening — often a duplicate backend. Stop it first:\n` +
        `  Windows: netstat -ano | findstr :${env.port}\n` +
        `           taskkill /PID <pid> /F\n` +
        `  Or set PORT=5001 in backend/.env and NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1 in frontend/.env.local\n`
    );
    process.exit(1);
  }
  throw err;
});
