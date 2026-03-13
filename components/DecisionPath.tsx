interface DecisionPathProps {
  path: string[];
}

export function DecisionPath({ path }: DecisionPathProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {path.map((node, i) => {
        const isLast = i === path.length - 1;
        return (
          <span key={i} className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded text-sm font-mono border ${
                isLast
                  ? "bg-blue-950 text-sky-300 border-blue-500"
                  : "bg-slate-800 text-slate-500 border-slate-700"
              }`}
            >
              {node}
            </span>
            {i < path.length - 1 && (
              <span className="text-slate-600 text-base">→</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
