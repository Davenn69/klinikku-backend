import { Router } from "express";
import { getAppointments } from "../handlers/appointmentHandlers";

const route = Router();

route.get("/", getAppointments);

export default route;
