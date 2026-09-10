import { Runner, type Command } from '../lib/runner';
const runner = new Runner(message => self.postMessage(message));
self.onmessage = (event: MessageEvent<Command>) => runner.command(event.data);
