import { useRef, useState } from "react";

export function useUserModalSave(onClose: () => void) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function save(mutate: () => Promise<boolean>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setFailed(false);
    try {
      if (await mutate()) onClose();
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return { busy, failed, save };
}
