import { useEffect, useState } from "react";
import { getLatticeEngine } from "./latticeEngine";

export function useLatticeEngine() {
  const engine = getLatticeEngine();
  const [, force] = useState(0);

  useEffect(() => {
    if (!engine.running) engine.start();
    const unsub = engine.subscribe(() => force(n => n + 1));
    return () => {
      unsub();
    };
  }, [engine]);

  return engine;
}
