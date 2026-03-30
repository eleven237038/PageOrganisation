/**
 * 同步操作模块
 * 包含核心的转换功能：将标签组保存为收藏夹、将收藏夹展开为标签组，并在成功后触发对应的数据界面更新。
 */
import { isDeleteTabsEnabled, isDeleteBookmarksEnabled } from './settings.js';
import { loadBookmarks } from './bookmarksUi.js';
import { loadTabGroups } from './tabGroupsUi.js';

export async function saveGroupToBookmark(group, tabs, event) {
  const btn = event.currentTarget;
  const originalText = btn.innerHTML;
  btn.innerHTML = '保存中...';
  btn.classList.add('success');

  try {
    // 直接保存到书签栏 (id: '1', 或 '2' 代表其他书签)
    const parentFolderId = '1';
    
    // 直接使用标签组名称，不包含时间戳或颜色包裹符
    const title = group.title || '未命名组';

    const groupFolder = await chrome.bookmarks.create({
      parentId: parentFolderId,
      title: title
    });

    // 保存标签页
    for (const tab of tabs) {
      if (tab.url) {
        await chrome.bookmarks.create({
          parentId: groupFolder.id,
          title: tab.title,
          url: tab.url
        });
      }
    }

    if (isDeleteTabsEnabled()) {
      const tabIds = tabs.map(t => t.id);
      await chrome.tabs.remove(tabIds);
    }

    // 成功反馈
    loadBookmarks(); // 更新右侧面板
    btn.innerHTML = '✔️ 已保存';
    
  } catch (error) {
    console.error('Convert to bookmark failed', error);
    btn.innerHTML = '❌ 转换失败';
  } finally {
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('success');
    }, 2000);
  }
}

export async function openFolderAsGroup(folder, extractedColor, event) {
  if (!folder.children) return;
  const bookmarks = folder.children.filter(c => c.url);
  if (bookmarks.length === 0) return;

  const btn = event.currentTarget;
  const originalText = btn.innerHTML;
  btn.innerHTML = '展开中...';
  btn.classList.add('success');

  try {
    const tabIds = [];
    // 重要：Edge 浏览器遵循 active:false 参数，但批量渲染布局可能需要一定时间
    for (const bm of bookmarks) {
      const tab = await chrome.tabs.create({ url: bm.url, active: false });
      tabIds.push(tab.id);
    }

    const groupId = await chrome.tabs.group({ tabIds });
    
    // 纯净标题现在就是文件夹的确切名称
    let pureTitle = folder.title;
    
    await chrome.tabGroups.update(groupId, {
      title: pureTitle,
      color: extractedColor || 'blue' 
    });

    if (isDeleteBookmarksEnabled()) {
      await chrome.bookmarks.removeTree(folder.id);
    }

    // 激活第一个标签页
    if (tabIds.length > 0) {
      chrome.tabs.update(tabIds[0], { active: true });
    }

    loadTabGroups(); // 更新左侧面板
    loadBookmarks(); // 更新右侧面板，因为我们可能已将其删除
    btn.innerHTML = '✔️ 展开成功';

  } catch (error) {
    console.error('Open folder as group failed', error);
    btn.innerHTML = '❌ 展开失败';
  } finally {
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('success');
    }, 2000);
  }
}
