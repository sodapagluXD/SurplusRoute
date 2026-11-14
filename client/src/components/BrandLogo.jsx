export default function BrandLogo({ badge, size = 'md' }) {
  const isLarge = size === 'lg';

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className={`${
          isLarge ? 'w-11 h-11 rounded-2xl' : 'w-9 h-9 rounded-xl'
        } bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center shadow-lg shadow-emerald-950/40 shrink-0`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className={isLarge ? 'w-6 h-6' : 'w-5 h-5'}
        >
          <path
            d="M16 5c-5 0-9 4-9 9 0 6.2 9 13 9 13s9-6.8 9-13c0-5-4-9-9-9zm0 12.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"
            fill="#10b981"
          />
        </svg>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`${
            isLarge ? 'text-3xl sm:text-4xl font-extrabold' : 'text-lg font-bold'
          } text-white tracking-tight`}
        >
          Surplus<span className="text-emerald-400">Route</span>
        </span>

        {badge && (
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-medium">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}