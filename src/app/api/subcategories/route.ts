import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SubCategory from "@/models/SubCategory";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "categoryId query parameter is required" },
        { status: 400 }
      );
    }

    const subCategories = await SubCategory.find({ categoryId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: subCategories });
  } catch (error) {
    console.error("GET /api/subcategories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch subcategories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "Subcategory name is required" },
        { status: 400 }
      );
    }

    if (!body.categoryId) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 }
      );
    }

    const subCategory = await SubCategory.create({
      name: body.name.trim(),
      categoryId: body.categoryId,
    });

    return NextResponse.json({ success: true, data: subCategory }, { status: 201 });
  } catch (error) {
    console.error("POST /api/subcategories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create subcategory" },
      { status: 500 }
    );
  }
}
