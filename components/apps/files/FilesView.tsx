"use client";

export default function FilesView() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Files
        </h1>

        <p className="text-white/60">
          Cosmic currently keeps documents and exports with the module that owns them. A general-purpose cloud file browser is intentionally not enabled yet.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-white/50">
          Open Garage for vehicle documents or Settings for validated local exports. This route does not claim file-management capabilities that are not connected.
        </p>
      </div>

    </div>
  );
}
