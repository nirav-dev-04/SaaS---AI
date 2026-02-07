import mongoose from "mongoose";

const businessProfileSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
      index: true,
    },
    businessName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    gst: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },

    // images
    logoUrl: {
      type: String,
      default: null,
    },
    stampUrl: {
      type: String,
      default: null,
    },
    signatureUrl: {
      type: String,
      default: null,
    },

    signatureOwnerName: {
      type: String,
      default: "",
    },
    signatureOwnerTitle: {
      type: String,
      default: "",
    },

    defaultTaxPercentage: {
      type: Number,
      default: 18,
    },
  },
  { timestamps: true },
);

const BusinessProfile =
  mongoose.models.BusinessProfile ||
  mongoose.model("BusinessProfile", businessProfileSchema);

export default BusinessProfile;
