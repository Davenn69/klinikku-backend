import { Router } from "express";
import { getDoctors } from "../handlers/doctorHandlers";

const route = Router();

route.get("/", getDoctors);

export default route;
