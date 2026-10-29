import type { CameraView, CarConfig, LoadProgress, LocalizedText } from '../types/car';
import { paintOptions } from '../data/cars';
import { icon, type IconName } from './icons';
import {
  preferredLanguage,
  saveLanguage,
  t,
  type Language,
  type TranslationKey,
} from '../i18n';

type Panel = 'info' | 'controls' | 'collection';
type ErrorMessage = 'webglUnsupported' | 'carLoadFailed' | 'rendererFailed';
type ViewHandler = (view: CameraView) => void;
type ColorHandler = (mode: 'variant' | 'color', value: string) => boolean;
type CarHandler = (carId: string) => void;

interface AppearanceChoice {
  mode: 'variant' | 'color';
  value: string;
  swatch: string;
  label: LocalizedText;
}

const panelLabels: Record<Panel, TranslationKey> = {
  info: 'vehicleInfo',
  controls: 'vehicleControls',
  collection: 'vehicleList',
};

/** Keeps language and collapsible overlay state separate from the 3D renderer. */
export class ShowroomUI {
  readonly stage: HTMLElement;

  private readonly root: HTMLElement;
  private readonly cars: readonly CarConfig[];
  private readonly overlay: HTMLElement;
  private readonly progressBar: HTMLElement;
  private readonly progressValue: HTMLElement;
  private readonly loadTitle: HTMLElement;
  private readonly loadMessage: HTMLElement;
  private readonly retryButton: HTMLButtonElement;
  private readonly carSelector: HTMLElement;
  private readonly carScrollViewport: HTMLElement;
  private readonly carScrollControls: HTMLElement;
  private readonly carScrollTrack: HTMLElement;
  private readonly carScrollThumb: HTMLElement;
  private readonly carScrollPrev: HTMLButtonElement;
  private readonly carScrollNext: HTMLButtonElement;

  private language: Language = preferredLanguage();
  private currentCar: CarConfig | null = null;
  private openPanel: Panel | null = null;
  private focusMode = false;
  private fullscreen = false;
  private fatalError = false;
  private loadingState: 'loading' | 'ready' | 'error' = 'loading';
  private errorMessage: ErrorMessage = 'carLoadFailed';

