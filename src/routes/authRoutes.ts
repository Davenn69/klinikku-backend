import { Router } from "express";
import { login, refresh, register } from "../handlers/authHandlers";

const route = Router();

route.post("/register", register);
route.post("/login", login);
route.post("/refresh", refresh);

export default route;
