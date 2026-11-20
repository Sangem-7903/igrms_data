// src/hooks/useOptions.js
// Loads one dropdown. Re-loads when `param` changes (the parent dropdown's value),
// stays empty while `enabled` is false, and ignores answers that arrive after the user moved on.
import { useEffect, useState } from "react";

export function useOptions(fetcher, param, enabled = true) {
  const [state, setState] = useState({ options: [], loading: false, error: "" });

  useEffect(() => {
    if (!enabled) {
      setState({ options: [], loading: false, error: "" });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: "" }));
    fetcher(param)
      .then((options) => {
        if (!cancelled) setState({ options, loading: false, error: "" });
      })
      .catch((err) => {
        if (!cancelled) setState({ options: [], loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher, param, enabled]);

  return state;
}
