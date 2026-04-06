import app from "./app";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";

dotenv.config();
const PORT = process.env.PORT;
const connectionString = process.env.DATABASE_URL!;

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

app.listen(PORT, () => {
  console.log(`Server is running in PORT ${PORT}`);
});
