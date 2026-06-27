import { format } from "date-fns";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  type PDFFont,
  type RGB,
} from "pdf-lib";
import type { ItineraryDayData } from "@/components/itinerary/day-timeline";
import { getDayColor } from "@/components/itinerary/day-timeline";
import {
  computeDayInsights,
  formatStepCount,
  getFatigueLabel,
  TRANSPORT_MODE_META,
} from "@/lib/itinerary/day-insights";
import { getDayDate } from "@/lib/itinerary/time-utils";
import { DEFAULT_BUDGET_CURRENCY } from "@/lib/trips/intake";

type ExportPdfOptions = {
  tripTitle: string;
  destination: string;
  tripStartDate: string | null;
  tripEndDate: string | null;
  days: ItineraryDayData[];
  budgetPerPerson?: number | null;
  budgetCurrency?: string;
};

const PAGE_MARGIN = 44;
const CONTENT_LEFT = 44;
const MIN_Y = 56;
const HEADER_BAND_HEIGHT = 88;
const TIMELINE_X = CONTENT_LEFT + 10;
const ITEM_CONTENT_X = CONTENT_LEFT + 30;

const COLORS = {
  text: rgb(0.09, 0.09, 0.11),
  textSecondary: rgb(0.38, 0.38, 0.42),
  textMuted: rgb(0.55, 0.55, 0.58),
  border: rgb(0.88, 0.88, 0.9),
  borderLight: rgb(0.93, 0.93, 0.95),
  surface: rgb(0.97, 0.97, 0.98),
  white: rgb(1, 1, 1),
  headerBg: rgb(0.09, 0.09, 0.11),
  headerText: rgb(0.98, 0.98, 0.98),
  headerSubtext: rgb(0.72, 0.72, 0.76),
};

const BUDGET_CATEGORIES = [
  { key: "budgetAccommodation" as const, label: "Stay" },
  { key: "budgetFood" as const, label: "Food" },
  { key: "budgetActivities" as const, label: "Activities" },
  { key: "budgetTransport" as const, label: "Transport" },
] as const;

const FALLBACK_SPLITS = {
  budgetAccommodation: 0.35,
  budgetFood: 0.25,
  budgetActivities: 0.25,
  budgetTransport: 0.1,
} as const;

const PDF_CURRENCY_PREFIX: Record<string, string> = {
  INR: "Rs.",
  USD: "$",
  EUR: "EUR ",
  GBP: "GBP ",
  JPY: "JPY ",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
};

const TYPE_BADGE_STYLES: Record<string, { bg: RGB; text: RGB }> = {
  Restaurant: { bg: rgb(0.961, 0.961, 0.961), text: rgb(0.251, 0.251, 0.251) },
  Attraction: { bg: rgb(0.937, 0.965, 1), text: rgb(0.114, 0.306, 0.847) },
  Hotel: { bg: rgb(0.98, 0.961, 1), text: rgb(0.494, 0.133, 0.808) },
  Activity: { bg: rgb(0.941, 0.992, 0.957), text: rgb(0.082, 0.502, 0.239) },
  Transport: { bg: rgb(0.941, 0.976, 1), text: rgb(0.012, 0.412, 0.631) },
};

const BADGE_FONT_SIZE = 8;
const BADGE_PAD_X = 10;
const BADGE_HEIGHT = 15;

function toPdfText(text: string): string {
  return text
    .replace(/\u20b9/g, "Rs.")
    .replace(/\u20ac/g, "EUR ")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[^\u0020-\u007e\u00a0-\u00ff]/g, "");
}

function formatPdfBudgetAmount(amount: number, currencyCode: string): string {
  const prefix = PDF_CURRENCY_PREFIX[currencyCode] ?? `${currencyCode} `;
  if (amount >= 1000) {
    const value = (amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1);
    return `${prefix}${value}k`;
  }
  return `${prefix}${Math.round(amount)}`;
}

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return rgb(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  );
}

