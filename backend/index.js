import express from "express";
import cors from "cors";
import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";
import connectDB from "./config/db.js";
import { connect } from "mongoose";
import path from "path";
import invoiceRouter from "./routes/invoiceRoute.js";
import businessProfileRouter from "./routes/businessProfileRoute.js";
import aiInvoiceRouter from "./routes/aiInvoiceRoute.js";

const app = express();
const PORT = 4000;
app.use(express.json());

// Middleware
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(clerkMiddleware());

//db
connectDB();

// routes
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/invoice", invoiceRouter);
app.use("/api/businessProfile", businessProfileRouter);
app.use("/api/ai", aiInvoiceRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
