import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SubCategory from "@/models/SubCategory";
import Tracking from "@/models/Tracking";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const month = searchParams.get("month"); // format: 2026-05

    if (!categoryId || !month) {
      return NextResponse.json(
        { success: false, error: "categoryId and month are required" },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // Get all subcategories for this category
    const subCategories = await SubCategory.find({ categoryId }).sort({ createdAt: 1 });
    const subCategoryIds = subCategories.map((sc) => sc._id);

    // Get all tracking entries for these subcategories in this month
    const trackingEntries = await Tracking.find({
      subCategoryId: { $in: subCategoryIds },
      date: { $gte: startDate, $lte: endDate },
      completed: true,
    });

    // Build a map: subCategoryId -> Set of completed day numbers
    const trackingMap: Record<string, number[]> = {};
    for (const sc of subCategories) {
      trackingMap[sc._id.toString()] = [];
    }
    for (const entry of trackingEntries) {
      const key = entry.subCategoryId.toString();
      const day = new Date(entry.date).getDate();
      if (trackingMap[key]) {
        trackingMap[key].push(day);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        subCategories: subCategories.map((sc) => ({
          _id: sc._id,
          name: sc.name,
          categoryId: sc.categoryId,
          reminderTime: sc.reminderTime || null,
          reminderEnabled: sc.reminderEnabled || false,
          reminderDays: sc.reminderDays || [0, 1, 2, 3, 4, 5, 6],
        })),
        trackingMap,
        month: { year, month: monthNum },
      },
    });
  } catch (error) {
    console.error("GET /api/tracking/bulk error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bulk tracking data" },
      { status: 500 }
    );
  }
}