function tintColor(color: RGB, amount: number): RGB {
  return rgb(
    color.red * amount + (1 - amount),
    color.green * amount + (1 - amount),
    color.blue * amount + (1 - amount),
  );
}

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const safeText = toPdfText(text);
  const words = safeText.split(/\s+/);
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

function textHeight(lines: number, lineGap: number): number {
  return lines * lineGap;
}

function getItemTypeLabel(type: string): string {
  const t = type.toLowerCase();
  if (
    t.includes("restaurant") ||
    t.includes("food") ||
    t.includes("cafe") ||
    t.includes("bar")
  ) {
    return "Restaurant";
  }
  if (
    t.includes("hotel") ||
    t.includes("accommodation") ||
    t.includes("lodging") ||
    t.includes("hostel")
  ) {
    return "Hotel";
  }
  if (
    t.includes("transport") ||
    t.includes("flight") ||
    t.includes("train") ||
    t.includes("transit")
  ) {
    return "Transport";
  }
  if (t.includes("activity") || t.includes("tour") || t.includes("adventure")) {
    return "Activity";
  }
  return "Attraction";
}

function resolveDailyBudget(
  day: ItineraryDayData,
  fallbackDailyBudget: number | null,
): number | null {
  const hasAiBudget = day.budgetTotal != null && day.budgetTotal > 0;
  return hasAiBudget ? (day.budgetTotal as number) : fallbackDailyBudget;
}

type PdfContext = {
  pdfDoc: PDFDocument;
  pageRef: { page: PDFPage };
  yRef: { y: number };
  width: number;
  height: number;
  contentWidth: number;
  regular: PDFFont;
  bold: PDFFont;
  tripTitle: string;
  destination: string;
};

function ensureSpace(ctx: PdfContext, needed: number): void {
  if (ctx.yRef.y - needed >= MIN_Y) return;
  ctx.pageRef.page = ctx.pdfDoc.addPage();
  ctx.yRef.y = ctx.height - PAGE_MARGIN;
}

function drawPdfText(
  ctx: PdfContext,
  text: string,
  x: number,
  y: number,
  opts: { font?: PDFFont; size?: number; color?: RGB } = {},
) {
  ctx.pageRef.page.drawText(toPdfText(text), {
    x,
    y,
    size: opts.size ?? 10,
    font: opts.font ?? ctx.regular,
    color: opts.color ?? COLORS.text,
  });
}

function drawFlowText(
  ctx: PdfContext,
  text: string,
  opts: {
    x?: number;
    font?: PDFFont;
    size?: number;
    color?: RGB;
    maxWidth?: number;
    gap?: number;
  } = {},
): number {
  const x = opts.x ?? CONTENT_LEFT;
  const font = opts.font ?? ctx.regular;
  const size = opts.size ?? 10;
  const color = opts.color ?? COLORS.text;
  const maxWidth = opts.maxWidth ?? ctx.contentWidth - (x - CONTENT_LEFT);
  const gap = opts.gap ?? size + 3;
  const lines = wrapText(text, font, size, maxWidth);

  ensureSpace(ctx, textHeight(lines.length, gap));
  for (const line of lines) {
    drawPdfText(ctx, line, x, ctx.yRef.y, { font, size, color });
    ctx.yRef.y -= gap;
  }

  return lines.length * gap;
}

function drawSectionLabel(ctx: PdfContext, text: string, x: number, y: number) {
  drawPdfText(ctx, text.toUpperCase(), x, y, {
    font: ctx.bold,
    size: 7,
    color: COLORS.textMuted,
  });
}

function measureBadgeWidth(ctx: PdfContext, label: string): number {
  const safeLabel = toPdfText(label);
  return (
    ctx.regular.widthOfTextAtSize(safeLabel, BADGE_FONT_SIZE) + BADGE_PAD_X * 2
  );
}

function drawPill(
  page: PDFPage,
  x: number,
  bottom: number,
  width: number,
  height: number,
  fill: RGB,
) {
  const radius = height / 2;
  const centerY = bottom + radius;

  page.drawCircle({
    x: x + radius,
    y: centerY,
    size: radius,
    color: fill,
  });
  page.drawCircle({
    x: x + width - radius,
    y: centerY,
    size: radius,
    color: fill,
  });

  if (width > height) {
    page.drawRectangle({
      x: x + radius,
      y: bottom,
      width: width - height,
      height,
      color: fill,
    });
  }
}

