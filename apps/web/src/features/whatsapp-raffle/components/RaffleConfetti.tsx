const colors = ["#ff8000", "#22c55e", "#facc15", "#38bdf8", "#ffffff"];

export function RaffleConfetti() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {Array.from({ length: 46 }).map((_, index) => (
                <span
                    key={index}
                    className="absolute block h-3 w-2 opacity-0"
                    style={{
                        left: `${(index * 19) % 100}%`,
                        top: `${-10 - (index % 12) * 5}%`,
                        backgroundColor: colors[index % colors.length],
                        animation: `fall ${2.6 + (index % 9) * 0.18}s ${index * 0.04}s linear infinite`,
                    }}
                />
            ))}
        </div>
    );
}
