import Link from "next/link";
export default function HomePage() {
    return (<main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Agent Knowledge Graph Lab</h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl text-center">
        Research environment for evaluating whether typed knowledge graphs improve
        agent retrieval, reasoning, provenance tracing, and contradiction detection.
      </p>
      <nav className="flex gap-4">
        <Link href="/assistant" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Assistant
        </Link>
        <Link href="/graph" className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700">
          Graph Explorer
        </Link>
        <Link href="/knowledge" className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700">
          Knowledge Browser
        </Link>
        <Link href="/evaluations" className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700">
          Evaluations
        </Link>
      </nav>
    </main>);
}
//# sourceMappingURL=page.js.map