  constructor(root: HTMLElement, cars: readonly CarConfig[]) {
    this.root = root;
    this.cars = cars;
    root.innerHTML = [
      '<div class="showroom-app" id="showroom-app">',
      '  <div class="scene-layer" id="scene-layer"></div>',
      '  <div class="scene-vignette" aria-hidden="true"></div>',
      '  <div class="scene-grain" aria-hidden="true"></div>',
      '  <header class="site-header">',
      '    <a class="brand" href="' + import.meta.env.BASE_URL + '" aria-label="CAR ATELIER">',
      '      <span class="brand-symbol" aria-hidden="true">' + icon('brand') + '</span>',
      '      <span class="brand-copy"><strong>CAR ATELIER</strong><small data-i18n="tagline"></small></span>',
      '    </a>',
      '    <div class="header-right">',
      '      <div class="session-label"><span class="status-dot"></span><span data-i18n="showroom"></span> <b>/ ' + String(cars.length).padStart(3, '0') + '</b></div>',
      '      <button class="header-button focus-button" type="button" data-action="focus" aria-pressed="false">',
      '        ' + icon('eye'),
      '        <span class="focus-label" data-i18n="focusView"></span>',
      '      </button>',
      '      <div class="language-switch" role="group" data-i18n-aria-label="language">',
      '        <span class="language-glyph" aria-hidden="true">' + icon('globe') + '</span>',
      '        <button type="button" class="language-option" data-language="zh" lang="zh-CN">中</button>',
      '        <button type="button" class="language-option" data-language="en" lang="en">EN</button>',
      '      </div>',
      '      <button class="icon-button fullscreen-button" type="button" data-action="fullscreen">',
      '        ' + icon('expand'),
      '      </button>',
      '    </div>',
      '  </header>',
      '  <div class="frame-index" aria-hidden="true"><span data-i18n="currentExhibit"></span> <strong id="exhibit-index">01</strong></div>',
      '  <div class="showroom-console" id="showroom-console" data-open-panel="">',
      '  <main class="hero-copy panel-shell console-panel" data-panel-shell="info" aria-labelledby="console-title-info" hidden>',
      '    <div class="console-panel-head">',
      '      <h2 id="console-title-info">' + icon('info') + '<span data-i18n="vehicleInfo"></span></h2>',
      '      <button class="console-close" type="button" data-panel-close data-i18n-aria-label="closePanel">' + icon('close') + '</button>',
      '    </div>',
      '    <div class="panel-body" id="info-panel-content" hidden>',
      '      <div class="eyebrow"><span class="eyebrow-line"></span><span id="car-designation"></span></div>',
      '      <div class="hero-overline" id="car-brand"></div>',
      '      <h1 id="car-name"></h1>',
      '      <p id="car-description"></p>',
      '      <div class="hero-rule"></div>',
      '      <div class="meta-pair"><span data-i18n="displayModel"></span><strong id="model-type"></strong></div>',
      '      <div class="meta-pair"><span data-i18n="status"></span><strong data-i18n="preview"></strong></div>',
      '      <section class="model-credits" id="car-credits" aria-labelledby="credit-heading">',
      '        <div class="credit-heading" id="credit-heading" data-i18n="modelCredit"></div>',
      '        <p id="car-attribution"></p>',
      '        <div class="credit-links">',
      '          <a id="car-source" target="_blank" rel="noopener noreferrer" data-i18n="sourceAsset"></a>',
      '          <a id="car-license" target="_blank" rel="noopener noreferrer" data-i18n="licenseTerms"></a>',
      '        </div>',
      '      </section>',
      '    </div>',
      '  </main>',
      '  <aside class="tool-panel panel-shell console-panel" data-panel-shell="controls" aria-labelledby="console-title-controls" hidden>',
      '    <div class="console-panel-head">',
      '      <h2 id="console-title-controls">' + icon('controls') + '<span data-i18n="vehicleControls"></span></h2>',
      '      <button class="console-close" type="button" data-panel-close data-i18n-aria-label="closePanel">' + icon('close') + '</button>',
      '    </div>',
      '    <div class="panel-body" id="controls-panel-content" hidden>',
      '      <div class="panel-heading">' + icon('camera') + '<span data-i18n="cameraAngles"></span></div>',
      '      <div class="view-buttons">',
      '        <button class="view-button is-active" type="button" data-view="default" aria-pressed="true"><span data-i18n="defaultView"></span>' + icon('orbit') + '</button>',
      '        <button class="view-button" type="button" data-view="front" aria-pressed="false"><span data-i18n="frontView"></span>' + icon('front') + '</button>',
      '        <button class="view-button" type="button" data-view="side" aria-pressed="false"><span data-i18n="sideView"></span>' + icon('side') + '</button>',
      '        <button class="view-button" type="button" data-view="rear" aria-pressed="false"><span data-i18n="rearView"></span>' + icon('rear') + '</button>',
      '      </div>',
      '      <div class="panel-separator"></div>',
      '      <div class="panel-heading">' + icon('palette') + '<span data-i18n="exteriorPaint"></span></div>',
      '      <div class="swatches" id="paint-options" role="group" data-i18n-aria-label="paintColors"></div>',
      '      <div class="paint-selection" id="paint-selection" aria-live="polite"></div>',
      '      <button class="reset-button" type="button" data-action="reset">' + icon('reset') + '<span data-i18n="resetView"></span></button>',
      '    </div>',
      '  </aside>',
      '  <section class="bottom-dock panel-shell console-panel" data-panel-shell="collection" aria-labelledby="console-title-collection" hidden>',
      '    <div class="console-panel-head">',
      '      <h2 id="console-title-collection">' + icon('collection') + '<span data-i18n="vehicleList"></span></h2>',
      '      <span class="collection-current" id="collection-current"></span>',
      '      <button class="console-close" type="button" data-panel-close data-i18n-aria-label="closePanel">' + icon('close') + '</button>',
      '    </div>',
      '    <div class="panel-body dock-body" id="collection-panel-content" hidden>',
      '      <div class="dock-left">',
      '        <span class="dock-kicker" data-i18n="currentExhibit"></span>',
      '        <div class="car-selector-viewport" id="car-selector-viewport">',
      '          <div class="car-selector" id="car-selector" role="group" data-i18n-aria-label="vehicleList"></div>',
      '        </div>',
      '        <div class="car-scroll-controls" id="car-scroll-controls" hidden>',
      '          <button class="car-scroll-step" type="button" data-car-scroll="prev" data-i18n-aria-label="scrollCarsPrev">' + icon('chevron-left') + '</button>',
      '          <div class="car-scroll-track" id="car-scroll-track" aria-hidden="true"><span class="car-scroll-thumb" id="car-scroll-thumb"></span></div>',
      '          <button class="car-scroll-step" type="button" data-car-scroll="next" data-i18n-aria-label="scrollCarsNext">' + icon('chevron-right') + '</button>',
      '        </div>',
      '      </div>',
      '      <div class="dock-divider"></div>',
      '      <div class="dock-right">',
      '        <div class="gesture-icon" aria-hidden="true">' + icon('move') + '</div>',
      '        <div><strong data-i18n="explore"></strong><span data-i18n="gestureHint"></span></div>',
      '      </div>',
      '    </div>',
      '  </section>',
      '    <nav class="console-nav" role="group" data-i18n-aria-label="showroomTools">',
      '      <button class="console-tab" type="button" data-panel-toggle="info" aria-expanded="false" aria-controls="info-panel-content">' + icon('info') + '<span data-i18n="vehicleInfo"></span></button>',
      '      <button class="console-tab" type="button" data-panel-toggle="controls" aria-expanded="false" aria-controls="controls-panel-content">' + icon('controls') + '<span data-i18n="vehicleControls"></span></button>',
      '      <button class="console-tab" type="button" data-panel-toggle="collection" aria-expanded="false" aria-controls="collection-panel-content">' + icon('collection') + '<span data-i18n="vehicleList"></span></button>',
      '    </nav>',
      '  </div>',
      '  <div class="bottom-watermark" aria-hidden="true"><span data-i18n="prototype"></span><span>•</span><span data-i18n="madeWith"></span></div>',
      '  <div class="loading-overlay" id="loading-overlay" role="status" aria-live="polite">',
      '    <div class="loading-card">',
      '      <span class="loading-prefix">CAR ATELIER / SYSTEM</span>',
      '      <div class="loading-sigil" aria-hidden="true">' + icon('brand') + '</div>',
      '      <h2 id="load-title"></h2>',
      '      <p id="load-message"></p>',
      '      <div class="progress-track"><span id="progress-bar"></span></div>',
      '      <div class="progress-caption"><span data-i18n="loadingAssets"></span><strong id="progress-value">0%</strong></div>',
      '      <button class="retry-button" id="retry-button" type="button" hidden><span data-i18n="retry"></span>' + icon('arrow-up-right') + '</button>',
      '    </div>',
      '  </div>',
      '</div>',
    ].join('\n');

    const find = <T extends Element>(selector: string): T => {
      const element = root.querySelector<T>(selector);
      if (!element) throw new Error('Missing UI element: ' + selector);
      return element;
    };

    this.stage = find('#scene-layer');
    this.overlay = find('#loading-overlay');
    this.progressBar = find('#progress-bar');
    this.progressValue = find('#progress-value');
    this.loadTitle = find('#load-title');
    this.loadMessage = find('#load-message');
    this.retryButton = find('#retry-button');

    find<HTMLElement>('#paint-options');

    this.carSelector = find<HTMLElement>('#car-selector');
    this.carScrollViewport = find<HTMLElement>('#car-selector-viewport');
    this.carScrollControls = find<HTMLElement>('#car-scroll-controls');
    this.carScrollTrack = find<HTMLElement>('#car-scroll-track');
    this.carScrollThumb = find<HTMLElement>('#car-scroll-thumb');
    this.carScrollPrev = find<HTMLButtonElement>('[data-car-scroll="prev"]');
    this.carScrollNext = find<HTMLButtonElement>('[data-car-scroll="next"]');
    const selector = this.carSelector;
    for (const [index, car] of cars.entries()) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'car-card' + (index === 0 ? ' is-active' : '');
      button.dataset.carId = car.id;
      const number = document.createElement('span');
      number.className = 'car-card-number';
      number.textContent = String(index + 1).padStart(2, '0');
      const label = document.createElement('span');
      label.className = 'car-card-label';
      label.textContent = car.name;
      const arrow = document.createElement('span');
      arrow.className = 'car-card-arrow';
      arrow.innerHTML = icon('arrow-up-right');
      button.append(number, label, arrow);
      selector.appendChild(button);
    }

