// In-app navigation history. The back button only uses browser history when the previous entry is ours;
// when the app was opened directly on a screen (Android app, notification, shared link) it goes to the
// screen's parent instead of leaving the app.
import { ROUTINES } from './data/routines';

const cur = () => location.hash || '#/today';
const stack: string[] = [cur()];
let replacing = false;

window.addEventListener('hashchange', () => {
  const h = cur();
  if (replacing) { stack[stack.length - 1] = h; replacing = false; return; }
  if (stack.length > 1 && stack[stack.length - 2] === h) stack.pop();
  else if (stack[stack.length - 1] !== h) stack.push(h);
});

/** The screen a page belongs under, used when there is no in-app history to go back to. */
export function parentOf(hash: string): string {
  const [, route, arg] = hash.match(/^#\/([\w-]+)(?:\/([\w-]+))?/) || [];
  switch (route) {
    case 'workout': case 'library': return '#/train';
    case 'exercise': return '#/library';
    case 'timer': return arg === 'tabata' ? '#/today' : '#/train/quick';
    case 'bio': return '#/train/quick';
    case 'routine': return ROUTINES.find((r) => r.id === arg)?.kind === 'physio' ? '#/train/recovery' : '#/train/quick';
    case 'biohack': case 'lesson': case 'supplements': return '#/learn';
    case 'checkin': case 'calendar': return '#/progress';
    case 'sync': return '#/profile';
    case 'recipe': return '#/meals/recipes';
    default: return '#/today';
  }
}

export function back() {
  if (stack.length > 1) { history.back(); return; }
  replacing = true;
  location.replace(parentOf(cur()));
}
