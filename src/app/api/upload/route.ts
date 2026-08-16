import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "text/plain",
      "text/markdown",
      "text/csv",
      "application/pdf",
      "application/json",
      "text/html",
      "text/css",
      "text/javascript",
      "application/javascript",
      "application/typescript",
    ];

    const allowedExtensions = [
      ".txt", ".md", ".csv", ".json", ".html", ".css",
      ".js", ".ts", ".jsx", ".tsx", ".py", ".java",
      ".c", ".cpp", ".h", ".rs", ".go", ".rb", ".php",
      ".sql", ".xml", ".yaml", ".yml", ".toml", ".env",
      ".sh", ".bat", ".ps1", ".pdf",
    ];

    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    const isAllowed =
      allowedTypes.includes(file.type) ||
      allowedExtensions.includes(fileExtension);

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: `File type not supported. Supported: ${allowedExtensions.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    let content = "";

    if (fileExtension === ".pdf") {
      // For PDF files, read as text (basic extraction)
      // In production, use pdf-parse for better extraction
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        // Try to extract readable text from PDF
        const text = buffer.toString("utf-8");
        // Filter out non-printable characters
        content = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
        if (content.length < 50) {
          content = `[PDF file: ${file.name}] — This PDF appears to be scanned or image-based. Basic text extraction found limited content. For better results, please copy-paste the text content directly.`;
        }
      } catch {
        content = `[PDF file: ${file.name}] — Unable to extract text. Please copy-paste the content directly.`;
      }
    } else {
      // For text files, read directly
      content = await file.text();
    }

    // Truncate very long files
    const MAX_CHARS = 50000;
    if (content.length > MAX_CHARS) {
      content =
        content.substring(0, MAX_CHARS) +
        `\n\n[... File truncated. Showing first ${MAX_CHARS} characters of ${content.length} total.]`;
    }

    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || fileExtension,
      content,
      charCount: content.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}
