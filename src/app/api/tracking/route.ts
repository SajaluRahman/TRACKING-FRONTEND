import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Tracking from "@/models/Tracking";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const subCategoryId = searchParams.get("subCategoryId");
    const month = searchParams.get("month"); // format: 2026-05

    if (!subCategoryId || !month) {
      return NextResponse.json(
        { success: false, error: "subCategoryId and month are required" },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const trackingEntries = await Tracking.find({
      subCategoryId,
      date: { $gte: startDate, $lte: endDate },
      completed: true,
    });

    return NextResponse.json({ success: true, data: trackingEntries });
  } catch (error) {
    console.error("GET /api/tracking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tracking data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.subCategoryId || !body.date) {
      return NextResponse.json(
        { success: false, error: "subCategoryId and date are required" },
        { status: 400 }
      );
    }

    // Normalize date to start of day
    const date = new Date(body.date);
    date.setHours(0, 0, 0, 0);

    // Check if entry exists
    const existing = await Tracking.findOne({
      subCategoryId: body.subCategoryId,
      date,
    });

    if (existing) {
      // Toggle: if completed, delete it (untick). If not completed, mark completed.
      if (existing.completed) {
        await Tracking.findByIdAndDelete(existing._id);
        return NextResponse.json({
          success: true,
          data: null,
          action: "unticked",
        });
      } else {
        existing.completed = true;
        await existing.save();
        return NextResponse.json({
          success: true,
          data: existing,
          action: "ticked",
        });
      }
    } else {
      // Create new tracking entry
      const tracking = await Tracking.create({
        subCategoryId: body.subCategoryId,
        date,
        completed: true,
      });
      return NextResponse.json(
        { success: true, data: tracking, action: "ticked" },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("POST /api/tracking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update tracking" },
      { status: 500 }
    );
  }
}
