import { NextResponse } from "next/server";
import { requireCurrentDbUser, requireTripForUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary/client";
import { BookingCategory } from "@/app/generated/prisma/client";

type RouteParams = { params: Promise<{ tripId: string }> };

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: Request, { params }: RouteParams) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables." },
        { status: 503 },
      );
    }

    const user = await requireCurrentDbUser();
    const { tripId } = await params;
    await requireTripForUser(tripId, user.id);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string | null)?.trim() || "";
    const category = (formData.get("category") as string | null) ?? "OTHER";
    const notes = (formData.get("notes") as string | null)?.trim() || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only images (JPEG, PNG, WebP, GIF) and PDFs are allowed." },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the 20 MB limit." },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const isPdf = file.type === "application/pdf";
    const resourceType = isPdf ? "raw" : "image";
    const folderName = `tripzy/bookings/${tripId}`;

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: folderName,
      resource_type: resourceType,
      // Auto-tag for easier searching
      tags: ["tripzy", "booking", tripId],
      // Keep original filename as context
      context: {
        original_filename: file.name,
        trip_id: tripId,
        user_id: user.id,
      },
    });

    const bookingCategory = Object.values(BookingCategory).includes(
      category as BookingCategory,
    )
      ? (category as BookingCategory)
      : BookingCategory.OTHER;

    const booking = await prisma.tripBooking.create({
      data: {
        tripId,
        title: title || file.name.replace(/\.[^/.]+$/, ""),
        category: bookingCategory,
        cloudinaryId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.secure_url,
        resourceType: uploadResult.resource_type,
        fileFormat: uploadResult.format ?? (isPdf ? "pdf" : null),
        fileSizeBytes: uploadResult.bytes ?? file.size,
        notes,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    console.error("[bookings/upload] error", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
