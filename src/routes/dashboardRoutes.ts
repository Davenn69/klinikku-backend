import { Router } from "express";
import { getDashboardData } from "../handlers/dashboardHandlers";

const route = Router();

route.get("/", getDashboardData);
export default route;
