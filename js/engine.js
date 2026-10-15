export const STORAGE_KEY = 'excel-quest-v3';

export const loadProgress = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { level: 0, unlocked: 0, xp: 0, completed: 0, life: 3, studentName: '', studentClass: '', soundOn: true };
    const parsed = JSON.parse(raw);
    return {
      level: Number(parsed.level) || 0,
      unlocked: Number(parsed.unlocked) || 0,
      xp: Number(parsed.xp) || 0,
      completed: Number(parsed.completed) || 0,
      life: Number(parsed.life) || 3,
      studentName: parsed.studentName || '',
      studentClass: parsed.studentClass || '',
      soundOn: parsed.soundOn !== false
    };
  } catch (error) {
    console.warn('Unable to load progress', error);
    return { level: 0, unlocked: 0, xp: 0, completed: 0, life: 3, studentName: '', studentClass: '', soundOn: true };
  }
};

export const saveProgress = (progress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch (error) {
    console.warn('Unable to save progress', error);
    return false;
  }
};

export const exportProgress = () => JSON.stringify(loadProgress());

export const importProgress = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return false;
    saveProgress({ ...loadProgress(), ...parsed });
    return true;
  } catch (error) {
    console.warn('Unable to import progress', error);
    return false;
  }
};
