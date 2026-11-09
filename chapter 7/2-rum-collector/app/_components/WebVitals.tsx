"use client";

import { useReportWebVitals } from "next/web-vitals";
import { routePattern } from "@/lib/routes";

type Metric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0];

// Defined at module level: useReportWebVitals subscribes again whenever it
// receives a new function, which would report earlier metrics twice.
function report(metric: Metric) {
  const page = metric.navigationURL ?? location.href;
  const url = new URL(page, location.href);
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    route: routePattern(url.pathname),
    release: process.env.NEXT_PUBLIC_RELEASE,
  });
  navigator.sendBeacon("/api/vitals", body);
}

export function WebVitals() {
  useReportWebVitals(report);
  return null;
}
