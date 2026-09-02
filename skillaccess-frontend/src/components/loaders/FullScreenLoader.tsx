// components/loaders/FullScreenLoader.tsx
import SpinnerLoader from "./SpinnerLoader";

export default function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
      <SpinnerLoader size={40} />
    </div>
  );
}
