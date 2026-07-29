"use client";

export default function SettingsPanel() {
  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <h2 className="text-lg font-semibold mb-4">Commands</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CommandCard
          title="Build Graph"
          description="Compile knowledge documents into the graph corpus."
          command="pnpm graph:build"
        />
        <CommandCard
          title="Validate Knowledge"
          description="Check knowledge documents for structural errors."
          command="pnpm knowledge:validate"
        />
        <CommandCard
          title="Run Evaluations"
          description="Compare graph vs. document retrieval across all benchmark questions."
          command="pnpm eval:compare"
        />
        <CommandCard
          title="Smoke Test"
          description="Quick structural validation of benchmark questions."
          command="pnpm eval:smoke"
        />
        <CommandCard
          title="Inspect Graph"
          description="Print graph statistics and entity counts."
          command="pnpm graph:inspect"
        />
        <CommandCard
          title="Clean Data"
          description="Remove all compiled data artifacts."
          command="pnpm graph:clean"
        />
      </div>
    </section>
  );
}

function CommandCard({
  title,
  description,
  command,
}: {
  title: string;
  description: string;
  command: string;
}) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-200 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-3">{description}</p>
      <code className="text-xs bg-gray-950 px-2 py-1 rounded text-gray-400 select-all">
        {command}
      </code>
    </div>
  );
}
