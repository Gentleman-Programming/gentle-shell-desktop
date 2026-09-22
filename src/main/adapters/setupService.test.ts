import { describe, expect, it } from "vitest";
import type { HomeConfig } from "../domain/home/home";
import type { AppConfigStore } from "./appConfigStore";
import { createSetupService } from "./setupService";

function fakeConfigStore(initial: HomeConfig = {}): AppConfigStore & { written: HomeConfig[] } {
  let config = initial;
  const written: HomeConfig[] = [];
  return {
    read: () => config,
    write: (patch) => {
      config = { ...config, ...patch };
      written.push(config);
      return config;
    },
    written,
  };
}

describe("createSetupService", () => {
  it("status() needsChoice is true when no home is persisted and pi was detected", async () => {
    const configStore = fakeConfigStore({});
    const service = createSetupService(configStore, { PI_CODING_AGENT_DIR: "/pi-dir" }, () => true);

    const status = await service.status();

    expect(status.needsChoice).toBe(true);
    expect(status.detection).toEqual({ found: true, dir: "/pi-dir", hasAuth: true, hasModels: true });
  });

  it("status() needsChoice is false when a home is already persisted, even if pi is found", async () => {
    const configStore = fakeConfigStore({ home: "isolated" });
    const service = createSetupService(configStore, { PI_CODING_AGENT_DIR: "/pi-dir" }, () => true);

    const status = await service.status();

    expect(status.needsChoice).toBe(false);
  });

  it("status() needsChoice is false when no pi was detected, even without a persisted choice", async () => {
    const configStore = fakeConfigStore({});
    const service = createSetupService(configStore, { PI_CODING_AGENT_DIR: "/pi-dir" }, () => false);

    const status = await service.status();

    expect(status.needsChoice).toBe(false);
    expect(status.detection.found).toBe(false);
  });

  it("chooseHome(mode) persists the choice through configStore.write", async () => {
    const configStore = fakeConfigStore({});
    const service = createSetupService(configStore, {}, () => false);

    await service.chooseHome("link");

    expect(configStore.written).toEqual([{ home: "link" }]);
  });
});
