/**
 * Vertical RTL timeline for route waypoints.
 *
 * Layout per row (left → right in visual RTL context):
 *   [thumbnail]  [title + description]  [● node on vertical line]
 *
 * The line and nodes are absolutely positioned inside a pr-10 (40px) gutter
 * on the right side of each row:
 *   - line center  at right: 20px  →  `right-5`
 *   - node (18×18) at right: 11px  →  node center also at 11+9 = 20px ✓
 */
export default function RouteTimeline({ waypoints }) {
  if (!waypoints?.length) return null;

  return (
    <div className="relative" dir="rtl">
      {/* Continuous vertical line — starts/ends near first/last node */}
      <div className="absolute right-5 top-5 bottom-5 w-0.5 bg-olive-200" />

      {waypoints.map((stop, idx) => {
        const isFirst = idx === 0;
        const isLast  = idx === waypoints.length - 1;

        return (
          <div key={stop.id} className="relative flex items-start gap-3 pb-5 pr-10">

            {/* Circle node — anchored to the vertical line */}
            <div
              className={`
                absolute right-[11px] top-1.5 z-10
                w-[18px] h-[18px] rounded-full
                border-2 border-white shadow-sm
                flex items-center justify-center
                ${isFirst || isLast ? 'bg-olive-700' : 'bg-olive-400'}
              `}
            >
              {/* First and last nodes show a small filled dot for emphasis */}
              {(isFirst || isLast) && (
                <div className="w-[6px] h-[6px] rounded-full bg-white opacity-80" />
              )}
            </div>

            {/* Content — RTL flex: first child → right side, last → left side */}
            {/* text div (first) → right;  img (last) → left */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 text-right leading-snug">
                {stop.name}
              </p>
              <p className="text-xs text-slate-500 text-right mt-1 leading-relaxed">
                {stop.description}
              </p>
            </div>

            <img
              src={stop.imageUrl}
              alt={stop.name}
              loading="lazy"
              className="w-[68px] h-[68px] rounded-xl object-cover flex-shrink-0"
            />

          </div>
        );
      })}
    </div>
  );
}
