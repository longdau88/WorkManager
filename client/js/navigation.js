const NAVIGATION_STORAGE_KEY = 'wm.navigation';

const DEFAULT_NAVIGATION = {
  view: 'tasks',
  project: 'all',
  projectTab: 'tasks',
  filter: 'all',
  search: '',
  assignee: '',
  sort: 'manual'
};

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

export function loadNavigationState() {
  try {
    const stored = JSON.parse(localStorage.getItem(NAVIGATION_STORAGE_KEY) || '{}');
    return {
      ...DEFAULT_NAVIGATION,
      ...stored,
      view: stored.view === 'stats' ? 'stats' : 'tasks',
      project: isNonEmptyString(stored.project) ? stored.project : 'all',
      projectTab: isNonEmptyString(stored.projectTab) ? stored.projectTab : 'tasks',
      filter: isNonEmptyString(stored.filter) ? stored.filter : 'all',
      search: typeof stored.search === 'string' ? stored.search : '',
      assignee: typeof stored.assignee === 'string' ? stored.assignee : '',
      sort: isNonEmptyString(stored.sort) ? stored.sort : 'manual'
    };
  } catch (error) {
    console.warn('Could not read navigation state:', error);
    return { ...DEFAULT_NAVIGATION };
  }
}

export function saveNavigationState(state) {
  const navigation = {
    view: state.view,
    project: state.curProject,
    projectTab: state.curPtab,
    filter: state.curFilter,
    search: state.searchQuery,
    assignee: state.assigneeFilter,
    sort: state.sortMode
  };

  try {
    localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(navigation));
  } catch (error) {
    console.warn('Could not save navigation state:', error);
  }
}
