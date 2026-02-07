import mongoose from "mongoose";
import Invoice from "../models/inVoicemodel.js";
import { getAuth } from "@clerk/express";
import path from "path";

const API_BASE = "http://localhost:4000";


// =============================
// CALCULATE TOTALS
// =============================
function computeTotals(items = [], taxPercent = 0) {
  const safe = Array.isArray(items) ? items : [];

  let subtotal = 0;

  safe.forEach((it) => {
    const qty = Number(it.qty || 0);
    const price = Number(it.unitPrice || 0);
    subtotal += qty * price;
  });

  const tax = (subtotal * Number(taxPercent || 0)) / 100;
  const total = subtotal + tax;

  return { subtotal, tax, total };
}


// =============================
// PARSE ITEMS
// =============================
function parseItemsField(item) {
  if (!item) return [];

  if (Array.isArray(item)) return item;

  if (typeof item === "string") {
    try {
      return JSON.parse(item);
    } catch {
      return [];
    }
  }

  return item;
}


// =============================
// CHECK OBJECT ID
// =============================
function isValidObjectId(id) {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}


// =============================
// FILE URL HELPER
// =============================
function uploadedFilesToUrls(req) {
  const urls = {};
  if (!req.files) return urls;

  const mapping = {
    logo: "logoDataUrl",
    stamp: "stampDataUrl",
    signature: "signatureDataUrl",
  };

  Object.keys(mapping).forEach((field) => {
    const arr = req.files[field];
    if (Array.isArray(arr) && arr[0]) {
      const filename =
        arr[0].filename || (arr[0].path && path.basename(arr[0].path));

      if (filename) {
        urls[mapping[field]] = `${API_BASE}/uploads/${filename}`;
      }
    }
  });

  return urls;
}


// =============================
// GENERATE INVOICE NUMBER
// =============================
async function generateUniqueInvoiceNumber() {
  const ts = Date.now().toString();
  const suffix = Math.floor(Math.random() * 900000)
    .toString()
    .padStart(6, "0");

  return `INV-${ts.slice(-6)}-${suffix}`;
}


// =============================
// CREATE INVOICE
// =============================
export async function createInvoice(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const body = req.body || {};
    const items = parseItemsField(body.items);
    const taxPercent = Number(body.taxPercent || 0);

    const totals = computeTotals(items, taxPercent);
    const fileUrls = uploadedFilesToUrls(req);

    const invoiceNumber =
      body.invoiceNumber || (await generateUniqueInvoiceNumber());

    const doc = new Invoice({
      owner: userId,
      invoiceNumber,
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      fromBusinessName: body.fromBusinessName,
      fromEmail: body.fromEmail,
      fromAddress: body.fromAddress,
      fromPhone: body.fromPhone,
      fromGst: body.fromGst,
      client: body.client || {},
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency: body.currency || "INR",
      status: body.status || "draft",
      taxPercent,
      logoDataUrl: fileUrls.logoDataUrl,
      stampDataUrl: fileUrls.stampDataUrl,
      signatureDataUrl: fileUrls.signatureDataUrl,
      signatureName: body.signatureName,
      signatureTitle: body.signatureTitle,
      notes: body.notes,
    });

    const saved = await doc.save();

    return res.status(201).json({
      success: true,
      message: "Invoice created",
      data: saved,
    });
  } catch (err) {
    console.error("createInvoice error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}


// =============================
// GET ALL INVOICES
// =============================
export async function getInvoices(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const invoices = await Invoice.find({ owner: userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.log("GETINVOICES ERROR", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}


// =============================
// GET INVOICE BY ID
// =============================
export async function getInvoiceById(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;

    const query = isValidObjectId(id)
      ? { _id: id, owner: userId }
      : { invoiceNumber: id, owner: userId };

    const inv = await Invoice.findOne(query);

    if (!inv) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: inv,
    });
  } catch (error) {
    console.log("GETINVOICESBY ID ERROR", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}


// =============================
// UPDATE INVOICE
// =============================
export async function updateInvoice(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;
    const body = req.body || {};

    const query = isValidObjectId(id)
      ? { _id: id, owner: userId }
      : { invoiceNumber: id, owner: userId };

    const existing = await Invoice.findOne(query);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const items = parseItemsField(body.items);
    const taxPercent = Number(body.taxPercent || existing.taxPercent || 0);
    const totals = computeTotals(items, taxPercent);

    const update = {
      invoiceNumber: body.invoiceNumber,
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      client: body.client,
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      taxPercent,
      notes: body.notes,
    };

    Object.keys(update).forEach(
      (k) => update[k] === undefined && delete update[k]
    );

    const updated = await Invoice.findOneAndUpdate(
      { _id: existing._id },
      { $set: update },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Invoice Updated!",
      data: updated,
    });
  } catch (err) {
    console.error("updateInvoice error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}


// =============================
// DELETE INVOICE
// =============================
export async function deleteInvoice(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;

    const query = isValidObjectId(id)
      ? { _id: id, owner: userId }
      : { invoiceNumber: id, owner: userId };

    const found = await Invoice.findOne(query);

    if (!found) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    await Invoice.deleteOne({ _id: found._id });

    return res.status(200).json({
      success: true,
      message: "Invoice Deleted!",
    });
  } catch (err) {
    console.log("the deleted error:", err);
    return res.status(500).json({
      message: "server error!",
      success: false,
    });
  }
}