    selector.addEventListener('scroll', () => this.refreshCollectionScroll(), { passive: true });
    for (const button of [this.carScrollPrev, this.carScrollNext]) {
      button.addEventListener('click', () => {
        const direction = button === this.carScrollNext ? 1 : -1;
        const cardWidth = selector.querySelector<HTMLElement>('.car-card')?.offsetWidth ?? selector.clientWidth;
        const gap = parseFloat(getComputedStyle(selector).columnGap) || 0;
        selector.scrollBy({
          left: direction * (cardWidth + gap),
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
      });
    }
    const scrollObserver = new ResizeObserver(() => this.refreshCollectionScroll());
    scrollObserver.observe(selector);
    scrollObserver.observe(this.carScrollTrack);

    root.querySelectorAll<HTMLButtonElement>('[data-panel-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const panel = button.dataset.panelToggle as Panel;
        this.setOpenPanel(this.openPanel === panel ? null : panel);
      });
    });
    root.querySelectorAll<HTMLButtonElement>('[data-panel-close]').forEach((button) => {
      button.addEventListener('click', () => this.closePanel());
    });
    // The scene remains the primary interaction surface. A tap outside an
    // expanded panel returns to car viewing; Escape closes the same panel.
    this.stage.addEventListener('pointerdown', () => {
      if (this.openPanel !== null) this.setOpenPanel(null);
    });
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.openPanel !== null) {
        this.closePanel();
        event.stopPropagation();
      }
    });
    root.querySelector('[data-action="focus"]')?.addEventListener('click', () => {
      this.focusMode = !this.focusMode;
      this.refreshFocusMode();
    });
    root.querySelectorAll<HTMLButtonElement>('[data-language]').forEach((button) => {
      button.addEventListener('click', () => {
        const language = button.dataset.language;
        if (language === 'zh' || language === 'en') {
          this.setLanguage(language);
        }
      });
    });

    this.setOpenPanel(null);
    this.setLanguage(this.language, false);
  }

  /** Call after the renderer adds its canvas so its accessible label is translated. */
  refreshLanguage(): void {
    this.setLanguage(this.language, false);
  }

  setCar(car: CarConfig): void {
    this.currentCar = car;
    this.refreshCarDetails();
    this.text('#collection-current', car.name);
    this.root.querySelectorAll<HTMLButtonElement>('[data-car-id]').forEach((button) => {
      const active = button.dataset.carId === car.id;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    this.markView('default');
    this.renderAppearanceOptions();
    this.setControlsEnabled(
      (car.materialVariants?.length ?? 0) > 0
      || (car.paintMaterialNames?.length ?? 0) > 0,
    );
    this.text('#exhibit-index', String(Math.max(1, this.cars.indexOf(car) + 1)).padStart(2, '0'));
  }

  setLoading(progress?: LoadProgress): void {
    this.loadingState = 'loading';
    this.overlay.classList.remove('is-hidden', 'is-error');
    this.retryButton.hidden = true;
    const percent = progress?.total
      ? Math.max(0, Math.min(100, Math.round((progress.loaded / progress.total) * 100)))
      : null;
    this.progressBar.style.width = percent === null ? '32%' : percent + '%';
    this.progressBar.classList.toggle('is-indeterminate', percent === null);
    this.progressValue.textContent = percent === null ? '…' : percent + '%';
    this.refreshOverlayText();
  }

  setReady(): void {
    this.loadingState = 'ready';
    this.overlay.classList.add('is-hidden');
  }

  setError(message: ErrorMessage, canRetry = true): void {
    this.loadingState = 'error';
    this.errorMessage = message;
    this.fatalError = !canRetry;
    this.overlay.classList.remove('is-hidden');
    this.overlay.classList.add('is-error');
    this.progressBar.style.width = '0%';
    this.progressBar.classList.remove('is-indeterminate');
    this.progressValue.textContent = 'ERROR';
    this.retryButton.hidden = !canRetry;
    this.refreshOverlayText();
    if (!canRetry) {
      this.root.querySelectorAll<HTMLButtonElement>(
        '[data-view], [data-color], [data-car-id], [data-action="reset"]',
      ).forEach((button) => { button.disabled = true; });
    }
  }

  setControlsEnabled(paintEnabled: boolean): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-color]').forEach((button) => {
      button.disabled = !paintEnabled || this.fatalError;
    });
  }

  onView(handler: ViewHandler): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
      button.addEventListener('click', () => {
        const view = button.dataset.view as CameraView;
        this.markView(view);
        handler(view);
      });
    });
  }

  onColor(handler: ColorHandler): void {
    this.root.querySelector('#paint-options')?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>('[data-color]');
      if (!button || button.disabled) return;
      const value = button.dataset.color;
      const mode = button.dataset.appearanceMode;
      if (!value || (mode !== 'variant' && mode !== 'color')) return;
      if (handler(mode, value)) this.markColor(value);
    });
  }

  onCar(handler: CarHandler): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-car-id]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!button.dataset.carId) return;
        handler(button.dataset.carId);
        this.setOpenPanel(null);
      });
    });
  }

  onReset(handler: () => void): void {
    this.root.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
      this.markView('default');
      handler();
    });
  }

  onRetry(handler: () => void): void {
    this.retryButton.addEventListener('click', handler);
  }

  onFullscreen(handler: () => void): void {
    this.root.querySelector('[data-action="fullscreen"]')?.addEventListener('click', handler);
  }

  setFullscreenActive(active: boolean): void {
    this.fullscreen = active;
    const button = this.root.querySelector<HTMLButtonElement>('[data-action="fullscreen"]');
    if (!button) return;
    const label = t(this.language, active ? 'exitFullscreen' : 'fullscreen');
    button.setAttribute('aria-label', label);
    button.title = label;
    this.replaceButtonIcon(button, active ? 'shrink' : 'expand');
  }

  private setLanguage(language: Language, persist = true): void {
    this.language = language;
    if (persist) saveLanguage(language);
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.title = language === 'zh'
      ? 'CAR ATELIER — 3D 名车互动展厅'
      : 'CAR ATELIER — Interactive 3D Car Showroom';

    this.root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n as TranslationKey;
      element.textContent = t(language, key);
    });
    this.root.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((element) => {
      const key = element.dataset.i18nAriaLabel as TranslationKey;
      element.setAttribute('aria-label', t(language, key));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-language]').forEach((button) => {
      const active = button.dataset.language === language;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-color]').forEach((button) => {
      const paint = this.appearanceChoices().find((item) => item.value === button.dataset.color);
      if (!paint) return;
      const label = this.localized(paint.label);
      button.setAttribute('aria-label', label);
      button.title = label;
    });
    this.refreshPaintLabel();
    const canvas = this.stage.querySelector('canvas');
    if (canvas) canvas.setAttribute('aria-label', t(language, 'modelScene'));
    this.refreshCarDetails();
    this.refreshPanelLabels();
    this.refreshFocusMode();
    this.refreshOverlayText();
    this.setFullscreenActive(this.fullscreen);
  }

  private refreshCarDetails(): void {
    if (!this.currentCar) return;
    const car = this.currentCar;
    this.text('#car-designation', this.localized(car.designation));
    this.text('#car-brand', car.brand);
    this.text('#car-name', car.name);
    this.text('#car-description', this.localized(car.description));
    this.text('#model-type', t(this.language, car.modelKind === 'procedural' ? 'procedural' : 'gltf'));
    const creditBlock = this.root.querySelector<HTMLElement>('#car-credits');
    if (creditBlock) creditBlock.hidden = !car.attribution;
    this.text('#car-attribution', car.attribution ? this.localized(car.attribution) : '');
    const source = this.root.querySelector<HTMLAnchorElement>('#car-source');
    if (source) {
      source.hidden = !car.sourceUrl;
      if (car.sourceUrl) source.href = car.sourceUrl;
      else source.removeAttribute('href');
    }
    const license = this.root.querySelector<HTMLAnchorElement>('#car-license');
    if (license) {
      license.hidden = !car.licenseUrl;
      if (car.licenseUrl) license.href = car.licenseUrl;
      else license.removeAttribute('href');
    }
  }

  private localized(value: LocalizedText): string {
    return typeof value === 'string' ? value : value[this.language];
  }

  private appearanceChoices(): AppearanceChoice[] {
    if (this.currentCar?.materialVariants?.length) {
      return this.currentCar.materialVariants.map((variant) => ({
        mode: 'variant',
        value: variant.name,
        swatch: variant.swatch,
        label: variant.label,
      }));
    }
    return paintOptions.map((paint) => ({
      mode: 'color',
      value: paint.value,
      swatch: paint.value,
      label: { zh: paint.name, en: paint.nameEn },
    }));
  }

  private renderAppearanceOptions(): void {
    const container = this.root.querySelector<HTMLElement>('#paint-options');
    if (!container) return;
    container.replaceChildren();
    const choices = this.appearanceChoices();
    for (const option of choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'swatch';
      button.dataset.color = option.value;
      button.dataset.appearanceMode = option.mode;
      button.style.setProperty('--swatch-color', option.swatch);
      button.innerHTML = icon('check', 'swatch-check');
      button.setAttribute('aria-label', this.localized(option.label));
      button.title = this.localized(option.label);
      container.appendChild(button);
    }
    if (choices.length) this.markColor(choices[0].value);
  }

  private refreshPaintLabel(): void {
    const selected = this.root.querySelector<HTMLButtonElement>('.swatch.is-active');
    const choice = this.appearanceChoices().find((option) => option.value === selected?.dataset.color);
    this.text('#paint-selection', choice ? this.localized(choice.label) : '');
  }

  private setOpenPanel(panel: Panel | null): void {
    this.openPanel = panel;
    const app = this.root.querySelector<HTMLElement>('.showroom-app');
    if (app) app.dataset.openPanel = panel ?? '';
    const consoleElement = this.root.querySelector<HTMLElement>('.showroom-console');
    if (consoleElement) consoleElement.dataset.openPanel = panel ?? '';
    this.root.querySelectorAll<HTMLElement>('[data-panel-shell]').forEach((shell) => {
      const open = shell.dataset.panelShell === panel;
      shell.hidden = !open;
      const body = shell.querySelector<HTMLElement>('.panel-body');
      if (body) body.hidden = !open;
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-panel-toggle]').forEach((button) => {
      const selected = button.dataset.panelToggle === panel;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-expanded', String(selected));
    });
    this.refreshPanelLabels();
    this.refreshCollectionScroll();
  }

  /** Keep scroll affordances in sync with overflow and the current viewport. */
  private refreshCollectionScroll(): void {
    const selector = this.carSelector;
    const maxScroll = Math.max(0, selector.scrollWidth - selector.clientWidth);
    const hasOverflow = this.openPanel === 'collection' && maxScroll > 2;
    this.carScrollControls.hidden = !hasOverflow;
    if (!hasOverflow) {
      this.carScrollViewport.classList.remove('can-scroll-prev', 'can-scroll-next');
      return;
    }

    const position = Math.max(0, Math.min(maxScroll, selector.scrollLeft));
    const canScrollPrev = position > 1;
    const canScrollNext = position < maxScroll - 1;
    this.carScrollViewport.classList.toggle('can-scroll-prev', canScrollPrev);
    this.carScrollViewport.classList.toggle('can-scroll-next', canScrollNext);
    this.carScrollPrev.disabled = !canScrollPrev;
    this.carScrollNext.disabled = !canScrollNext;

    const trackWidth = this.carScrollTrack.clientWidth;
    const thumbWidth = Math.min(trackWidth, Math.max(26, trackWidth * selector.clientWidth / selector.scrollWidth));
    const thumbOffset = maxScroll > 0 ? (position / maxScroll) * (trackWidth - thumbWidth) : 0;
    this.carScrollThumb.style.width = thumbWidth + 'px';
    this.carScrollThumb.style.transform = 'translateX(' + thumbOffset + 'px)';
  }

  private closePanel(): void {
    const previous = this.openPanel;
    this.setOpenPanel(null);
    if (previous) {
      this.root.querySelector<HTMLButtonElement>('[data-panel-toggle="' + previous + '"]')?.focus();
    }
  }

  private refreshPanelLabels(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-panel-toggle]').forEach((button) => {
      const panel = button.dataset.panelToggle as Panel;
      const open = this.openPanel === panel;
      const label = t(this.language, open ? 'collapse' : 'expand')
        + ' ' + t(this.language, panelLabels[panel]);
      button.setAttribute('aria-label', label);
      button.title = label;
    });
  }

  private refreshFocusMode(): void {
    this.root.querySelector('.showroom-app')?.classList.toggle('is-focus-mode', this.focusMode);
    const button = this.root.querySelector<HTMLButtonElement>('[data-action="focus"]');
    if (!button) return;
    button.classList.toggle('is-active', this.focusMode);
    button.setAttribute('aria-pressed', String(this.focusMode));
    const label = t(this.language, this.focusMode ? 'showPanels' : 'focusView');
    button.setAttribute('aria-label', label);
    button.title = label;
    this.replaceButtonIcon(button, this.focusMode ? 'eye-off' : 'eye');
    const text = button.querySelector('.focus-label');
    if (text) text.textContent = label;
  }

  private refreshOverlayText(): void {
    if (this.loadingState === 'loading') {
      this.loadTitle.textContent = t(this.language, 'loadingTitle');
      this.loadMessage.textContent = t(this.language, 'loadingBody');
    } else if (this.loadingState === 'error') {
      this.loadTitle.textContent = t(this.language, this.fatalError ? 'startError' : 'loadingError');
      this.loadMessage.textContent = t(this.language, this.errorMessage);
    }
  }

  private markView(view: CameraView): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  private markColor(color: string): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-color]').forEach((button) => {
      const active = button.dataset.color === color;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    this.refreshPaintLabel();
  }

  private text(selector: string, value: string): void {
    const element = this.root.querySelector(selector);
    if (element) element.textContent = value;
  }

  private replaceButtonIcon(button: HTMLButtonElement, name: IconName): void {
    const current = button.querySelector('.ui-icon');
    if (current) current.outerHTML = icon(name);
  }
}
