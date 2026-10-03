import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
      <h1 className="text-3xl font-bold text-[#111111] tracking-tight">Page not found</h1>
      <p className="text-sm text-[#666666]">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        href="/shop"
        className="inline-flex items-center justify-center min-h-12 px-8 bg-[#111111] text-white text-sm font-semibold rounded-full hover:bg-[#111111]/85 transition-all"
      >
        Browse laptops
      </Link>
    </div>
  );
}
