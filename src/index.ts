import app from "./app";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT;

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

app.listen(PORT, () => {
  console.log(`Server is running in PORT ${PORT}`);
});
