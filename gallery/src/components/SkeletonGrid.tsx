const skeletonRatios = [
  [65, 80, 55, 70, 60],
  [75, 55, 70, 60, 80],
];

export function SkeletonGrid() {
  return (
    <div className="flex gap-2 px-2 pt-2">
      {skeletonRatios.map((col, colIndex) => (
        <div key={colIndex} className="flex flex-1 flex-col gap-2">
          {col.map((ratio, i) => (
            <div
              key={i}
              className="relative w-full overflow-hidden rounded-xl"
              style={{ paddingBottom: `${ratio + 40}%` }}
            >
              <div className="absolute inset-0 skeleton-shimmer-card" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
