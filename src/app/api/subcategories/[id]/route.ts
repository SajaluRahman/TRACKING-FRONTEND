import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SubCategory from "@/models/SubCategory";
import Tracking from "@/models/Tracking";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    if (body.reminderTime !== undefined) {
      updateData.reminderTime = body.reminderTime;
    }
    if (body.reminderEnabled !== undefined) {
      updateData.reminderEnabled = body.reminderEnabled;
    }
    if (body.reminderDays !== undefined) {
      updateData.reminderDays = body.reminderDays;
    }

    const updated = await SubCategory.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Subcategory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/subcategories/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update subcategory" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Delete all tracking entries for this subcategory
    await Tracking.deleteMany({ subCategoryId: id });

    // Delete the subcategory
    const deletedSubCategory = await SubCategory.findByIdAndDelete(id);

    if (!deletedSubCategory) {
      return NextResponse.json(
        { success: false, error: "Subcategory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deletedSubCategory });
  } catch (error) {
    console.error("DELETE /api/subcategories/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete subcategory" },
      { status: 500 }
    );
  }
}