function drawTypeBadge(
  ctx: PdfContext,
  label: string,
  x: number,
  baselineY: number,
): number {
  const safeLabel = toPdfText(label);
  const style = TYPE_BADGE_STYLES[label] ?? {
    bg: COLORS.surface,
    text: COLORS.textSecondary,
  };
  const textWidth = ctx.regular.widthOfTextAtSize(safeLabel, BADGE_FONT_SIZE);
  const badgeWidth = textWidth + BADGE_PAD_X * 2;
  const badgeBottom = baselineY - 4;
  const textY = badgeBottom + (BADGE_HEIGHT - BADGE_FONT_SIZE) / 2 + 1;

  drawPill(
    ctx.pageRef.page,
    x,
    badgeBottom,
    badgeWidth,
    BADGE_HEIGHT,
    style.bg,
  );

  drawPdfText(ctx, safeLabel, x + BADGE_PAD_X, textY, {
    font: ctx.regular,
    size: BADGE_FONT_SIZE,
    color: style.text,
  });

  return badgeWidth;
}

function drawTitleWithBadge(
  ctx: PdfContext,
  title: string,
  typeLabel: string,
  x: number,
  maxWidth: number,
): void {
  const titleLines = wrapText(title, ctx.bold, 11, maxWidth);
  const badgeWidth = measureBadgeWidth(ctx, typeLabel);
  const badgeGap = 8;
  const lineGap = 14;
  const canInline =
    titleLines.length === 1 &&
    ctx.bold.widthOfTextAtSize(titleLines[0], 11) + badgeGap + badgeWidth <=
      maxWidth;

  ensureSpace(
    ctx,
    titleLines.length * lineGap + (canInline ? 0 : BADGE_HEIGHT + 6),
  );

  const rowBaseline = ctx.yRef.y;

  if (canInline) {
    const titleLine = titleLines[0];
    drawPdfText(ctx, titleLine, x, rowBaseline, { font: ctx.bold, size: 11 });
    const titleWidth = ctx.bold.widthOfTextAtSize(toPdfText(titleLine), 11);
    drawTypeBadge(ctx, typeLabel, x + titleWidth + badgeGap, rowBaseline);
    ctx.yRef.y = rowBaseline - Math.max(lineGap, BADGE_HEIGHT + 2);
    return;
  }

  let lastBaseline = rowBaseline;
  for (const line of titleLines) {
    drawPdfText(ctx, line, x, ctx.yRef.y, { font: ctx.bold, size: 11 });
    lastBaseline = ctx.yRef.y;
    ctx.yRef.y -= lineGap;
  }

  drawTypeBadge(ctx, typeLabel, x, lastBaseline);
  ctx.yRef.y = lastBaseline - BADGE_HEIGHT - 6;
}

function measureInsightBox(
  ctx: PdfContext,
  day: ItineraryDayData,
  dailyBudget: number | null,
  insights: ReturnType<typeof computeDayInsights>,
): number {
  const pad = 14;
  const innerWidth = ctx.contentWidth - pad * 2;
  let h = pad;

  if (dailyBudget != null) {
    h += 22; // spend header row
    h += 52; // budget grid
    h += 8;
  }

  if (day.items.length > 0) {
    h += 14; // divider
    h += 18; // steps row
  }

  if (insights.cityTransportModes.length > 0) {
    h += 16; // transport label
    const transportLine = insights.cityTransportModes
      .map((mode) => TRANSPORT_MODE_META[mode].label)
      .join("   ");
    h += wrapText(transportLine, ctx.regular, 9, innerWidth).length * 11 + 4;
  }

  return h + pad;
}

