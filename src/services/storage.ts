/**
 * ブラウザのストレージ自動削除（eviction）を防止し、永続化（Persistent Storage）を要求
 * PWA/TWAとしてインストールされている環境では自動的に承認される
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    return false;
  }

  try {
    const isPersisted = await navigator.storage.persisted();
    if (isPersisted) {
      return true;
    }
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * 現在ストレージが永続化（Persistent）として保護されているか確認
 */
export async function isStoragePersisted(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persisted) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}
