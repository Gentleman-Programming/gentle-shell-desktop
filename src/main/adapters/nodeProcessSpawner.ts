import { spawn } from "node:child_process";
import type { Readable } from "node:stream";
import { LineSplitter } from "../domain/rpc/codec";
import type { ProcessSpawner, SpawnedProcess } from "../ports";

/** child_process.spawn-backed ProcessSpawner, line-splitting stdout/stderr through the domain LineSplitter. */
export function createNodeProcessSpawner(): ProcessSpawner {
  return {
    spawn(command, args, env, cwd): SpawnedProcess {
      const child = spawn(command, [...args], { env, cwd, stdio: ["pipe", "pipe", "pipe"] });

      const stdoutLineHandlers: Array<(line: string) => void> = [];
      const stderrLineHandlers: Array<(line: string) => void> = [];
      const errorHandlers: Array<(error: Error) => void> = [];

      wireLineStream(child.stdout, stdoutLineHandlers);
      wireLineStream(child.stderr, stderrLineHandlers);

      child.on("error", (error: Error) => {
        for (const handler of errorHandlers) handler(error);
      });

      const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
        child.on("exit", (code, signal) => resolve({ code, signal }));
      });

      return {
        exited,
        writeStdin(text: string) {
          child.stdin?.write(text);
        },
        endStdin() {
          child.stdin?.end();
        },
        onStdoutLine(handler) {
          stdoutLineHandlers.push(handler);
        },
        onStderrLine(handler) {
          stderrLineHandlers.push(handler);
        },
        onError(handler) {
          errorHandlers.push(handler);
        },
        kill(signal) {
          child.kill(signal);
        },
      };
    },
  };
}

function wireLineStream(stream: Readable | null, handlers: Array<(line: string) => void>): void {
  if (!stream) return;
  const splitter = new LineSplitter();
  stream.setEncoding("utf8");
  stream.on("data", (chunk: string) => {
    for (const line of splitter.push(chunk)) {
      for (const handler of handlers) handler(line);
    }
  });
  stream.on("end", () => {
    for (const line of splitter.flush()) {
      for (const handler of handlers) handler(line);
    }
  });
}
