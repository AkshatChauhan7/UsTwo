export default function Avatar({ initials, online, size = "md" }) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-13 h-13 text-base",
  };

  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizes[size]} rounded-full bg-rose-100 flex items-center justify-center font-semibold text-rose-700 select-none`}
      >
        {initials}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
      )}
    </div>
  );
}
