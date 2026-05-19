interface DecisionPathProps {
  path: string[];
}

export function DecisionPath({ path }: DecisionPathProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {path.map((node, i) => {
        const isLast = i === path.length - 1;
        return (
          <span key={i} className="flex items-center gap-2 flex-wrap">
            <span
              className={`
              inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-mono border
              ${
                isLast
                  ? "bg-sky-950 text-sky-300 border-sky-700 shadow shadow-sky-950"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }
            `}
            >
              {isLast && <span className="mr-1.5 text-sky-500">▶</span>}
              {node}
            </span>
            {i < path.length - 1 && (
              <span className="text-slate-700 text-sm select-none">→</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
