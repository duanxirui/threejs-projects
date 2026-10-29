<script setup>
import { computed, ref } from 'vue';
import examples from './data/examples.generated.json';

const search = ref('');
const activeCategory = ref('全部案例');
const copyState = ref('复制命令');
const createCommand = 'npm run example:create -- orbit-lab "轨道实验室"';
const repoUrl = String(import.meta.env.VITE_REPOSITORY_URL || '').replace(/\/+$/, '').replace(/\.git$/, '');

const categories = computed(() => [
  { name: '全部案例', count: examples.length },
  ...[...new Set(examples.map((item) => item.category))]
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
    .map((name) => ({ name, count: examples.filter((item) => item.category === name).length })),
]);

const filteredExamples = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  return examples.filter((item) => {
    if (activeCategory.value !== '全部案例' && item.category !== activeCategory.value) return false;
    if (!query) return true;
    return [item.name, item.description, item.category, item.slug, ...item.tags]
      .some((value) => value.toLocaleLowerCase().includes(query));
  });
});

const hasFilter = computed(() => search.value.trim() !== '' || activeCategory.value !== '全部案例');

function resetFilters() {
  search.value = '';
  activeCategory.value = '全部案例';
}

function siteUrl(relative) {
  return `${import.meta.env.BASE_URL}${relative}`;
}

function sourceUrl(item) {
  return repoUrl && /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(repoUrl)
    ? `${repoUrl}/tree/main/${item.source}`
    : '';
}

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(createCommand);
    copyState.value = '已复制';
  } catch {
    copyState.value = '请选中文字复制';
  }
}
</script>

