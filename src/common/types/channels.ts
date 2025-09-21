/**
 * Allowed communication channels between main and renderer processes.
 */
export enum Channels {
  loadStartupData = 'load-startup-data',
  updateCurrOj = 'update-curr-oj',
  updateCurrPage = 'update-curr-page',
  createProfile = 'create-profile',
  login = 'login',
  updateOjCache = 'update-oj-cache',
  getOjProblem = 'get-oj-problem',
  setCurrSnapshotSolvedDate = 'set-curr-snapshot-solved-date',
  updateOjFilters = 'update-oj-filters',
  fetchHistoryPage = 'fetch-history-page',
  setCurrOjSnapshot = 'set-curr-oj-snapshot',
}
