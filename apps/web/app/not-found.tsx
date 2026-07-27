import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-bold mb-4">404 — Not Found</h2>
      <p className="text-gray-600 mb-4">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Go Home
      </Link>
    </div>
  );
}
