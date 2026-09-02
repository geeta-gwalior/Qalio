import { Suspense } from "react";
import TakeTestClient from "./TakeTestClient";

export default function TakeTestPage() {
  return (
    <div className="min-h-screen">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading assessment...</p>
            </div>
          </div>
        }
      >
        <TakeTestClient />
      </Suspense>
    </div>
  );
}