function drawInsightBox(
  ctx: PdfContext,
  day: ItineraryDayData,
  dayColor: RGB,
  dailyBudget: number | null,
  hasAiBudget: boolean,
  currencyCode: string,
) {
  const insights = computeDayInsights(day.items, {
    destination: ctx.destination,
    cityTransport: day.cityTransport,
  });

  const hasInsights = dailyBudget != null || day.items.length > 0;
  if (!hasInsights) return;

  const pad = 14;
  const boxHeight = measureInsightBox(ctx, day, dailyBudget, insights);

  ensureSpace(ctx, boxHeight + 10);

  const boxTop = ctx.yRef.y;
  const boxBottom = boxTop - boxHeight;

  ctx.pageRef.page.drawRectangle({
    x: CONTENT_LEFT,
    y: boxBottom,
    width: ctx.contentWidth,
    height: boxHeight,
    color: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
  });

  let innerY = boxTop - pad - 10;
  const innerLeft = CONTENT_LEFT + pad;
  const innerRight = CONTENT_LEFT + ctx.contentWidth - pad;
  const innerWidth = innerRight - innerLeft;

  if (dailyBudget != null) {
    drawSectionLabel(ctx, "Estimated daily spend", innerLeft, innerY);
    const spendText = `~${formatPdfBudgetAmount(dailyBudget, currencyCode)}/person`;
    const spendWidth = ctx.bold.widthOfTextAtSize(toPdfText(spendText), 12);
    drawPdfText(ctx, spendText, innerRight - spendWidth, innerY, {
      font: ctx.bold,
      size: 12,
      color: dayColor,
    });
    innerY -= 20;

    const colWidth = innerWidth / 4;
    const gridTop = innerY;
    const gridHeight = 44;

    ctx.pageRef.page.drawRectangle({
      x: innerLeft,
      y: gridTop - gridHeight,
      width: innerWidth,
      height: gridHeight,
      color: COLORS.surface,
      borderColor: COLORS.borderLight,
      borderWidth: 0.75,
    });

    for (let i = 1; i < 4; i++) {
      const x = innerLeft + colWidth * i;
      ctx.pageRef.page.drawLine({
        start: { x, y: gridTop },
        end: { x, y: gridTop - gridHeight },
        thickness: 0.5,
        color: COLORS.borderLight,
      });
    }

    BUDGET_CATEGORIES.forEach((cat, i) => {
      const amount = hasAiBudget
        ? (day[cat.key] ?? 0)
        : dailyBudget * FALLBACK_SPLITS[cat.key];
      const colX = innerLeft + colWidth * i + 8;
      const labelLines = wrapText(cat.label, ctx.regular, 7, colWidth - 12);

      drawPdfText(ctx, labelLines[0], colX, gridTop - 12, {
        size: 7,
        color: COLORS.textMuted,
      });
      drawPdfText(
        ctx,
        `~${formatPdfBudgetAmount(amount, currencyCode)}`,
        colX,
        gridTop - 28,
        {
          font: ctx.bold,
          size: 10,
          color: COLORS.text,
        },
      );
    });

    innerY = gridTop - gridHeight - 8;
  }

  if (day.items.length > 0) {
    ctx.pageRef.page.drawLine({
      start: { x: innerLeft, y: innerY },
      end: { x: innerRight, y: innerY },
      thickness: 0.5,
      color: COLORS.borderLight,
    });
    innerY -= 16;

    drawSectionLabel(ctx, "Day on foot", innerLeft, innerY);
    const stepsText = `${formatStepCount(insights.estimatedSteps)} steps  |  ${getFatigueLabel(insights.fatigueLevel)}`;
    const stepsWidth = ctx.bold.widthOfTextAtSize(toPdfText(stepsText), 10);
    drawPdfText(ctx, stepsText, innerRight - stepsWidth, innerY, {
      font: ctx.bold,
      size: 10,
      color: COLORS.text,
    });
    innerY -= 14;
  }

  if (insights.cityTransportModes.length > 0) {
    drawSectionLabel(ctx, "Transport", innerLeft, innerY);
    innerY -= 12;
    const transportLine = insights.cityTransportModes
      .map((mode) => TRANSPORT_MODE_META[mode].label)
      .join("   ");
    for (const line of wrapText(transportLine, ctx.regular, 9, innerWidth)) {
      drawPdfText(ctx, line, innerLeft, innerY, {
        size: 9,
        color: COLORS.textSecondary,
      });
      innerY -= 11;
    }
  }

  ctx.yRef.y = boxBottom - 14;
}

