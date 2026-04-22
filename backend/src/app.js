import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import routes from "./routes/index.js";

export const app = express();

app.use(helmet());
const corsOrigins = String(env.clientOrigin)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

/**
 * In development, reflect any request origin so Next on :3000/:3001 and direct
 * `NEXT_PUBLIC_API_URL` calls to the API never hit "Not allowed by CORS" (which
 * otherwise surfaces as HTTP 500 because the cors callback Error has no statusCode).
 */
app.use(
  cors({
    origin:
      env.nodeEnv === "production"
        ? corsOrigins.length <= 1
          ? corsOrigins[0] || true
          : (origin, cb) => {
              if (!origin || corsOrigins.includes(origin)) cb(null, true);
              else cb(new Error("Not allowed by CORS"));
            }
        : true,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.use("/api/v1", routes);

app.use(notFoundHandler);
app.use(errorHandler);
