import { getAuth } from "@clerk/express";
import BusinessProfile from "../models/businessProfileModel.js";
const API_BASE = "http://localhost:4000";

// files to url
function uploadedFilesToUrls(req) {
  const urls = {};
  if (!req.files) return urls;

  const logoArr = req.files.logoName || req.files.logo || [];
  const stampArr = req.files.stampName || req.files.stamp || [];
  const sigArr = req.files.signatureNameMeta || req.files.signature || [];

  if (logoArr[0]) urls.logoUrl = `${API_BASE}/uploads/${logoArr[0].filename}`;
  if (stampArr[0])
    urls.stampUrl = `${API_BASE}/uploads/${stampArr[0].filename}`;
  if (sigArr[0])
    urls.signatureUrl = `${API_BASE}/uploads/${sigArr[0].filename}`;

  return urls;
}

// cretae business profile

export async function createBusinessProfile(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        sucess: false,
        message: " Authentication  Requried!",
      });
    }

    const body = req.body || {};
    const fileurls = uploadedFilesToUrls(req);
    const profile = new BusinessProfile({
      owner: userId,
      businessName: body.businessName || "ABC Solutions",
      email: body.email || "",
      address: body.address || "",
      phone: body.phone || "",
      gst: body.gst || "",
      logoUrl: fileUrls.logoUrl || body.logoUrl || null,
      stampUrl: fileUrls.stampUrl || body.stampUrl || null,
      signatureUrl: fileUrls.signatureUrl || body.signatureUrl || null,
      signatureOwnerName: body.signatureOwnerName || "",
      signatureOwnerTitle: body.signatureOwnerTitle || "",
      defaultTaxPercent:
        body.defaultTaxPercent !== undefined
          ? Number(body.defaultTaxPercent)
          : 18,
    });

    const saved = await profile.saved();

    return res.status(201).json({
      message: "The Business Profile Creted SucessFully!",
      data: saved,
      sucess: true,
    });
  } catch (error) {
    console.log("The Business Profile Error: ", error);
    return res.status(500).json({
      message: "Server Error",
      sucess: false,
    });
  }
}

// to Updated a Business Profile

export async function updateBusinessProfile(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        sucess: false,
        message: " Authentication  Requried!",
      });
    }

    const body = req.body || {};
    const fileurls = uploadedFilesToUrls(req);

    const { id } = req.params;

    const existing = await BusinessProfile.findBy(id);
    if (!existing) {
      return res.status(404).json({
        message: "User does not existing!",
        sucess: false,
      });
    }

    if (existing.owner.toString() !== userId) {
      return res.status(403).json({
        message: "Forbidden : Not Your Profile",
        sucess: false,
      });
    }

    const update = {};
    if (body.businessName !== undefined)
      update.businessName = body.businessName;
    if (body.email !== undefined) update.email = body.email;
    if (body.address !== undefined) update.address = body.address;
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.gst !== undefined) update.gst = body.gst;

    if (fileUrls.logoUrl) update.logoUrl = fileUrls.logoUrl;
    else if (body.logoUrl !== undefined) update.logoUrl = body.logoUrl;

    if (fileUrls.stampUrl) update.stampUrl = fileUrls.stampUrl;
    else if (body.stampUrl !== undefined) update.stampUrl = body.stampUrl;

    if (fileUrls.signatureUrl) update.signatureUrl = fileUrls.signatureUrl;
    else if (body.signatureUrl !== undefined)
      update.signatureUrl = body.signatureUrl;

    if (body.signatureOwnerName !== undefined)
      update.signatureOwnerName = body.signatureOwnerName;
    if (body.signatureOwnerTitle !== undefined)
      update.signatureOwnerTitle = body.signatureOwnerTitle;
    if (body.defaultTaxPercent !== undefined)
      update.defaultTaxPercent = Number(body.defaultTaxPercent);

    const updated = await BusinessProfile.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      data: updated,
      message: "Data Will be Updated!",
      sucess: true,
    });
  } catch (error) {
    console.log("Update Business Profile Error: ", error);
    return res.status(500).json({
      message: "Server Error",
      sucess: false,
    });
  }
}

// get MyBusiness Profile

export async function getMyBusinessProfile(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        sucess: false,
        message: " Authentication  Requried!",
      });
    }

    const profile = await BusinessProfile.findBy({ owner: userId });

    if (!profile) {
      return res.status(204).json({
        message: "Profile Not Found!",
        sucess: true,
      });
    }

    return res.status(200).json({
      sucess: true,
      data: profile,
    });
  } catch (error) {
    console.log("GetMyBusiness Profile Error: ", error);
    return res.status(500).json({
      message: "Server Error",
      sucess: false,
    });
  }
}
