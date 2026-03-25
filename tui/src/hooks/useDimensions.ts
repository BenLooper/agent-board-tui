import { useState, useEffect } from "react";
import { useStdout } from "ink";

export function useDimensions() {
  const { stdout } = useStdout();
  const [size, setSize] = useState({
    width: stdout?.columns ?? 120,
    height: stdout?.rows ?? 30,
  });

  useEffect(() => {
    if (!stdout) return;
    const update = () => setSize({ width: stdout.columns, height: stdout.rows });
    stdout.on("resize", update);
    return () => { stdout.off("resize", update); };
  }, [stdout]);

  return size;
}
