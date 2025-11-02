import fs from 'fs';
import { ensureDirExists, sanitizeQuery } from '@main/data/utils';

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

describe('sanitizeQuery', () => {
  it('should remove properties with empty objects', () => {
    const query = { a: {}, b: { x: 1 } };
    sanitizeQuery(query);
    expect(query).toEqual({ b: { x: 1 } });
  });

  it('should remove properties with undefined values', () => {
    const query = { a: undefined, b: 2 };
    sanitizeQuery(query);
    expect(query).toEqual({ b: 2 });
  });

  it('should keep non-empty objects', () => {
    const query = { a: { x: 1 } };
    sanitizeQuery(query);
    expect(query).toEqual({ a: { x: 1 } });
  });

  it('should remove both empty objects and undefined values', () => {
    const query = { a: {}, b: undefined, c: 123 };
    sanitizeQuery(query);
    expect(query).toEqual({ c: 123 });
  });
});
