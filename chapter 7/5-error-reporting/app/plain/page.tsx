import { CrashButton } from "@/components/CrashButton";

// No error.tsx in this segment or above it: only Next.js's built-in
// boundary catches the render error.
export default function Page() {
  return <main><h1>No boundary of ours</h1><CrashButton /></main>;
}
