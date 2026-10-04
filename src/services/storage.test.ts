import { afterEach, describe, expect, it, vi } from "vitest";
import { isStoragePersisted, requestPersistentStorage } from "./storage.ts";

describe("storage persistence service", () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it("returns false if navigator.storage is undefined", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      configurable: true,
      writable: true,
    });

    expect(await requestPersistentStorage()).toBe(false);
    expect(await isStoragePersisted()).toBe(false);
  });

  it("returns true immediately if already persisted", async () => {
    const persistedMock = vi.fn().mockResolvedValue(true);
    const persistMock = vi.fn();

    Object.defineProperty(globalThis, "navigator", {
      value: {
        storage: {
          persisted: persistedMock,
          persist: persistMock,
        },
      },
      configurable: true,
      writable: true,
    });

    const result = await requestPersistentStorage();
    expect(result).toBe(true);
    expect(persistedMock).toHaveBeenCalled();
    expect(persistMock).not.toHaveBeenCalled();
  });

  it("calls persist() if not already persisted and returns result", async () => {
    const persistedMock = vi.fn().mockResolvedValue(false);
    const persistMock = vi.fn().mockResolvedValue(true);

    Object.defineProperty(globalThis, "navigator", {
      value: {
        storage: {
          persisted: persistedMock,
          persist: persistMock,
        },
      },
      configurable: true,
      writable: true,
    });

    const result = await requestPersistentStorage();
    expect(result).toBe(true);
    expect(persistedMock).toHaveBeenCalled();
    expect(persistMock).toHaveBeenCalled();
  });

  it("handles errors gracefully without throwing", async () => {
    const persistedMock = vi.fn().mockRejectedValue(new Error("Storage error"));

    Object.defineProperty(globalThis, "navigator", {
      value: {
        storage: {
          persisted: persistedMock,
          persist: vi.fn(),
        },
      },
      configurable: true,
      writable: true,
    });

    expect(await requestPersistentStorage()).toBe(false);
    expect(await isStoragePersisted()).toBe(false);
  });
});
