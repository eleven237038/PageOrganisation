/**
 * 主入口模块
 * 程序初始化入口点，负责在页面加载完毕后绑定所有界面核心事件并初始化加载面板数据和小组件。
 */
import { initSettings } from './modules/settings.js';
import { loadTabGroups } from './modules/tabGroupsUi.js';
import { loadBookmarks } from './modules/bookmarksUi.js';
import { executeSort, setSortMode } from './modules/sortActions.js';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refresh-groups').addEventListener('click', loadTabGroups);
  document.getElementById('refresh-bookmarks').addEventListener('click', loadBookmarks);

  initSettings();

  if (document.getElementById('sort-groups')) {
    document.getElementById('sort-groups').addEventListener('click', executeSort);
    document.getElementById('sort-count').addEventListener('click', () => setSortMode('count'));
    document.getElementById('sort-alpha').addEventListener('click', () => setSortMode('alpha'));
    document.getElementById('sort-custom').addEventListener('click', () => setSortMode('custom'));

    // 排序菜单悬浮延迟逻辑
    const sortDropdownContainer = document.querySelector('.sort-dropdown-container');
    let sortMenuTimeout;
    
    sortDropdownContainer.addEventListener('mouseenter', () => {
      clearTimeout(sortMenuTimeout);
      sortDropdownContainer.classList.add('show-menu');
    });
    
    sortDropdownContainer.addEventListener('mouseleave', () => {
      sortMenuTimeout = setTimeout(() => {
        sortDropdownContainer.classList.remove('show-menu');
      }, 300); // 0.3秒延迟
    });
  }

  loadTabGroups();
  loadBookmarks();
});
