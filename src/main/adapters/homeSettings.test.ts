import { describe, expect, it } from "vitest";
import type { HomeConfig } from "../domain/home/home";
import type { AppConfigStore } from "./appConfigStore";
import { createHomeSettings } from "./homeSettings";

function fakeConfigStore(initial: HomeConfig): AppConfigStore & { setConfig(config: HomeConfig): void } {
  let config = initial;
  return {
    read: () => config,
    write: (patch) => {
      config = { ...config, ...patch };
      return config;
    },
    setConfig(next) {
      config = next;
    },
  };
}

describe("createHomeSettings", () => {
  it("resolves homeArgs() from resolveHomeArgs(configStore.read())", () => {
    const configStore = fakeConfigStore({ home: "link" });
    const settings = createHomeSettings(configStore, {});

    expect(settings.homeArgs()).toEqual(["--link"]);
  });

  it("re-reads the config store on every call instead of caching at construction", () => {
    const configStore = fakeConfigStore({ home: "isolated" });
    const settings = createHomeSettings(configStore, {});

    expect(settings.homeArgs()).toEqual(["--isolated"]);

    configStore.setConfig({ home: "link" });

    expect(settings.homeArgs()).toEqual(["--link"]);
  });

  it("forwards GENTLE_SHELL_HOME through to resolveHomeArgs", () => {
    const configStore = fakeConfigStore({ home: "isolated" });
    const settings = createHomeSettings(configStore, { GENTLE_SHELL_HOME: "/custom/home" });

    expect(settings.homeArgs()).toEqual(["--home", "/custom/home"]);
  });
});
