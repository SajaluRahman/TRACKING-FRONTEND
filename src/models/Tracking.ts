import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITracking extends Document {
  _id: mongoose.Types.ObjectId;
  subCategoryId: mongoose.Types.ObjectId;
  date: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrackingSchema = new Schema<ITracking>(
  {
    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
      required: [true, "SubCategory ID is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    completed: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate tracking entries
TrackingSchema.index({ subCategoryId: 1, date: 1 }, { unique: true });

const Tracking: Model<ITracking> =
  mongoose.models.Tracking || mongoose.model<ITracking>("Tracking", TrackingSchema);

export default Tracking;