function measureTimelineItem(
  ctx: PdfContext,
  item: ItineraryDayData["items"][number],
): number {
  const contentWidth = ctx.contentWidth - (ITEM_CONTENT_X - CONTENT_LEFT);
  let h = 18; // time row

  const typeLabel = getItemTypeLabel(item.type);
  const titleLines = wrapText(item.title, ctx.bold, 11, contentWidth);
  const badgeWidth = measureBadgeWidth(ctx, typeLabel);
  const canInline =
    titleLines.length === 1 &&
    ctx.bold.widthOfTextAtSize(titleLines[0], 11) + 8 + badgeWidth <=
      contentWidth;

  if (canInline) {
    h += Math.max(14, BADGE_HEIGHT + 2);
  } else {
    h += titleLines.length * 14;
    h += BADGE_HEIGHT + 4;
  }

  if (item.description) {
    h += wrapText(item.description, ctx.regular, 9, contentWidth).length * 12;
  }

  const address = item.placeCache?.address ?? item.placeCache?.name;
  if (address) {
    h += wrapText(address, ctx.regular, 8, contentWidth).length * 11;
  }

  return h + 10;
}

function drawTimelineItem(
  ctx: PdfContext,
  item: ItineraryDayData["items"][number],
  index: number,
  dayColor: RGB,
  isLast: boolean,
) {
  const itemHeight = measureTimelineItem(ctx, item);
  ensureSpace(ctx, itemHeight + 4);

  const itemTop = ctx.yRef.y;
  const dotY = itemTop - 6;
  const contentWidth = ctx.contentWidth - (ITEM_CONTENT_X - CONTENT_LEFT);

  if (!isLast) {
    const lineBottom = itemTop - itemHeight + 4;
    ctx.pageRef.page.drawLine({
      start: { x: TIMELINE_X, y: dotY - 4 },
      end: { x: TIMELINE_X, y: lineBottom },
      thickness: 1.5,
      color: COLORS.borderLight,
    });
  }

  ctx.pageRef.page.drawCircle({
    x: TIMELINE_X,
    y: dotY,
    size: 4,
    color: dayColor,
    borderColor: tintColor(dayColor, 0.3),
    borderWidth: 1,
  });

  const timeParts = [item.startTime, item.duration].filter(Boolean);
  const timeText =
    timeParts.length > 0 ? timeParts.join("  |  ") : `Stop ${index + 1}`;
  drawPdfText(ctx, timeText, ITEM_CONTENT_X, itemTop, {
    font: ctx.bold,
    size: 8,
    color: dayColor,
  });
  ctx.yRef.y -= 14;

  const typeLabel = getItemTypeLabel(item.type);
  drawTitleWithBadge(ctx, item.title, typeLabel, ITEM_CONTENT_X, contentWidth);

  if (item.description) {
    for (const line of wrapText(
      item.description,
      ctx.regular,
      9,
      contentWidth,
    )) {
      ensureSpace(ctx, 12);
      drawPdfText(ctx, line, ITEM_CONTENT_X, ctx.yRef.y, {
        size: 9,
        color: COLORS.textSecondary,
      });
      ctx.yRef.y -= 12;
    }
  }

  const address = item.placeCache?.address ?? item.placeCache?.name;
  if (address) {
    for (const line of wrapText(address, ctx.regular, 8, contentWidth)) {
      ensureSpace(ctx, 11);
      drawPdfText(ctx, line, ITEM_CONTENT_X, ctx.yRef.y, {
        size: 8,
        color: COLORS.textMuted,
      });
      ctx.yRef.y -= 11;
    }
  }

  ctx.yRef.y -= 8;
}

