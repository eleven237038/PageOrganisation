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
    // Save to the Bookmarks Bar directly (id: '1', or '2' for Other Bookmarks)
    const parentFolderId = '1';
    
    // Use exactly the group's name, no timestamp or color wrapper
    const title = group.title || '未命名组';

    const groupFolder = await chrome.bookmarks.create({
      parentId: parentFolderId,
      title: title
    });

    // Save tabs
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

    // Success feedback
    loadBookmarks(); // update the right panel
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
    // Important: Edge respects active:false, but bulk layout might take MS
    for (const bm of bookmarks) {
      const tab = await chrome.tabs.create({ url: bm.url, active: false });
      tabIds.push(tab.id);
    }

    const groupId = await chrome.tabs.group({ tabIds });
    
    // Pure title is exactly the folder name now
    let pureTitle = folder.title;
    
    await chrome.tabGroups.update(groupId, {
      title: pureTitle,
      color: extractedColor || 'blue' 
    });

    if (isDeleteBookmarksEnabled()) {
      await chrome.bookmarks.removeTree(folder.id);
    }

    // Make the first tab active
    if (tabIds.length > 0) {
      chrome.tabs.update(tabIds[0], { active: true });
    }

    loadTabGroups(); // Update the left panel
    loadBookmarks(); // Update the right panel because we might have deleted a folder
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
