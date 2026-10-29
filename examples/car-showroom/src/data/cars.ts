import type { CarConfig } from '../types/car';

/**
 * 第一辆展示经署名许可和商标清理的 Car Concept GLB。
 * 它是独立概念车，不代表 Porsche、Ferrari 等品牌获得授权。
 * 程序化概念车仍保留，方便诊断和低资源开发。
 */
export const cars: readonly CarConfig[] = [
  {
    id: 'car-concept',
    brand: 'OPEN 3D SHOWCASE',
    name: 'CAR CONCEPT',
    designation: {
      zh: '01 / 高精度概念跑车',
      en: '01 / HIGH-FIDELITY CONCEPT',
    },
    description: {
      zh: '来自 Khronos glTF Sample Assets 的高精度概念跑车，具有精细内饰、玻璃和真实 PBR 车漆。它是开放授权的技术展示模型，并非汽车制造商品牌授权车型。',
      en: 'A high-fidelity concept sports car from Khronos glTF Sample Assets, featuring detailed interiors, glazing and physically based paint. This is a licensed technical sample, not a car manufacturer’s officially endorsed model.',
    },
    modelUrl: `${import.meta.env.BASE_URL}models/car-concept.glb`,
    modelKind: 'gltf',
    paintMaterialNames: ['Paint 1 Carmine', 'Paint 2 Carmine'],
    materialVariants: [
      { name: 'Carmine Candy', label: { zh: '糖果胭脂红', en: 'Carmine Candy' }, swatch: '#9b283a' },
      { name: 'Pearly Swirly', label: { zh: '珍珠银白', en: 'Pearly Swirly' }, swatch: '#e6e3d8' },
      { name: 'Torched Graphite', label: { zh: '石墨深灰', en: 'Torched Graphite' }, swatch: '#42474c' },
    ],
    attribution: {
      zh: '模型和贴图：Eric Chadwick / Darmstadt Graphics Group GmbH，CC BY 4.0；本项目已去除 Khronos 商标显示内容。',
      en: 'Model and textures: Eric Chadwick / Darmstadt Graphics Group GmbH, CC BY 4.0. Khronos trademark graphics were removed for this demo.',
    },
    sourceUrl: 'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
  {
    id: 'concept-s1',
    brand: 'CAR ATELIER',
    name: 'AURORA S1',
    designation: {
      zh: '02 / 程序化工程样车',
      en: '02 / PROCEDURAL STUDY',
    },
    description: {
      zh: '用于验证 Three.js 展厅、镜头控制、灯光和车漆切换的概念样车。正式名车模型将在取得合适授权后接入。',
      en: 'A concept vehicle used to demonstrate the Three.js showroom, camera controls, lighting and paint finishes. Licensed production car models will be added later.',
    },
    modelUrl: null,
    modelKind: 'procedural',
    paintMaterialNames: ['carPaint'],
    attribution: {
      zh: '程序化几何体，由本项目代码生成。',
      en: 'Procedural geometry created by this project.',
    },
  },
];

export const paintOptions = [
  { name: '烈焰红', nameEn: 'Flame Red', value: '#b82e35' },
  { name: '曜石黑', nameEn: 'Obsidian Black', value: '#171b25' },
  { name: '极光银', nameEn: 'Aurora Silver', value: '#9daebd' },
  { name: '深海蓝', nameEn: 'Deep Ocean Blue', value: '#234b79' },
] as const;
