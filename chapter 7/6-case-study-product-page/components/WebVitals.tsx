"use client";

import { useEffect } from "react";
import { onCLS, onINP, onLCP, onFCP, onTTFB, type MetricWithAttribution } from "web-vitals/attribution";
import { routePattern } from "@/lib/routes";

const LCP_PARTS = ["timeToFirstByte", "resourceLoadDelay", "resourceLoadDuration", "elementRenderDelay"] as const;

// Field reporting with the segments the case study needs: route, release,
// locale, device class, and the LCP and INP breakdowns. It uses the
// web-vitals attribution build directly, because useReportWebVitals reports
// the standard build's metrics, without attribution.
function report(metric: MetricWithAttribution) {
  const a = metric.attribution as Record<string, any>;
  const url = new URL(metric.navigationURL ?? location.href, location.href);
  navigator.sendBeacon("/api/vitals", JSON.stringify({
    name: metric.name,
    value: metric.value,
    navigationType: metric.navigationType,
    route: routePattern(url.pathname),
    release: process.env.NEXT_PUBLIC_RELEASE,
    locale: navigator.language,
    device: matchMedia("(max-width: 768px)").matches ? "mobile" : "desktop",
    lcpParts: metric.name === "LCP"
      ? Object.fromEntries(LCP_PARTS.map((k) => [k, a[k]])) : undefined,
    lcpTarget: metric.name === "LCP" ? a.target : undefined,
    inpParts: metric.name === "INP" ? {
      inputDelay: a.inputDelay, processingDuration: a.processingDuration,
      presentationDelay: a.presentationDelay,
      scripts: (a.longAnimationFrameEntries ?? []).flatMap((e: any) =>
        (e.scripts ?? []).map((s: any) => s.sourceURL?.split("/").pop())).filter(Boolean),
    } : undefined,
  }));
}

export function WebVitals() {
  useEffect(() => {
    const o = { reportSoftNavs: true };
    onLCP(report, o); onINP(report, o); onCLS(report, o); onFCP(report, o); onTTFB(report);
  }, []);
  return null;
}
