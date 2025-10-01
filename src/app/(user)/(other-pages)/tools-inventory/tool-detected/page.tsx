import React, { Suspense } from "react";
import ToolDetectedPage from "./ToolDetectedPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ToolDetectedPage />
    </Suspense>
  );
}
