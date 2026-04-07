import express from "express";
import authRoutes from "./routes/authRoutes";
import doctorRoutes from "./routes/doctorRoutes";
import regionRoutes from "./routes/regionRoutes";
import CustomError from "./types/error";
import { notFound } from "./middlewares/notFound";
import errorHandler from "./middlewares/errorHandler";
import protect from "./middlewares/protected";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/regions", protect, regionRoutes);
app.use("/doctors", protect, doctorRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
