import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubCategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  categoryId: mongoose.Types.ObjectId;
  reminderTime: string | null; // "HH:MM" format
  reminderEnabled: boolean;
  reminderDays: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  createdAt: Date;
  updatedAt: Date;
}

const SubCategorySchema = new Schema<ISubCategory>(
  {
    name: {
      type: String,
      required: [true, "Subcategory name is required"],
      trim: true,
      maxlength: [50, "Subcategory name cannot exceed 50 characters"],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category ID is required"],
      index: true,
    },
    reminderTime: {
      type: String,
      default: null,
    },
    reminderEnabled: {
      type: Boolean,
      default: false,
    },
    reminderDays: {
      type: [Number],
      default: [0, 1, 2, 3, 4, 5, 6],
    },
  },
  {
    timestamps: true,
    strict: false, // Ensure any additional fields aren't stripped by Mongoose
  }
);

// Clear Next.js model cache to force compilation with updated schema fields
if (mongoose.models && mongoose.models.SubCategory) {
  delete mongoose.models.SubCategory;
}

const SubCategory: Model<ISubCategory> = mongoose.model<ISubCategory>("SubCategory", SubCategorySchema);

export default SubCategory;
