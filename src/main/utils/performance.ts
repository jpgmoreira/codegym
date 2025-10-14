import { performance, PerformanceObserver } from 'node:perf_hooks';

const obs = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    console.log(`>> [${entry.name}]: ${entry.duration.toFixed(3)} ms`);
  });
});
obs.observe({ entryTypes: ['measure'] });

export function measure<T>(name: string, fn: () => T): T {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  performance.mark(startMark);
  const result = fn();
  performance.mark(endMark);
  performance.measure(name, startMark, endMark);
  return result;
}

// Usage example:
// ipcMain.handle(TreeChannels.toggleDirOpen, (_event, anchor, nodeId) => {
//   return measure('toggleDirOpen', () => {
//     TreeManager.instance.toggleDirOpen(nodeId);
//     return TreeManager.instance.buildResult(anchor);
//   });
// });
