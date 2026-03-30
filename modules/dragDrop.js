/**
 * 拖拽功能模块
 * 实现卡片的自定义拖拽排序交互。包含拖拽开始、拖动中、拖拽结束的 DOM 渲染逻辑，以及调用浏览器 tabGroups API 实时同步标签页顺序。
 */
import { state, setDraggedElement } from './state.js';
import { isUngroupFirst } from './settings.js';

export function handleDragStart(e) {
  if (state.currentSortMode !== 'custom') {
    e.preventDefault();
    return;
  }
  setDraggedElement(this);
  e.dataTransfer.effectAllowed = 'move';
  this.classList.add('dragging');
}

export function handleDragOver(e) {
  if (state.currentSortMode !== 'custom') return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const container = document.getElementById('tab-groups-list');
  const afterElement = getDragAfterElement(container, e.clientY);
  if (afterElement == null) {
    container.appendChild(state.draggedElement);
  } else {
    container.insertBefore(state.draggedElement, afterElement);
  }
}

export async function handleDragEnd(e) {
  if (state.currentSortMode !== 'custom') return;
  this.classList.remove('dragging');
  setDraggedElement(null);
  
  // Real-time synchronization to browser
  const cards = document.querySelectorAll('#tab-groups-list .item-card');
  for (const card of cards) {
    const groupId = parseInt(card.dataset.groupId, 10);
    // Setting index to -1 moves it sequentially to the end
    await chrome.tabGroups.move(groupId, { index: -1 });
  }
  
  // Enforce ungrouped placement
  const windowId = chrome.windows.WINDOW_ID_CURRENT;
  const ungroupFirst = isUngroupFirst();
  const ungroupedTabs = await chrome.tabs.query({ windowId, groupId: chrome.tabGroups.TAB_GROUP_ID_NONE });
  const ungroupedTabIds = ungroupedTabs.map(t => t.id);
  
  if (ungroupedTabIds.length > 0) {
    if (ungroupFirst) {
      await chrome.tabs.move(ungroupedTabIds, { index: 0 });
    } else {
      await chrome.tabs.move(ungroupedTabIds, { index: -1 });
    }
  }
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.item-card:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
