import { NextRequest, NextResponse } from "next/server";
import { s3 } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Generate a unique key for the file
    const ext = file.name.split(".").pop() || "jpg";
    const key = `inventory/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Convert File to Buffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use the S3 handler to get a presigned upload URL, then upload
    const { uploadUrl, ObjectUrl } = await s3.getUploadUrl(key, file.type);

    // Upload directly using fetch with presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: buffer,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status ${uploadResponse.status}`);
    }

    return NextResponse.json({ url: ObjectUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
