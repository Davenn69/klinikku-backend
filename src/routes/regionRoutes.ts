import { Router } from "express";
import { getRegions } from "../handlers/regionHandlers";

const route = Router();

route.get("/", getRegions);

export default route;
