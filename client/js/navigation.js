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

function readUrlNavigation() {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return {};

  const params = new URLSearchParams(hash);
  if (!params.has('screen') && !params.has('project') && !params.has('tab')) return {};

  return {
    view: params.get('screen') || undefined,
    project: params.get('project') || undefined,
    projectTab: params.get('tab') || undefined,
    filter: params.get('filter') || undefined,
    search: params.get('search') || undefined,
    assignee: params.get('assignee') || undefined,
    sort: params.get('sort') || undefined
  };
}

export function loadNavigationState() {
  try {
    const stored = JSON.parse(localStorage.getItem(NAVIGATION_STORAGE_KEY) || '{}');
    const urlState = readUrlNavigation();
    const source = Object.keys(urlState).length ? urlState : stored;
    return {
      ...DEFAULT_NAVIGATION,
      ...source,
      view: source.view === 'stats' ? 'stats' : 'tasks',
      project: isNonEmptyString(source.project) ? source.project : 'all',
      projectTab: source.project === 'all' ? 'tasks' : (isNonEmptyString(source.projectTab) ? source.projectTab : 'tasks'),
      filter: isNonEmptyString(source.filter) ? source.filter : 'all',
      search: typeof source.search === 'string' ? source.search : '',
      assignee: typeof source.assignee === 'string' ? source.assignee : '',
      sort: isNonEmptyString(source.sort) ? source.sort : 'manual'
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
    const params = new URLSearchParams({
      screen: navigation.view,
      project: navigation.project,
      tab: navigation.projectTab,
      filter: navigation.filter,
      search: navigation.search,
      assignee: navigation.assignee,
      sort: navigation.sort
    });
    const nextUrl = `${window.location.pathname}${window.location.search}#${params.toString()}`;
    window.history.replaceState(null, '', nextUrl);
  } catch (error) {
    console.warn('Could not save navigation state:', error);
  }
}
