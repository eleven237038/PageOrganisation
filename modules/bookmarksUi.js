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
    // Get all immediate folders from Bookmarks Bar and Other Bookmarks
    const barTree = await chrome.bookmarks.getSubTree('1'); // Bookmark Bar
    const otherTree = await chrome.bookmarks.getSubTree('2'); // Other Bookmarks
    
    const barChildren = barTree[0]?.children || [];
    const otherChildren = otherTree[0]?.children || [];
    const allTopChildren = [...barChildren, ...otherChildren];

    if (allTopChildren.length === 0) {
      container.innerHTML = '<div class="empty-state">📭 收藏夹为空</div>';
      return;
    }

    container.innerHTML = '';
    // List all top level folders
    const folders = allTopChildren.filter(c => !c.url);

    for (const folder of folders) {
      const bookmarkCount = folder.children ? folder.children.filter(c => c.url).length : 0;
      if (bookmarkCount === 0) continue; // Skip empty folders to show cleaner UI
      
      const card = document.createElement('div');
      card.className = 'item-card';

      const header = document.createElement('div');
      header.className = 'item-header';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'item-title';
      
      // Attempt to parse out group color
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
      titleText.title = displayTitle; // Show full title on hover

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
      actionBtn.innerHTML = '➔⚪';
      actionBtn.addEventListener('click', (event) => openFolderAsGroup(folder, colorHint, event));

      header.appendChild(actionBtn); // Inline inside .item-header

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
