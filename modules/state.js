/**
 * 状态管理模块
 * 集中管理应用级的全局共享状态，如当前排序模式、正在被拖拽的 DOM 元素等。
 */
export const state = {
  currentSortMode: 'count',
  draggedElement: null
};

export function setSortModeState(mode) {
  state.currentSortMode = mode;
}

export function setDraggedElement(el) {
  state.draggedElement = el;
}
