const notifications = [
  {
    title: "Weather Alert",
    message: "Sunny conditions expected all day.",
    color: "bg-sky-400",
  },
  {
    title: "Projects",
    message: "Widget migration completed successfully.",
    color: "bg-violet-400",
  },
  {
    title: "Garage",
    message: "No maintenance is currently due.",
    color: "bg-orange-400",
  },
];

export default function NotificationsList() {
  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.title}
          className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <div
            className={`mt-1 h-3 w-3 rounded-full ${notification.color}`}
          />

          <div className="flex-1">
            <h3 className="font-medium text-white">
              {notification.title}
            </h3>

            <p className="mt-1 text-sm text-white/60">
              {notification.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}