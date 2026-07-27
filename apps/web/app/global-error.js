"use client";
export default function GlobalErrorPage({ error, reset, }) {
    return (<html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <h2 className="text-2xl font-bold mb-4">Critical Error</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button onClick={reset} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Try again
          </button>
        </div>
      </body>
    </html>);
}
//# sourceMappingURL=global-error.js.map