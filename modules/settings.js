/**
 * 设置管理模块
 * 负责初始化、读取和保存用户在界面上的各项设置（如删除标签页、清理收藏夹、卡组排列位置等），并将它们同步至 localStorage。
 */
export function initSettings() {
  const delTabsCheck = document.getElementById('setting-del-tabs');
  const delBksCheck = document.getElementById('setting-del-bks');

  // Load settings (default false)
  delTabsCheck.checked = localStorage.getItem('delTabs') === 'true';
  delBksCheck.checked = localStorage.getItem('delBks') === 'true';

  // Save on change
  delTabsCheck.addEventListener('change', (e) => localStorage.setItem('delTabs', e.target.checked));
  delBksCheck.addEventListener('change', (e) => localStorage.setItem('delBks', e.target.checked));

  if (document.getElementById('ungroup-placement-toggle')) {
    // Ungroup Placement Setting
    const ungroupToggle = document.getElementById('ungroup-placement-toggle');
    if (localStorage.getItem('ungroupFirst') === 'true') {
      ungroupToggle.classList.add('toggled');
    }
    ungroupToggle.addEventListener('click', () => {
      ungroupToggle.classList.toggle('toggled');
      localStorage.setItem('ungroupFirst', ungroupToggle.classList.contains('toggled'));
    });
  }
}

export function isDeleteTabsEnabled() {
  return document.getElementById('setting-del-tabs').checked;
}

export function isDeleteBookmarksEnabled() {
  return document.getElementById('setting-del-bks').checked;
}

export function isUngroupFirst() {
  return document.getElementById('ungroup-placement-toggle').classList.contains('toggled');
}
