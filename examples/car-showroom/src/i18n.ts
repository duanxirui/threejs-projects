export type Language = 'zh' | 'en';

const zh = {
  tagline: '数字汽车展厅',
  showroom: '互动展厅',
  vehicleInfo: '车辆信息',
  vehicleControls: '视角与车漆',
  vehicleList: '车型列表',
  scrollCarsPrev: '向左滚动车型列表',
  scrollCarsNext: '向右滚动车型列表',
  showroomTools: '展厅工具',
  closePanel: '关闭面板',
  displayModel: '展示模型',
  status: '当前状态',
  preview: '开发预览',
  procedural: '程序化 3D',
  gltf: 'GLB / GLTF',
  cameraAngles: '相机视角',
  exteriorPaint: '原生外观配色',
  defaultView: '默认视角',
  frontView: '车头',
  sideView: '侧面',
  rearView: '车尾',
  resetView: '重置视角',
  currentExhibit: '当前展车',
  explore: '探索每一个角度',
  gestureHint: '拖动旋转 · 滚轮 / 双指缩放',
  prototype: '工程演示',
  madeWith: '基于 THREE.JS 构建',
  focusView: '纯净观车',
  showPanels: '显示面板',
  fullscreen: '进入全屏',
  exitFullscreen: '退出全屏',
  language: '切换语言',
  expand: '展开',
  collapse: '收起',
  modelScene: '可交互的三维车辆展示',
  modelCredit: '模型署名',
  sourceAsset: '模型来源',
  licenseTerms: '许可协议',
  paintColors: '车身颜色选项',
  loadingTitle: '正在准备展厅',
  loadingBody: '正在加载车辆与三维场景…',
  loadingAssets: '资源加载',
  retry: '重试加载',
  loadingError: '加载出现问题',
  startError: '无法启动 3D 展厅',
  webglUnsupported: '当前浏览器或显卡不支持 WebGL 2，请尝试使用最新版 Chrome、Edge 或 Safari。',
  carLoadFailed: '车辆资源加载失败，请重试或检查模型文件。',
  rendererFailed: '3D 渲染器初始化失败，请检查浏览器图形加速设置。',
} as const;

export type TranslationKey = keyof typeof zh;

const en: Record<TranslationKey, string> = {
  tagline: 'DIGITAL MOTOR GALLERY',
  showroom: 'INTERACTIVE SHOWROOM',
  vehicleInfo: 'Vehicle details',
  vehicleControls: 'Camera & paint',
  vehicleList: 'Vehicle collection',
  scrollCarsPrev: 'Scroll vehicle collection left',
  scrollCarsNext: 'Scroll vehicle collection right',
  showroomTools: 'Showroom controls',
  closePanel: 'Close panel',
  displayModel: 'DISPLAY MODEL',
  status: 'STATUS',
  preview: 'DEVELOPMENT PREVIEW',
  procedural: 'PROCEDURAL / 3D',
  gltf: 'GLB / GLTF',
  cameraAngles: 'CAMERA ANGLES',
  exteriorPaint: 'FACTORY FINISHES',
  defaultView: 'Default angle',
  frontView: 'Front',
  sideView: 'Side',
  rearView: 'Rear',
  resetView: 'Reset camera',
  currentExhibit: 'CURRENT EXHIBIT',
  explore: 'Explore every angle',
  gestureHint: 'Drag to rotate · Scroll / pinch to zoom',
  prototype: 'ENGINEERING PROTOTYPE',
  madeWith: 'BUILT WITH THREE.JS',
  focusView: 'Focus view',
  showPanels: 'Show panels',
  fullscreen: 'Enter fullscreen',
  exitFullscreen: 'Exit fullscreen',
  language: 'Switch language',
  expand: 'Expand',
  collapse: 'Collapse',
  modelScene: 'Interactive three-dimensional car display',
  modelCredit: 'MODEL CREDITS',
  sourceAsset: 'Model source',
  licenseTerms: 'License terms',
  paintColors: 'Exterior paint options',
  loadingTitle: 'Preparing the showroom',
  loadingBody: 'Loading the vehicle and 3D scene…',
  loadingAssets: 'LOADING ASSETS',
  retry: 'Retry loading',
  loadingError: 'Unable to load',
  startError: 'Unable to start 3D showroom',
  webglUnsupported: 'Your browser or graphics device does not support WebGL 2. Try the latest Chrome, Edge or Safari.',
  carLoadFailed: 'The vehicle could not be loaded. Please retry or check the model file.',
  rendererFailed: 'Failed to initialize the 3D renderer. Check your browser hardware acceleration settings.',
};

export function t(language: Language, key: TranslationKey): string {
  return language === 'zh' ? zh[key] : en[key];
}

export function preferredLanguage(): Language {
  try {
    const saved = window.localStorage.getItem('car-atelier-language');
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    // Private browsing can disable local storage.
  }
  return 'zh';
}

export function saveLanguage(language: Language): void {
  try {
    window.localStorage.setItem('car-atelier-language', language);
  } catch {
    // Language selection still works for the current session.
  }
}
