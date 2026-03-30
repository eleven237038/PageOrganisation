/**
 * 标签页组界面交互模块
 * 负责从浏览器查询当前的标签页组数据，并动态生成和渲染左侧展示面板，同时绑定对应的拖拽、点击事件。
 */
import { colorMap } from './config.js';
import { handleDragStart, handleDragOver, handleDragEnd } from './dragDrop.js';
import { saveGroupToBookmark } from './syncActions.js';

export async function loadTabGroups() {
  const container = document.getElementById('tab-groups-list');
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  try {
    const windowId = chrome.windows.WINDOW_ID_CURRENT;
    const groups = await chrome.tabGroups.query({ windowId });

    if (groups.length === 0) {
      container.innerHTML = '<div class="empty-state">📝 当前窗口没有标签页组<br><small style="margin-top:8px;opacity:0.7">在 Edge 中右键标签页添加一个吧！</small></div>';
      return;
    }

    container.innerHTML = '';

    for (const group of groups) {
      const tabs = await chrome.tabs.query({ groupId: group.id });
      const card = document.createElement('div');
      card.className = 'item-card';

      const header = document.createElement('div');
      header.className = 'item-header';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'item-title';
      
      const colorDot = document.createElement('span');
      colorDot.className = 'color-dot';
      colorDot.style.backgroundColor = colorMap[group.color] || '#808080';

      const titleText = document.createElement('span');
      titleText.className = 'title-text';
      const displayTitle = group.title || '未命名组';
      titleText.textContent = displayTitle;
      titleText.title = displayTitle; // Show full title on hover

      titleDiv.appendChild(colorDot);
      titleDiv.appendChild(titleText);

      const statsDiv = document.createElement('div');
      statsDiv.className = 'item-stats';
      statsDiv.textContent = `${tabs.length} 个标签`;

      header.appendChild(titleDiv);
      header.appendChild(statsDiv);

      const actionBtn = document.createElement('button');
      actionBtn.className = 'action-btn';
      actionBtn.title = '转换为收藏夹';
      actionBtn.innerHTML = '➔☆';
      actionBtn.addEventListener('click', (event) => saveGroupToBookmark(group, tabs, event));

      header.appendChild(actionBtn); // Inline inside .item-header

      // Drag handle for custom sort mode
      const dragHandle = document.createElement('div');
      dragHandle.className = 'drag-handle';
      dragHandle.innerHTML = '≡';
      dragHandle.title = "按住上下拖动排列顺序";

      card.appendChild(dragHandle);
      card.appendChild(header);

      // Make card draggable
      card.draggable = true;
      card.dataset.groupId = group.id;
      card.addEventListener('dragstart', handleDragStart);
      card.addEventListener('dragover', handleDragOver);
      card.addEventListener('dragend', handleDragEnd);

      container.appendChild(card);
    }
  } catch (err) {
    container.innerHTML = `<div class="empty-state">读取出错: ${err.message}</div>`;
  }
}
