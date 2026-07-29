import EvidenceDrawer from "~/components/evidence-drawer";

export default function EvidencePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 px-6 py-3">
        <h1 className="text-lg font-semibold text-gray-100">Evidence Inspector</h1>
        <p className="text-sm text-gray-500">Inspect supporting and contradicting evidence for claims</p>
      </header>
      <EvidenceDrawer />
    </div>
  );
}
