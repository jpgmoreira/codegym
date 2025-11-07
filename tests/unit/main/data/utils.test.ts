import fs from 'fs';
import { ensureDirExists } from '@main/data/utils';

vi.mock('fs');

describe('ensureDirExists', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should call fs.mkdirSync with the directory path and { recursive: true }', () => {
    const mkdirSyncSpy = vi.spyOn(fs, 'mkdirSync');
    ensureDirExists('/some/directory');
    expect(mkdirSyncSpy).toHaveBeenCalledWith('/some/directory', { recursive: true });
  });
});
