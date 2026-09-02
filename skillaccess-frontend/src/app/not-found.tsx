export default function NotFound() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white flex items-center justify-center px-4">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute w-full h-full object-cover  pointer-events-none"
      >
        <source
          src="https://res.cloudinary.com/dylxoqogx/video/upload/v1751021167/original-8d5195c7fd935122a55fb9c11a083e46_ns2k31.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Overlay container with glassmorphism */}
      {/* <div className="relative z-10 max-w-lg w-full bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-lg text-center border border-white/20">
        <h1 className="text-5xl font-extrabold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-md mb-6">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <Link href="/">
          <Button variant="secondary">Go Home</Button>
        </Link>
      </div> */}
    </div>
  );
}
