/**
 * 收藏夹界面交互模块
 * 负责从浏览器读取书签树并筛选出有效书签文件夹，动态生成和渲染右侧的展示面板，并绑定展开事件。
 */
import { colorMap } from './config.js';
import { openFolderAsGroup } from './syncActions.js';

export async function loadBookmarks() {
  const container = document.getElementById('bookmarks-list');
  container.innerHTML = '<div class="empty-state">Loading...</div>';

  try {
    // 获取书签栏和其他书签中的所有直接子文件夹
    const barTree = await chrome.bookmarks.getSubTree('1'); // 书签栏
    const otherTree = await chrome.bookmarks.getSubTree('2'); // 其他书签
    
    const barChildren = barTree[0]?.children || [];
    const otherChildren = otherTree[0]?.children || [];
    const allTopChildren = [...barChildren, ...otherChildren];

    if (allTopChildren.length === 0) {
      container.innerHTML = '<div class="empty-state">📭 收藏夹为空</div>';
      return;
    }

    container.innerHTML = '';
    // 列出所有顶层文件夹
    const folders = allTopChildren.filter(c => !c.url);

    for (const folder of folders) {
      const bookmarkCount = folder.children ? folder.children.filter(c => c.url).length : 0;
      if (bookmarkCount === 0) continue; // 跳过空文件夹以保持界面整洁
      
      const card = document.createElement('div');
      card.className = 'item-card';

      const header = document.createElement('div');
      header.className = 'item-header';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'item-title';
      
      // 尝试解析并提取出可能的标签组颜色标识
      let displayTitle = folder.title;
      let colorHint = null;
      const colorMatch = folder.title.match(/\[([a-z]+)\]/);
      if (colorMatch && colorMap[colorMatch[1]]) {
        colorHint = colorMatch[1];
        displayTitle = displayTitle.replace(`[${colorHint}]`, '').trim();
      }

      const starIcon = document.createElement('span');
      starIcon.className = 'star-icon';
      starIcon.innerHTML = '☆';
      starIcon.style.color = colorHint ? colorMap[colorHint] : 'var(--text-muted)';

      const titleText = document.createElement('span');
      titleText.className = 'title-text';
      titleText.textContent = displayTitle;
      titleText.title = displayTitle; // 鼠标悬浮时显示完整标题

      titleDiv.appendChild(starIcon);
      titleDiv.appendChild(titleText);

      const statsDiv = document.createElement('div');
      statsDiv.className = 'item-stats';
      statsDiv.textContent = `${bookmarkCount} 书签`;

      header.appendChild(titleDiv);
      header.appendChild(statsDiv);

      const actionBtn = document.createElement('button');
      actionBtn.className = 'action-btn';
      actionBtn.title = '展开为新组';
      actionBtn.innerHTML = '<span style="display:flex; align-items:center; gap:4px;"><span>➔</span><span class="color-dot" style="background-color:#bdc1c6; transition:transform 0.2s ease;"></span></span>';
      actionBtn.addEventListener('click', (event) => openFolderAsGroup(folder, colorHint, event));

      header.appendChild(actionBtn); // 在 .item-header 内部显示为内联元素

      card.appendChild(header);
      container.appendChild(card);
    }
    
    if (container.innerHTML === '') {
      container.innerHTML = '<div class="empty-state">📭 无包含书签的文件夹</div>';
    }
  } catch (err) {
    container.innerHTML = `<div class="empty-state">读取出错: ${err.message}</div>`;
  }
}