<template>
  <div class="site" id="top">
    <div class="ambient-grid" aria-hidden="true"></div>

    <header class="site-header container">
      <a class="brand" href="#top" aria-label="Three.js Lab 返回顶部">
        <span class="brand-symbol" aria-hidden="true"><span></span><span></span><span></span></span>
        <span class="brand-wordmark">THREE<span class="brand-dot">.</span>JS <strong>LAB</strong></span>
      </a>
      <nav class="main-nav" aria-label="网站导航">
        <a href="#collection">案例图鉴</a>
        <a href="#method">探索方式</a>
        <a href="#about">关于项目</a>
      </nav>
      <a class="nav-cta" href="#collection">
        探索案例
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
      </a>
    </header>

    <main>
      <section class="hero container" aria-labelledby="hero-title">
        <div class="hero-copy">
          <div class="eyebrow"><span class="pulse-dot"></span> A CREATIVE THREE.JS COLLECTION <span class="eyebrow-line"></span> 001</div>
          <h1 id="hero-title">想象力的边界，<br/><span>由你重新定义。</span></h1>
          <p class="hero-description">从一粒星尘，到整个宇宙。这里收集独立、可交互的 Three.js 实验作品，让灵感在浏览器里自由生长。</p>
          <div class="hero-actions">
            <a class="primary-button" href="#collection">开始探索 <span class="button-arrow" aria-hidden="true">↗</span></a>
            <a class="text-button" href="#method">了解项目架构 <span aria-hidden="true">↗</span></a>
          </div>
          <div class="hero-stats" aria-label="项目统计">
            <div><strong>{{ examples.length.toString().padStart(2, '0') }}</strong><span>收录案例</span></div>
            <div><strong>{{ categories.length - 1 }}</strong><span>探索主题</span></div>
            <div><strong>01</strong><span>独立项目模板</span></div>
          </div>
        </div>

        <div class="hero-art" aria-hidden="true">
          <div class="hero-art-grid"></div>
          <div class="art-coordinate art-coordinate-top">X: 32.741 <span>/</span> Y: 78.063</div>
          <div class="orbit orbit-one"></div>
          <div class="orbit orbit-two"></div>
          <div class="orbit orbit-three"></div>
          <div class="glow-halo"></div>
          <div class="planet"><div class="planet-texture"></div><div class="planet-shine"></div></div>
          <div class="orbit-dot orbit-dot-one"></div>
          <div class="orbit-dot orbit-dot-two"></div>
          <div class="spark spark-one"></div>
          <div class="spark spark-two"></div>
          <div class="spark spark-three"></div>
          <div class="spark spark-four"></div>
          <div class="art-panel art-panel-top"><span class="art-cross">✳</span><span>REALTIME ENGINE<br/><strong>WEBGL / THREE.JS</strong></span></div>
          <div class="art-panel art-panel-bottom"><span class="art-panel-number">∞</span><span>CREATE<br/><strong>WITHOUT LIMITS</strong></span></div>
          <div class="art-coordinate art-coordinate-bottom">INTERACTIVE UNIVERSE — V1.0</div>
        </div>
        <div class="hero-edge-mark" aria-hidden="true">SCROLL TO DISCOVER <span>↓</span></div>
      </section>

      <section class="collection-section container" id="collection" aria-labelledby="collection-title">
        <div class="section-heading">
          <div>
            <div class="section-kicker"><span>01</span> / THE COLLECTION</div>
            <h2 id="collection-title">探索<span>作品图鉴</span><span class="title-asterisk">✳</span></h2>
            <p>每个案例都是一个独立的世界。选择感兴趣的主题，开启你的探索之旅。</p>
          </div>
          <div class="section-counter"><strong>{{ String(examples.length).padStart(2, '0') }}</strong><span>已收录作品<br/>THE COLLECTION</span></div>
        </div>

        <div class="toolbar">
          <div class="category-tabs" role="group" aria-label="按分类筛选">
            <button
              v-for="category in categories"
              :key="category.name"
              type="button"
              :class="['category-tab', { selected: activeCategory === category.name }]"
              :aria-pressed="activeCategory === category.name"
              @click="activeCategory = category.name"
            >{{ category.name }} <span>{{ category.count }}</span></button>
          </div>
          <label class="search-field">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 4.6 4.6"/></svg>
            <input v-model="search" type="search" placeholder="搜索案例 / 技术标签" autocomplete="off" aria-label="搜索案例或技术标签" />
          </label>
        </div>
        <div class="results-line" aria-live="polite">
          <span><span class="results-indicator"></span> 找到 {{ filteredExamples.length }} 个案例</span>
          <button v-if="hasFilter" class="reset-link" type="button" @click="resetFilters">清除筛选 ×</button>
        </div>

        <div v-if="filteredExamples.length" class="case-grid">
          <article v-for="(item, index) in filteredExamples" :key="item.slug" class="case-card">
            <div class="case-cover">
              <img :src="siteUrl(item.cover)" :alt="`${item.name} 的案例封面`" loading="lazy" />
              <span class="cover-index">{{ String(index + 1).padStart(2, '0') }} / PROJECT</span>
              <span class="cover-category">{{ item.category }}</span>
            </div>
            <div class="case-detail">
              <div class="case-tags"><span v-for="tag in item.tags.slice(0, 4)" :key="tag">#{{ tag }}</span></div>
              <h3>{{ item.name }}</h3>
              <p>{{ item.description }}</p>
              <div class="case-bottom">
                <a v-if="item.ready" class="case-open" :href="siteUrl(item.page)">进入场景 <span aria-hidden="true">↗</span></a>
                <span v-else class="case-pending" title="统一构建与发布将在 T04/T05 接入">等待统一构建 <span aria-hidden="true">↗</span></span>
                <a v-if="sourceUrl(item)" class="case-source" :href="sourceUrl(item)" target="_blank" rel="noopener noreferrer">查看源码</a>
              </div>
            </div>
          </article>
        </div>

        <div v-else-if="examples.length === 0" class="zero-state">
          <div class="zero-visual" aria-hidden="true">
            <div class="zero-grid"></div>
            <div class="zero-orbit zero-orbit-a"></div>
            <div class="zero-orbit zero-orbit-b"></div>
            <div class="zero-cube"><span></span><span></span><span></span></div>
            <div class="zero-code">{ 001 }</div>
          </div>
          <div class="zero-copy">
            <span class="zero-label"><span class="zero-dot"></span> READY FOR FIRST LAUNCH</span>
            <h3>下一个精彩案例，<br/>即将从这里开始。</h3>
            <p>案例展示站已经就绪。目前还没有设置为公开展示的作品。你可以使用独立模板创建第一个 Three.js 案例。</p>
            <div class="command-block"><code>{{ createCommand }}</code><button type="button" @click="copyCommand">{{ copyState }}</button></div>
            <span class="zero-footnote">创建后完善 example.json，并将 visible 设为 true，即可自动进入案例索引。</span>
          </div>
        </div>

        <div v-else class="no-results">
          <span class="no-results-icon" aria-hidden="true">◎</span>
          <h3>没有找到匹配的作品</h3>
          <p>换个关键词，或者看看其他分类。</p>
          <button type="button" class="primary-button small" @click="resetFilters">查看全部案例 <span aria-hidden="true">↗</span></button>
        </div>
      </section>

      <section class="method-section" id="method" aria-labelledby="method-title">
        <div class="container">
          <div class="section-heading method-heading">
            <div>
              <div class="section-kicker"><span>02</span> / HOW IT WORKS</div>
              <h2 id="method-title">独立创作，<span>自由组合</span><span class="title-asterisk">✳</span></h2>
              <p>一个案例一个文件夹，既能单独运行，也能汇集在同一个展示站。</p>
            </div>
          </div>
          <div class="method-grid">
            <article class="method-card">
              <span class="method-number">/ 01</span>
              <span class="method-icon method-icon-first" aria-hidden="true">◇</span>
              <h3>独立案例</h3>
              <p>每个项目拥有自己的源码、依赖和资源。复制一个文件夹，就能开始探索。</p>
              <span class="method-foot">STANDALONE PROJECTS ↗</span>
            </article>
            <article class="method-card">
              <span class="method-number">/ 02</span>
              <span class="method-icon method-icon-second" aria-hidden="true">⌘</span>
              <h3>统一图鉴</h3>
              <p>通过案例元数据自动生成索引。分类、搜索和封面，让每个作品被轻松发现。</p>
              <span class="method-foot">ONE CREATIVE GALLERY ↗</span>
            </article>
            <article class="method-card">
              <span class="method-number">/ 03</span>
              <span class="method-icon method-icon-third" aria-hidden="true">↗</span>
              <h3>持续扩展</h3>
              <p>从场景练习到复杂的交互世界，沿着相同规范逐步增加和展示作品。</p>
              <span class="method-foot">BUILT TO GROW ↗</span>
            </article>
          </div>
        </div>
      </section>

      <section class="about-section container" id="about">
        <div class="about-line">
          <div><span class="section-kicker"><span>03</span> / YOUR NEXT IDEA</span><h2>让每一个新想法，<br/><em>拥有自己的空间。</em></h2></div>
          <a class="about-button" href="#collection">返回案例图鉴 <span aria-hidden="true">↗</span></a>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container footer-row">
        <div class="footer-brand">THREE<span>.</span>JS LAB <small>© {{ new Date().getFullYear() }}</small></div>
        <div class="footer-links"><a href="#top">返回顶部 ↑</a><span>DESIGNED FOR THE OPEN WEB</span></div>
      </div>
    </footer>
  </div>
</template>
