import express from "express";
import authRoutes from "./routes/authRoutes";
import CustomError from "./types/error";
import { notFound } from "./middlewares/notFound";
import errorHandler from "./middlewares/errorHandler";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(notFound);

app.use("/auth", authRoutes);

app.use(errorHandler);

export default app;