function drawDayHeader(
  ctx: PdfContext,
  day: ItineraryDayData,
  dayColor: RGB,
  accentBg: RGB,
  tripStartDate: string | null,
) {
  const dayDate = getDayDate(tripStartDate, day.dayNumber);
  const dateLabel = dayDate ? format(dayDate, "EEEE, MMM d") : null;
  const headerHeight = day.title || day.summary ? 62 : 48;

  ensureSpace(ctx, headerHeight + 20);

  const headerTop = ctx.yRef.y;
  const headerBottom = headerTop - headerHeight;

  ctx.pageRef.page.drawRectangle({
    x: CONTENT_LEFT,
    y: headerBottom,
    width: ctx.contentWidth,
    height: headerHeight,
    color: accentBg,
    borderColor: COLORS.border,
    borderWidth: 0.75,
  });

  const badgeRadius = 14;
  const badgeCx = CONTENT_LEFT + 18;
  const badgeCy = headerTop - 22;

  ctx.pageRef.page.drawCircle({
    x: badgeCx,
    y: badgeCy,
    size: badgeRadius,
    color: dayColor,
  });

  const dayNum = String(day.dayNumber);
  const numWidth = ctx.bold.widthOfTextAtSize(dayNum, 12);
  drawPdfText(ctx, dayNum, badgeCx - numWidth / 2, badgeCy - 4, {
    font: ctx.bold,
    size: 12,
    color: COLORS.white,
  });

  const textX = CONTENT_LEFT + 42;
  const dayLabel = dateLabel
    ? `Day ${day.dayNumber}  |  ${dateLabel}`
    : `Day ${day.dayNumber}`;
  drawPdfText(ctx, dayLabel, textX, headerTop - 16, {
    font: ctx.bold,
    size: 11,
    color: COLORS.text,
  });

  const stopLabel = `${day.items.length} ${day.items.length === 1 ? "stop" : "stops"}`;
  const stopWidth = ctx.regular.widthOfTextAtSize(toPdfText(stopLabel), 8);
  drawPdfText(
    ctx,
    stopLabel,
    CONTENT_LEFT + ctx.contentWidth - stopWidth - 12,
    headerTop - 16,
    {
      size: 8,
      color: COLORS.textMuted,
    },
  );

  let textY = headerTop - 30;
  if (day.title) {
    drawPdfText(ctx, day.title, textX, textY, {
      font: ctx.bold,
      size: 10,
      color: COLORS.text,
    });
    textY -= 13;
  }
  if (day.summary) {
    const summaryLines = wrapText(
      day.summary,
      ctx.regular,
      9,
      ctx.contentWidth - 54,
    );
    for (const line of summaryLines.slice(0, 2)) {
      drawPdfText(ctx, line, textX, textY, {
        size: 9,
        color: COLORS.textSecondary,
      });
      textY -= 11;
    }
  }

  ctx.yRef.y = headerBottom - 12;
}

function drawCoverHeader(
  ctx: PdfContext,
  options: ExportPdfOptions,
  totalStops: number,
) {
  const { width, height } = ctx;

  ctx.pageRef.page.drawRectangle({
    x: 0,
    y: height - HEADER_BAND_HEIGHT,
    width,
    height: HEADER_BAND_HEIGHT,
    color: COLORS.headerBg,
  });

  const titleLines = wrapText(
    options.tripTitle,
    ctx.bold,
    22,
    width - PAGE_MARGIN * 2,
  );
  let titleY = height - 34;
  for (const line of titleLines.slice(0, 2)) {
    drawPdfText(ctx, line, CONTENT_LEFT, titleY, {
      font: ctx.bold,
      size: 22,
      color: COLORS.headerText,
    });
    titleY -= 26;
  }

  const metaParts = [
    options.destination,
    options.tripStartDate
      ? (() => {
          const start = format(new Date(options.tripStartDate), "MMM d, yyyy");
          const end = options.tripEndDate
            ? format(new Date(options.tripEndDate), "MMM d, yyyy")
            : null;
          return end ? `${start} - ${end}` : start;
        })()
      : null,
    `${options.days.length} ${options.days.length === 1 ? "day" : "days"}`,
    `${totalStops} ${totalStops === 1 ? "stop" : "stops"}`,
  ].filter(Boolean);

  drawPdfText(
    ctx,
    metaParts.join("   |   "),
    CONTENT_LEFT,
    height - HEADER_BAND_HEIGHT + 18,
    {
      size: 9,
      color: COLORS.headerSubtext,
    },
  );

  ctx.yRef.y = height - HEADER_BAND_HEIGHT - 28;
}

