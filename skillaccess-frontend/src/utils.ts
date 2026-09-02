type FormatType = "full" | "dateOnly" | "dateTime" | "minimal" | "all";
export function convertToHumanReadable(
  isoTimestamp: string,
  format: FormatType = "full"
): string {
  const date = new Date(isoTimestamp);

  // Define formatting options for each format type
  const formatOptions: Record<FormatType, Intl.DateTimeFormatOptions> = {
    full: {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    },
    dateOnly: {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
    dateTime: {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    minimal: {
      year: "2-digit",
      month: "numeric",
      day: "numeric",
    },
    all: {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "long",
    },
  };

  // Fallback to "full" format if an invalid format is provided
  const options = formatOptions[format] || formatOptions["full"];

  return date.toLocaleString(undefined, options);
}
