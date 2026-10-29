import './styles/main.css';
import { Showroom } from './core/Showroom';
import { cars, paintOptions } from './data/cars';
import { ShowroomUI } from './ui/ShowroomUI';
import type { CarConfig } from './types/car';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('找不到应用挂载节点 #app');

const ui = new ShowroomUI(app, cars);
const firstCar = cars[0];
ui.setCar(firstCar);

function supportsWebGL2(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

if (!supportsWebGL2()) {
  ui.setError('webglUnsupported', false);
} else {
  try {
    const showroom = new Showroom(ui.stage);
    ui.refreshLanguage();
    let latestSelection = 0;

    const showCar = async (car: CarConfig): Promise<void> => {
      const selection = ++latestSelection;
      ui.setCar(car);
      ui.setLoading();

      try {
        await showroom.loadCar(car, (progress) => {
          if (selection === latestSelection) ui.setLoading(progress);
        });
        if (selection !== latestSelection) return;
        if (car.materialVariants?.length) {
          const firstVariant = car.materialVariants[0].name;
          if (!showroom.setMaterialVariant(firstVariant)) {
            throw new Error('GLB 缺少预期原生材质变体：' + firstVariant);
          }
        } else {
          showroom.setPaintColor(paintOptions[0].value);
        }
        ui.setReady();
      } catch (error) {
        if (selection !== latestSelection) return;
        console.error('Vehicle model loading failed:', error);
        ui.setError('carLoadFailed');
      }
    };

    ui.onView((view) => showroom.setView(view));
    ui.onColor((mode, value) => mode === 'variant'
      ? showroom.setMaterialVariant(value)
      : showroom.setPaintColor(value));
    ui.onReset(() => showroom.setView('default'));
    ui.onRetry(() => {
      const car = cars.find((item) => item.id === currentCarId) ?? firstCar;
      void showCar(car);
    });

    let currentCarId = firstCar.id;
    ui.onCar((id) => {
      const car = cars.find((item) => item.id === id);
      if (!car || currentCarId === id) return;
      currentCarId = id;
      void showCar(car);
    });

    ui.onFullscreen(() => {
      const request = document.fullscreenElement
        ? document.exitFullscreen()
        : app.requestFullscreen();
      void request.catch(() => {
        // 全屏可被浏览器策略拒绝，不影响 3D 浏览。
      });
    });
    document.addEventListener('fullscreenchange', () => {
      ui.setFullscreenActive(!!document.fullscreenElement);
    });
    window.addEventListener('pagehide', () => showroom.dispose(), { once: true });

    void showCar(firstCar);
  } catch (error) {
    console.error('3D renderer initialization failed:', error);
    ui.setError('rendererFailed', false);
  }
}