function drawFooters(ctx: PdfContext) {
  const pages = ctx.pdfDoc.getPages();
  const shortTitle = toPdfText(ctx.tripTitle);
  const truncated =
    shortTitle.length > 40 ? `${shortTitle.slice(0, 37)}...` : shortTitle;

  pages.forEach((p, index) => {
    p.drawLine({
      start: { x: CONTENT_LEFT, y: 40 },
      end: { x: ctx.width - CONTENT_LEFT, y: 40 },
      thickness: 0.5,
      color: COLORS.borderLight,
    });

    p.drawText(truncated, {
      x: CONTENT_LEFT,
      y: 26,
      size: 7,
      font: ctx.regular,
      color: COLORS.textMuted,
    });

    const pageLabel = `${index + 1} / ${pages.length}`;
    const labelWidth = ctx.regular.widthOfTextAtSize(pageLabel, 7);
    p.drawText(pageLabel, {
      x: ctx.width - CONTENT_LEFT - labelWidth,
      y: 26,
      size: 7,
      font: ctx.regular,
      color: COLORS.textMuted,
    });
  });
}

export async function buildItineraryPdf(
  options: ExportPdfOptions,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const currencyCode = options.budgetCurrency ?? DEFAULT_BUDGET_CURRENCY;
  const fallbackDailyBudget =
    options.budgetPerPerson && options.days.length > 0
      ? options.budgetPerPerson / options.days.length
      : null;
  const totalStops = options.days.reduce(
    (sum, day) => sum + day.items.length,
    0,
  );

  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const contentWidth = width - CONTENT_LEFT * 2;

  const ctx: PdfContext = {
    pdfDoc,
    pageRef: { page },
    yRef: { y: height - PAGE_MARGIN },
    width,
    height,
    contentWidth,
    regular,
    bold,
    tripTitle: options.tripTitle,
    destination: options.destination,
  };

  drawCoverHeader(ctx, options, totalStops);

  if (options.days.length === 0) {
    drawFlowText(ctx, "No itinerary items yet.", {
      color: COLORS.textMuted,
      size: 11,
    });
    drawFooters(ctx);
    return pdfDoc.save();
  }

  for (const day of options.days) {
    const dayColorHex = getDayColor(day.dayNumber);
    const dayColor = hexToRgb(dayColorHex);
    const accentBg = tintColor(dayColor, 0.07);
    const dailyBudget = resolveDailyBudget(day, fallbackDailyBudget);
    const hasAiBudget = day.budgetTotal != null && day.budgetTotal > 0;

    if (ctx.yRef.y < MIN_Y + 120 && options.days.indexOf(day) > 0) {
      ctx.pageRef.page = pdfDoc.addPage();
      ctx.yRef.y = ctx.height - PAGE_MARGIN;
    }

    drawDayHeader(ctx, day, dayColor, accentBg, options.tripStartDate);

    drawInsightBox(ctx, day, dayColor, dailyBudget, hasAiBudget, currencyCode);

    if (day.items.length === 0) {
      drawFlowText(ctx, "No activities planned.", {
        x: ITEM_CONTENT_X,
        size: 10,
        color: COLORS.textMuted,
      });
      ctx.yRef.y -= 8;
      continue;
    }

    day.items.forEach((item, index) => {
      drawTimelineItem(
        ctx,
        item,
        index,
        dayColor,
        index === day.items.length - 1,
      );
    });

    ctx.yRef.y -= 10;
  }

  drawFooters(ctx);
  return pdfDoc.save();
}
