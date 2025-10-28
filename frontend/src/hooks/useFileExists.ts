// frontend/src/hooks/useFileExists.ts
import { useEffect, useState } from "react";

export function useFileExists(url: string) {
  const [exists, setExists] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(url, { method: "HEAD" })
      .then((r) => !cancelled && setExists(r.ok))
      .catch(() => !cancelled && setExists(false));
    return () => { cancelled = true; };
  }, [url]);
  return exists; // true | false | null(loading)
}
