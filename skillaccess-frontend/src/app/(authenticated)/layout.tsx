import HomeLayout from "@/layouts/HomeLayout";
import { Suspense } from "react";
import FullScreenLoader from "@/components/loaders/FullScreenLoader";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <HomeLayout>{children}</HomeLayout>
    </Suspense>
  );
}
