const accounts = [
  {
    name: "Personal",
    unread: 7,
  },
  {
    name: "School",
    unread: 5,
  },
];

export default function OutlookAccounts() {
  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/45">
        ACCOUNTS
      </p>

      <div className="space-y-2">
        {accounts.map((account) => (
          <div
            key={account.name}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <span className="text-white">
              {account.name}
            </span>

            <span className="text-white/60">
              {account.unread} unread
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}