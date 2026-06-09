import { format } from "date-fns";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import type { ItineraryDayData } from "@/components/itinerary/day-timeline";
import { getDayDate } from "@/lib/itinerary/time-utils";

type ExportPdfOptions = {
  tripTitle: string;
  destination: string;
  tripStartDate: string | null;
  tripEndDate: string | null;
  days: ItineraryDayData[];
};

const PAGE_MARGIN = 50;
const LINE_HEIGHT = 14;
const MIN_Y = 60;

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function ensureSpace(
  pdfDoc: PDFDocument,
  pageRef: { page: PDFPage },
  yRef: { y: number },
  needed: number,
  pageHeight: number,
): void {
  if (yRef.y - needed >= MIN_Y) return;
  pageRef.page = pdfDoc.addPage();
  yRef.y = pageHeight - PAGE_MARGIN;
}

export async function buildItineraryPdf(options: ExportPdfOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const contentWidth = width - PAGE_MARGIN * 2;
  const pageRef = { page };
  const yRef = { y: height - PAGE_MARGIN };

  function drawText(
    text: string,
    opts: {
      font?: PDFFont;
      size?: number;
      color?: ReturnType<typeof rgb>;
      indent?: number;
      gap?: number;
    } = {},
  ) {
    const font = opts.font ?? regular;
    const size = opts.size ?? 11;
    const color = opts.color ?? rgb(0.2, 0.2, 0.2);
    const indent = opts.indent ?? 0;
    const gap = opts.gap ?? LINE_HEIGHT;

    for (const line of wrapText(text, font, size, contentWidth - indent)) {
      ensureSpace(pdfDoc, pageRef, yRef, gap, height);
      pageRef.page.drawText(line, {
        x: PAGE_MARGIN + indent,
        y: yRef.y,
        size,
        font,
        color,
      });
      yRef.y -= gap;
    }
  }

  pageRef.page.drawText(options.tripTitle, {
    x: PAGE_MARGIN,
    y: yRef.y,
    size: 22,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  yRef.y -= 30;

  drawText(options.destination, { font: bold, size: 13, color: rgb(0.95, 0.45, 0.1) });

  if (options.tripStartDate) {
    const start = format(new Date(options.tripStartDate), "MMM d, yyyy");
    const end = options.tripEndDate
      ? format(new Date(options.tripEndDate), "MMM d, yyyy")
      : null;
    drawText(end ? `${start} – ${end}` : start, { size: 11, color: rgb(0.4, 0.4, 0.4) });
  }

  yRef.y -= 8;
  pageRef.page.drawLine({
    start: { x: PAGE_MARGIN, y: yRef.y },
    end: { x: width - PAGE_MARGIN, y: yRef.y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  yRef.y -= 20;

  if (options.days.length === 0) {
    drawText("No itinerary items yet.", { color: rgb(0.5, 0.5, 0.5) });
    return pdfDoc.save();
  }

  for (const day of options.days) {
    ensureSpace(pdfDoc, pageRef, yRef, 40, height);

    const dayDate = getDayDate(options.tripStartDate, day.dayNumber);
    const dayHeading = dayDate
      ? `Day ${day.dayNumber} · ${format(dayDate, "EEEE, MMM d")}`
      : `Day ${day.dayNumber}`;

    pageRef.page.drawText(dayHeading, {
      x: PAGE_MARGIN,
      y: yRef.y,
      size: 14,
      font: bold,
      color: rgb(0.1, 0.1, 0.1),
    });
    yRef.y -= 18;

    if (day.title) {
      drawText(day.title, { font: bold, size: 11 });
    }
    if (day.summary) {
      drawText(day.summary, { size: 10, color: rgb(0.45, 0.45, 0.45) });
    }

    if (day.items.length === 0) {
      drawText("No activities planned.", { size: 10, color: rgb(0.55, 0.55, 0.55), indent: 12 });
      yRef.y -= 6;
      continue;
    }

    for (const item of day.items) {
      ensureSpace(pdfDoc, pageRef, yRef, 36, height);

      const timeParts = [item.startTime, item.duration].filter(Boolean);
      const meta = timeParts.length > 0 ? timeParts.join(" · ") : item.type;

      pageRef.page.drawText("•", {
        x: PAGE_MARGIN + 4,
        y: yRef.y,
        size: 12,
        font: bold,
        color: rgb(0.95, 0.45, 0.1),
      });

      drawText(item.title, { font: bold, size: 11, indent: 16, gap: 13 });
      drawText(meta, { size: 9, color: rgb(0.5, 0.5, 0.5), indent: 16, gap: 12 });

      if (item.description) {
        drawText(item.description, { size: 10, indent: 16, gap: 12 });
      }

      const address = item.placeCache?.address ?? item.placeCache?.name;
      if (address) {
        drawText(address, { size: 9, color: rgb(0.45, 0.45, 0.45), indent: 16, gap: 12 });
      }

      yRef.y -= 4;
    }

    yRef.y -= 10;
  }

  return pdfDoc.save();
}
