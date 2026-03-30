/**
 * 排序功能模块
 * 负责管理标签页组的排序方式（按数量、按首字母或自定义拖拽），并执行更新浏览器中标签页位置和界面更新的逻辑。
 */
import { state, setSortModeState } from './state.js';
import { isUngroupFirst } from './settings.js';
import { loadTabGroups } from './tabGroupsUi.js';

export function setSortMode(mode) {
  setSortModeState(mode);
  document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`sort-${mode}`).classList.add('active');
  
  const listContainer = document.getElementById('tab-groups-list');
  if (mode === 'custom') {
    listContainer.classList.add('drag-mode');
  } else {
    listContainer.classList.remove('drag-mode');
  }
}

export async function executeSort(event) {
  if (state.currentSortMode === 'custom') return; // 自定义模式为手动拖拽
  
  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.innerHTML = '⌛';

  try {
    const windowId = chrome.windows.WINDOW_ID_CURRENT;

    // 如果在排序标签组之前启用了开关，则处理未分组标签页的位置
    const ungroupFirst = isUngroupFirst();
    const ungroupedTabs = await chrome.tabs.query({ windowId, groupId: chrome.tabGroups.TAB_GROUP_ID_NONE });
    const ungroupedTabIds = ungroupedTabs.map(t => t.id);
    
    if (ungroupedTabIds.length > 0 && ungroupFirst) {
      // 在将标签组移动到末尾之前，移动到最前面
      await chrome.tabs.move(ungroupedTabIds, { index: 0 });
    }

    const groups = await chrome.tabGroups.query({ windowId });
    if (groups.length > 1) {
      const groupData = [];
      for (const group of groups) {
        const tabs = await chrome.tabs.query({ groupId: group.id });
        groupData.push({ group, count: tabs.length });
      }

      if (state.currentSortMode === 'count') {
        groupData.sort((a, b) => b.count - a.count);
      } else if (state.currentSortMode === 'alpha') {
        groupData.sort((a, b) => (a.group.title || '').localeCompare(b.group.title || '', 'zh-CN'));
      }

      for (const data of groupData) {
        await chrome.tabGroups.move(data.group.id, { index: -1 });
      }
    }

    if (ungroupedTabIds.length > 0 && !ungroupFirst) {
      // 在标签组之后移动到最后面
      await chrome.tabs.move(ungroupedTabIds, { index: -1 });
    }

    loadTabGroups(); // 刷新界面
    btn.innerHTML = '✔️';

  } catch (error) {
    console.error("Sort failed:", error);
    btn.innerHTML = '❌';
  } finally {
    setTimeout(() => {
      btn.innerHTML = originalText;
    }, 1500);
  }
}
