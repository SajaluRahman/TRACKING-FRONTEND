import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import SubCategory from "@/models/SubCategory";
import Tracking from "@/models/Tracking";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Find all subcategories for this category
    const subCategories = await SubCategory.find({ categoryId: id });
    const subCategoryIds = subCategories.map((sc) => sc._id);

    // Delete all tracking entries for these subcategories
    await Tracking.deleteMany({ subCategoryId: { $in: subCategoryIds } });

    // Delete all subcategories
    await SubCategory.deleteMany({ categoryId: id });

    // Delete the category itself
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deletedCategory });
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
