import { Pipe, type PipeTransform } from "@angular/core";

@Pipe({
  name: "ngxTimeOnly"
})
export class TimeOnlyPipe implements PipeTransform {
  transform(
    value: string | Date | null | undefined,
    format: "shortTime" | "mediumTime" = "shortTime"
  ): string | null {
    if (value == null || value === "") {
      return null;
    }

    let hours: number;
    let minutes: string;
    let seconds: string;

    if (value instanceof Date) {
      hours = value.getHours();
      minutes = String(value.getMinutes()).padStart(2, "0");
      seconds = String(value.getSeconds()).padStart(2, "0");
    } else {
      const timeParts = value.split(":");
      if (timeParts.length < 2) {
        return null;
      }
      hours = parseInt(timeParts[0], 10);
      minutes = timeParts[1];
      seconds = (timeParts[2] || "00").split(".")[0];
    }

    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    if (format === "shortTime") {
      return `${hours}:${minutes} ${period}`;
    } else {
      return `${hours}:${minutes}:${seconds} ${period}`;
    }
  }
}
