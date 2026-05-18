import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SubCategory from "@/models/SubCategory";
import Category from "@/models/Category";

export async function GET() {
  try {
    await dbConnect();

    // Get all subcategories with reminders enabled
    const subCategories = await SubCategory.find({
      reminderEnabled: true,
      reminderTime: { $ne: null },
    }).lean();

    // Fetch parent category names for notification display
    const categoryIds = [...new Set(subCategories.map((sc) => sc.categoryId.toString()))];
    const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
    const categoryMap: Record<string, string> = {};
    for (const cat of categories) {
      categoryMap[cat._id.toString()] = cat.name;
    }

    const reminders = subCategories.map((sc) => ({
      _id: sc._id,
      name: sc.name,
      categoryId: sc.categoryId,
      categoryName: categoryMap[sc.categoryId.toString()] || "Unknown",
      reminderTime: sc.reminderTime,
      reminderDays: sc.reminderDays || [0, 1, 2, 3, 4, 5, 6],
    }));

    return NextResponse.json({ success: true, data: reminders });
  } catch (error) {
    console.error("GET /api/reminders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}
