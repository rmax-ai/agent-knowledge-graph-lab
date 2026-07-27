"use client";
export default function ErrorPage({ error, reset, }) {
    return (<div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button onClick={reset} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Try again
      </button>
    </div>);
}
//# sourceMappingURL=error.js.map