import { Router } from "express";
import {
  addEncounters,
  deleteEncounters,
  getEncounterDetails,
  getEncounters,
} from "../handlers/encounterHandlers";

const route = Router();

route.get("/", getEncounters);
route.post("/", addEncounters);
route.get("/:id", getEncounterDetails);
route.delete("/:id", deleteEncounters);

export default route;
