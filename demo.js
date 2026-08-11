/* ============================================================
   CaresAgent — Demo Lab 交互引擎（临时/实验）
   自包含 IIFE：不依赖线上 script.js（其 nav handler 未做空值保护，
   且 EN 词典只认主页 key）。仅读取 ../styles.css 的 tokens。
   职责：中英切换 / 滚动浮现 / 导航态 / 连接手机控制器 / 渠道对话播放器。
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 图标库（lucide 风格内联 SVG） ---------------- */
  var IC = {
    read: '<path d="M6 3.5h7L18 8v12.5H6V3.5Z"/><path d="M13 3.5V8h4.5M9 12.5h6M9 16h4"/>',
    python: '<path d="M8 4.5h8M5 9l-2.5 3L5 15M19 9l2.5 3L19 15M13.5 5l-3 14"/>',
    ppt: '<path d="M4 4.5h16M5 4.5v9.5h14V4.5M9.5 20l2.5-3 2.5 3"/>',
    img: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m4 17 5-4 5 4 3-2.5 3 2.5"/>',
    xls: '<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M8 4v16M3.5 9.5h17M3.5 14.5h17"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.7-4.7"/>',
    link: '<path d="M9.5 14.5 14.5 9.5M8 11 5.7 13.3a3.5 3.5 0 0 0 5 5L13 16M16 13l2.3-2.3a3.5 3.5 0 0 0-5-5L11 8"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/>',
    check: '<path d="m4.5 12.5 5 5L19.5 6.5"/>',
    send: '<path d="M4 11.5 20 4l-7.5 16-2.5-7L4 11.5Z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    shield: '<path d="M12 3.5 5 6.5v5c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9v-5l-7-3Z"/><path d="m9.2 12 2 2 3.6-3.8"/>',
    alert: '<path d="M12 3.5 21 19H3L12 3.5Z"/><path d="M12 10v4M12 16.5v.5"/>',
    file: '<path d="M6 3.5h7L18 8v12.5H6V3.5Z"/><path d="M13 3.5V8h4.5"/>',
    scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M4 12h16"/>'
  };
  // 不写 stroke-width:粗细由 styles.css 的 --icon-stroke 一处定义
  function svg(name, cls) {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="' +
      (cls || '') +
      '" aria-hidden="true">' +
      (IC[name] || '') +
      '</svg>'
    );
  }

  /* ---------------- 渠道元数据 ---------------- */
  var ASSET = 'assets/providers/';
  var CHANNELS = {
    // color = bright brand fill for icons/accents; btn = darkened fill for white-text buttons (WCAG AA)
    wechat: { name: { zh: '微信', en: 'WeChat' }, icon: ASSET + 'wechat.png', color: 'var(--wechat)', btn: 'var(--wechat-btn)' },
    feishu: { name: { zh: '飞书', en: 'Feishu' }, icon: ASSET + 'feishu.png', color: 'var(--feishu)', btn: 'var(--feishu)' },
    wecom: { name: { zh: '企业微信', en: 'WeCom' }, icon: ASSET + 'wecom.png', color: 'var(--wecom)', btn: 'var(--wecom-btn)' }
  };

  /* ---------------- 语言 ---------------- */
  var currentLang = 'zh';
  try {
    if (localStorage.getItem('ca-demo-lang') === 'en') currentLang = 'en';
  } catch (e) {}
  function L(o) {
    if (!o) return '';
    return o[currentLang] != null ? o[currentLang] : o.zh != null ? o.zh : '';
  }

  // 静态文案：HTML 以中文书写 + data-i18n；这里给 EN。ZH 在加载时从 DOM 抓取。
  var EN = window.DEMO_EN || {};
  var EN_META = window.DEMO_EN_META || null;
  var ZH = {};
  var ZH_META = {
    title: document.title,
    description: (document.querySelector('meta[name="description"]') || {}).content || ''
  };
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var k = el.getAttribute('data-i18n');
    if (!(k in ZH)) ZH[k] = el.textContent;
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    var k = el.getAttribute('data-i18n-html');
    if (!(k in ZH)) ZH[k] = el.innerHTML;
  });

  function applyStatic(lang) {
    var dict = lang === 'en' ? EN : ZH;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (dict[k] != null) el.textContent = dict[k];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html');
      if (dict[k] != null) el.innerHTML = dict[k];
    });
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');
    if (lang === 'en') document.body.setAttribute('data-lang', 'en');
    else document.body.removeAttribute('data-lang');
    if (lang === 'en' && EN_META) {
      document.title = EN_META.title;
      var d = document.querySelector('meta[name="description"]');
      if (d) d.content = EN_META.description;
    } else {
      document.title = ZH_META.title;
      var d2 = document.querySelector('meta[name="description"]');
      if (d2) d2.content = ZH_META.description;
    }
    var lt = document.getElementById('langToggle');
    if (lt) lt.setAttribute('aria-label', lang === 'en' ? '切换到中文 / Switch to Chinese' : 'Switch to English / 切换到英文');
    var menuSummary = document.querySelector('.nav-menu summary');
    if (menuSummary) menuSummary.setAttribute('aria-label', lang === 'en' ? 'Menu' : '菜单');
    try {
      localStorage.setItem('ca-demo-lang', lang);
    } catch (e) {}
  }

  /* ---------------- 滚动浮现 ---------------- */
  var revealIO = null;
  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    revealIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          var sibs = Array.prototype.filter.call(el.parentElement ? el.parentElement.children : [], function (c) {
            return c.classList && c.classList.contains('reveal');
          });
          var i = sibs.indexOf(el);
          if (i > 0) el.style.transitionDelay = Math.min(i * 70, 350) + 'ms';
          el.classList.add('in');
          revealIO.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    );
    els.forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------------- 离屏动画暂停（节省 GPU/主线程，沿用 v1 机制） ---------------- */
  function initAnimPause() {
    if (!('IntersectionObserver' in window)) return;
    var animIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) { en.target.classList.toggle('anim-paused', !en.isIntersecting); });
      },
      { rootMargin: '140px' }
    );
    document.querySelectorAll('.hero, .section-flow, .gl-hero, #features, #channels, #traits, #usage').forEach(function (s) { animIO.observe(s); });
  }

  /* ---------------- 首页 2026-07 新增动效:共享终端 / 幽灵下一句 / 影片 ---------------- */
  /* 共享终端 mini demo:代理敲一条命令 → 输出落下 → 用户在同一个提示符接着敲,循环 */
  function initTermDemo() {
    var root = document.querySelector('[data-term-demo]');
    if (!root) return;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lines = root.querySelectorAll('.wt-line');
    var agentLine = lines[0], outLine = lines[1], userLine = lines[2];
    var agentCmd = agentLine.querySelector('.wt-cmd'), userCmd = userLine.querySelector('.wt-cmd');
    var agentCaret = agentLine.querySelector('.wt-caret'), userCaret = userLine.querySelector('.wt-caret');
    var AGENT = 'python scripts/extract_figures.py';
    var OUT = 'extracted 9 figures → figures/  (300 dpi)';
    var USER = 'open figures/';
    if (reduced) {
      agentCmd.textContent = AGENT; outLine.textContent = OUT; userCmd.textContent = USER;
      return;
    }
    var timer = null, running = false;
    function type(el, text, i, speed, then) {
      if (i > text.length) { then && then(); return; }
      el.textContent = text.slice(0, i);
      timer = setTimeout(function () { type(el, text, i + 1, speed, then); }, speed);
    }
    function cycle() {
      agentCmd.textContent = ''; userCmd.textContent = ''; outLine.textContent = '';
      userLine.style.opacity = '0.35';
      agentCaret.classList.add('on'); userCaret.classList.remove('on');
      timer = setTimeout(function () {
        type(agentCmd, AGENT, 0, 34, function () {
          agentCaret.classList.remove('on');
          timer = setTimeout(function () {
            outLine.textContent = OUT;
            userLine.style.opacity = '1';
            userCaret.classList.add('on');
            timer = setTimeout(function () {
              type(userCmd, USER, 0, 105, function () {
                timer = setTimeout(cycle, 3200);
              });
            }, 1100);
          }, 500);
        });
      }, 700);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !running) { running = true; cycle(); }
          else if (!en.isIntersecting && running) { running = false; clearTimeout(timer); }
        });
      }, { threshold: 0.4 }).observe(root);
    } else cycle();
  }

  /* 幽灵下一句 demo:轮播几条灰字建议(整条浮现,如真实预测抵达) */


  /* ---------------- 首页「使用」步骤循环演示 ---------------- */
  function initUsageDemo() {
    var sec = document.getElementById('usage');
    if (!sec) return;
    var timers = [];
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function typeInto(input, done) {
      var full = input.getAttribute('data-type') || '';
      input.classList.add('typing');
      var i = 0;
      function step() {
        i++;
        var shown = full.slice(0, i).replace(/&/g, '&amp;').replace(/</g, '&lt;');
        input.innerHTML = '<span>' + shown + '</span><span class="cfg-cursor"></span>';
        if (i < full.length) later(step, 34);
        else later(function () {
          input.innerHTML = '<span>' + full.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>';
          input.classList.remove('typing');
          if (done) done();
        }, 240);
      }
      later(step, 120);
    }
    function loopModel(box) {
      var inputs = Array.prototype.slice.call(box.querySelectorAll('.cfg-input'));
      function run() {
        inputs.forEach(function (inp) { inp.innerHTML = '<span class="ph">' + (inp.getAttribute('data-ph') || '') + '</span>'; inp.classList.remove('typing'); });
        function chain(idx) {
          if (idx >= inputs.length) { later(run, 3400); return; }
          typeInto(inputs[idx], function () { chain(idx + 1); });
        }
        later(function () { chain(0); }, 500);
      }
      run();
    }
    function loopFiles(box, lead) {
      box.classList.add('us-anim');
      var folder = box.querySelector('.cfg-folder');
      var files = Array.prototype.slice.call(box.querySelectorAll('.rail-file'));
      function run() {
        if (folder) folder.classList.remove('picked');
        files.forEach(function (f) { f.classList.remove('show'); });
        later(function () {
          if (folder) folder.classList.add('picked');
          files.forEach(function (f, i) { later(function () { f.classList.add('show'); }, lead + i * 480); });
          later(run, lead + files.length * 480 + 3000);
        }, 800);
      }
      run();
    }
    function loopPlan(box) {
      var steps = Array.prototype.slice.call(box.querySelectorAll('.process-steps li'));
      if (!steps.length) return;
      var k = 1;
      function run() {
        steps.forEach(function (li, i) {
          li.classList.toggle('done', i < k);
          li.classList.toggle('live', i === k);
        });
        k = (k + 1) % (steps.length + 1);
        later(run, k === 0 ? 2600 : 1700);
      }
      run();
    }
    function play() {
      var m = sec.querySelector('[data-us-model]');
      var f = sec.querySelector('[data-us-folder]');
      var p = sec.querySelector('[data-us-plan]');
      var a = sec.querySelector('[data-us-outputs]');
      if (m) loopModel(m);
      if (f) loopFiles(f, 700);
      if (p) loopPlan(p);
      if (a) loopFiles(a, 400);
    }
    // 减动效：直接呈现每格的终态，不启动循环
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sec.querySelectorAll('.cfg-input').forEach(function (inp) { inp.innerHTML = '<span>' + (inp.getAttribute('data-type') || '') + '</span>'; });
      sec.querySelectorAll('.cfg-folder').forEach(function (f) { f.classList.add('picked'); });
      sec.querySelectorAll('[data-us-folder], [data-us-outputs]').forEach(function (box) {
        box.classList.add('us-anim');
        box.querySelectorAll('.rail-file').forEach(function (f) { f.classList.add('show'); });
      });
      return;
    }
    // 离屏暂停：退出视口清空全部定时器，回来重启循环
    var started = false;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (en.isIntersecting && !started) { started = true; play(); }
          else if (!en.isIntersecting && started) { started = false; timers.forEach(clearTimeout); timers = []; }
        });
      }, { threshold: 0.12 });
      io.observe(sec);
    } else play();
  }

  /* ---------------- 多页导航：高亮当前页 ---------------- */
  function initNavActive() {
    var here = (location.pathname.split('/').pop() || 'index.html');
    if (here === '') here = 'index.html';
    document.querySelectorAll('.nav-links a, .nav-menu-panel a, .nav-dd-menu a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('#')[0].split('/').pop();
      if (href && href === here) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
        var dd = a.closest && a.closest('.nav-dd');
        if (dd) dd.classList.add('active');
      }
    });
  }

  /* ---------------- 导航滚动态（带空值保护） ---------------- */
  function initNav() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    var menu = document.getElementById('navMenu');
    if (menu) {
      menu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { menu.open = false; });
      });
    }
  }

  /* ---------------- 伪二维码（无需第三方库） ---------------- */
  function fauxQR(seed) {
    var n = 25;
    var rnd = 0;
    for (var i = 0; i < seed.length; i++) rnd = (rnd * 31 + seed.charCodeAt(i)) & 0xffff;
    function next() {
      rnd = (rnd * 1103515245 + 12345) & 0x7fffffff;
      return rnd / 0x7fffffff;
    }
    var cell = 168 / n;
    var rects = '';
    function finder(ox, oy) {
      rects += '<rect x="' + ox * cell + '" y="' + oy * cell + '" width="' + 7 * cell + '" height="' + 7 * cell + '" fill="#111"/>';
      rects += '<rect x="' + (ox + 1) * cell + '" y="' + (oy + 1) * cell + '" width="' + 5 * cell + '" height="' + 5 * cell + '" fill="#fff"/>';
      rects += '<rect x="' + (ox + 2) * cell + '" y="' + (oy + 2) * cell + '" width="' + 3 * cell + '" height="' + 3 * cell + '" fill="#111"/>';
    }
    function inFinder(x, y) {
      return (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    }
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        if (inFinder(x, y)) continue;
        if (next() > 0.52) rects += '<rect x="' + x * cell + '" y="' + y * cell + '" width="' + cell + '" height="' + cell + '" fill="#111"/>';
      }
    }
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    return '<svg class="qrcode" viewBox="0 0 168 168" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="168" height="168" fill="#fff"/>' + rects + '</svg>';
  }

  /* ============================================================
     连接手机控制器
     ============================================================ */
  var CONNECT = [
    {
      id: 'wechat',
      flow: 'qr',
      desc: { zh: '扫码绑定 iLink 机器人，收发好友 / 群消息', en: 'Scan to bind an iLink bot; receive & reply to friends / groups' },
      account: 'iLink Bot · wxbot_8f2a3c',
      qrHint: { zh: '打开微信 → 「扫一扫」，在手机上确认登录此机器人', en: 'Open WeChat → Scan, then confirm bot login on your phone' },
      pair: 'WX-4F2A'
    },
    {
      id: 'feishu',
      flow: 'qr',
      desc: { zh: '扫码授权自建应用，长连接收发消息', en: 'Scan to authorize a custom app; long-connection messaging' },
      account: 'Lark App · cli_a1b2c3',
      qrHint: { zh: '打开飞书 → 「扫一扫」，授权 CaresAgent 自建应用', en: 'Open Feishu → Scan, authorize the CaresAgent custom app' },
      pair: 'FS-91C7'
    },
    {
      id: 'wecom',
      flow: 'form',
      desc: { zh: '填入智能机器人凭证，建立长连接', en: 'Paste the AI-bot credentials to open a long connection' },
      account: 'AIBot · 1688852…',
      intro: { zh: '在企业微信管理后台创建智能机器人并开启长连接，然后把凭据填入下方。', en: 'Create an AI bot in the WeCom admin console, turn on its long connection, then paste its credentials below.' },
      steps: [
        { zh: '登录企业微信管理后台', en: 'Sign in to the WeCom admin console' },
        { zh: '进入「应用管理 → 智能机器人」，创建或选择一个机器人', en: 'Open 应用管理 → 智能机器人 (Apps → AI Bots) and create or pick a bot' },
        { zh: '开启其「API 模式 / 长连接」', en: 'Turn on its API / long-connection mode' },
        { zh: '复制 AIBotID 与长连接 Secret', en: 'Copy the AIBotID and the long-connection Secret' }
      ]
    }
  ];

  function ConnectController(root) {
    var connected = {};
    (root.getAttribute('data-preset') || '').split(',').forEach(function (p) {
      p = p.trim();
      if (p) connected[p] = true;
    });
    var view = { stage: 'cards', provider: null };
    var timers = [];
    var cdInterval = null;
    function clearTimers() {
      timers.forEach(clearTimeout);
      timers = [];
      if (cdInterval) { clearInterval(cdInterval); cdInterval = null; }
    }

    function cfg(id) {
      for (var i = 0; i < CONNECT.length; i++) if (CONNECT[i].id === id) return CONNECT[i];
      return null;
    }

    function statusEl(id) {
      if (connected[id]) return '<span class="cx-status on"><span class="dot"></span>' + (currentLang === 'en' ? 'Connected' : '已连接') + '</span>';
      return '<span class="cx-status off"><span class="dot"></span>' + (currentLang === 'en' ? 'Not connected' : '未连接') + '</span>';
    }

    function linkBadge() {
      var order = ['wechat', 'feishu', 'wecom'];
      var chips = order
        .filter(function (id) { return connected[id]; })
        .map(function (id) { return '<span class="chip" style="background-image:url(' + CHANNELS[id].icon + ')"></span>'; })
        .join('');
      if (!chips) return '';
      return '<div class="cx-linkbadge" title="' + (currentLang === 'en' ? 'Connected channels' : '已连接渠道') + '">' + chips + '</div>';
    }

    function renderCards() {
      var cards = CONNECT.map(function (c) {
        var ch = CHANNELS[c.id];
        var foot = connected[c.id]
          ? '<span class="cx-account">' + c.account + '</span><button class="cx-disconnect" data-act="disconnect" data-id="' + c.id + '">' + svg('link', '') + (currentLang === 'en' ? 'Disconnect' : '断开连接') + '</button>'
          : '<button class="cx-connect" data-act="connect" data-id="' + c.id + '" style="background:' + ch.btn + '">' + (currentLang === 'en' ? 'Connect' : '连接') + '</button>';
        return (
          '<div class="cx-card">' +
          '<div class="cx-card-top"><span class="cx-ico" style="background:url(' + ch.icon + ') center/cover"></span>' +
          '<span class="cx-name">' + L(ch.name) + '</span>' + statusEl(c.id) + '</div>' +
          '<p class="cx-desc">' + L(c.desc) + '</p>' +
          '<div class="cx-card-foot">' + foot + '</div>' +
          '</div>'
        );
      }).join('');
      var hint =
        '<div class="cx-hint"><p class="cx-hint-title">' +
        (currentLang === 'en' ? 'Once connected, every chat becomes an agent session' : '连接后，每条对话都会成为一次智能体会话') +
        '</p><ul><li>' +
        (currentLang === 'en' ? 'Friends / colleagues message you → the agent reads, plans and replies' : '好友 / 同事发来消息 → 智能体阅读、规划并回复') +
        '</li><li>' +
        (currentLang === 'en' ? 'Files are handed back over the same channel' : '输出从同一渠道原样回传') +
        '</li><li>' +
        (currentLang === 'en' ? 'Identity is a bot / app, not your personal account' : '收发身份是机器人 / 应用，并非你的本人账号') +
        '</li></ul></div>';
      root.innerHTML =
        '<div class="cx-modal"><div class="cx-head"><span class="cx-head-ico">' +
        svg('file', '').replace(IC.file, '<rect x="4.5" y="3" width="11" height="18" rx="2.4"/><path d="M9 18.2h2"/>') +
        '</span><div><h3>' +
        (currentLang === 'en' ? 'Connect phone' : '连接手机') +
        '</h3><p>' +
        (currentLang === 'en' ? 'Bridge WeChat / Feishu / WeCom into CaresAgent' : '把微信 / 飞书 / 企业微信接入 CaresAgent') +
        '</p></div>' +
        linkBadge() +
        '</div><div class="cx-grid">' + cards + '</div>' + hint + '</div>';
      view.stage = 'cards';
    }

    function renderQR(c, success) {
      var ch = CHANNELS[c.id];
      var inner;
      if (success) {
        inner = '<div class="qr-success"><span class="check">' + svg('check', '') + '</span><span>' + (currentLang === 'en' ? 'Connected' : '已连接') + '</span></div>';
      } else {
        inner = fauxQR(c.id) + '<span class="scanline"></span>';
      }
      root.innerHTML =
        '<div class="cx-modal"><div class="cx-detail"><div class="cx-detail-bar">' +
        '<button class="cx-back" data-act="back">' + svg('link', '').replace(IC.link, '<path d="M14 5l-7 7 7 7"/>') + '</button>' +
        '<span class="cx-ico" style="width:22px;height:22px;background:url(' + ch.icon + ') center/cover"></span>' +
        '<span class="cx-detail-title">' + (currentLang === 'en' ? 'Connect ' : '连接') + L(ch.name) + '</span></div>' +
        '<div class="cx-qr-wrap"><div class="cx-qr' + (success ? ' is-success' : '') + '">' + inner + '</div>' +
        (success
          ? ''
          : '<p class="cx-qr-hint">' + L(c.qrHint) + '</p><p class="cx-paircode">' + (currentLang === 'en' ? 'Pair code' : '配对码') + '<b>' + c.pair + '</b></p><p class="cx-countdown" data-countdown>' + (currentLang === 'en' ? 'QR code expires in 119s' : '二维码将在 119 秒后过期') + '</p>') +
        '</div></div></div>';
      view.stage = success ? 'qr-success' : 'qr';
    }

    function renderForm(c, state) {
      var ch = CHANNELS[c.id];
      if (state === 'success') {
        root.innerHTML =
          '<div class="cx-modal"><div class="cx-detail"><div class="cx-form-success"><span class="check">' +
          svg('check', '') +
          '</span><span class="title">' + (currentLang === 'en' ? 'Connected' : '连接成功') + '</span>' +
          '<span class="sub">' + (currentLang === 'en' ? 'The bot now receives @-mentions and replies over the long connection.' : '机器人已就绪：被 @ 时即可经长连接收发并回复。') + '</span></div></div></div>';
        view.stage = 'form-success';
        return;
      }
      var stepsHtml = c.steps
        .map(function (s) { return '<li>' + L(s) + '</li>'; })
        .join('');
      root.innerHTML =
        '<div class="cx-modal"><div class="cx-detail"><div class="cx-detail-bar">' +
        '<button class="cx-back" data-act="back">' + svg('link', '').replace(IC.link, '<path d="M14 5l-7 7 7 7"/>') + '</button>' +
        '<span class="cx-ico" style="width:22px;height:22px;background:url(' + ch.icon + ') center/cover"></span>' +
        '<span class="cx-detail-title">' + (currentLang === 'en' ? 'Connect WeCom' : '连接企业微信') + '</span></div>' +
        '<form class="cx-form" data-act="submit"><p class="cx-form-intro">' + L(c.intro) + '</p>' +
        '<div class="cx-field"><label>AIBotID</label><input class="cx-input" name="botid" placeholder="AIBotID" autocomplete="off" /></div>' +
        '<div class="cx-field"><label>' + (currentLang === 'en' ? 'Bot Secret' : 'Bot Secret（长连接密钥）') + '</label><input class="cx-input" name="secret" type="password" placeholder="Bot Secret" autocomplete="off" /></div>' +
        '<button type="button" class="cx-disclosure" data-act="toggle-steps" aria-expanded="false">' +
        svg('link', '').replace(IC.link, '<path d="M6 9l6 6 6-6"/>') +
        (currentLang === 'en' ? 'How do I get these?' : '如何获取？') +
        '</button>' +
        '<div class="cx-steps" hidden><ol>' + stepsHtml + '</ol><a class="console-link" href="https://work.weixin.qq.com/wework_admin/loginpage_wx" target="_blank" rel="noopener">' +
        svg('link', '') + (currentLang === 'en' ? 'Open WeCom admin console' : '打开企业微信管理后台') + '</a></div>' +
        '<button type="submit" class="cx-submit">' + (currentLang === 'en' ? 'Connect' : '连接') + '</button>' +
        '</form></div></div>';
      view.stage = 'form';
    }

    function openProvider(id, keep) {
      if (!keep) clearTimers();
      var c = cfg(id);
      if (!c) return;
      view.provider = id;
      if (c.flow === 'qr') {
        renderQR(c, false);
        // 倒计时动画（cdInterval 由 clearTimers 统一回收）
        var left = 119;
        cdInterval = setInterval(function () {
          left--;
          var el = root.querySelector('[data-countdown]');
          if (!el || left <= 0) { clearInterval(cdInterval); cdInterval = null; return; }
          el.textContent = (currentLang === 'en' ? 'QR code expires in ' + left + 's' : '二维码将在 ' + left + ' 秒后过期');
        }, 1000);
        timers.push(setTimeout(function () {
          if (cdInterval) { clearInterval(cdInterval); cdInterval = null; }
          renderQR(c, true);
          timers.push(setTimeout(function () {
            connected[id] = true;
            renderCards();
          }, 1300));
        }, 2600));
      } else {
        renderForm(c, 'form');
      }
    }

    function submitForm() {
      clearTimers();
      var c = cfg(view.provider);
      if (!c) return;
      var btn = root.querySelector('.cx-submit');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spin-sm"></span>' + (currentLang === 'en' ? 'Verifying…' : '正在校验长连接…');
      }
      timers.push(setTimeout(function () {
        renderForm(c, 'success');
        timers.push(setTimeout(function () {
          connected[c.id] = true;
          renderCards();
        }, 1400));
      }, 1200));
    }

    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn || !root.contains(btn)) return;
      var act = btn.getAttribute('data-act');
      if (act === 'connect') openProvider(btn.getAttribute('data-id'));
      else if (act === 'disconnect') { connected[btn.getAttribute('data-id')] = false; renderCards(); }
      else if (act === 'back') { clearTimers(); renderCards(); }
      else if (act === 'toggle-steps') {
        var box = root.querySelector('.cx-steps');
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (box) box.hidden = open;
      }
    });
    root.addEventListener('submit', function (e) {
      if (e.target.closest('[data-act="submit"]')) { e.preventDefault(); submitForm(); }
    });

    // 自动演示：依次播放 微信扫码→飞书扫码→企业微信填表，无需点击
    function autoWecom() {
      openProvider('wecom', true);
      timers.push(setTimeout(function () {
        var b = root.querySelector('.cx-input[name="botid"]');
        if (b) b.value = '1688852000123';
        var s = root.querySelector('.cx-input[name="secret"]');
        if (s) s.value = 'wxsecret_demo';
        submitForm();
      }, 800));
    }
    function autoPlay() {
      clearTimers();
      connected = {};
      renderCards();
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        connected = { wechat: true, feishu: true, wecom: true };
        renderCards();
        return;
      }
      timers.push(setTimeout(function () { openProvider('wechat', true); }, 1000)); // QR≈3.9s → connected ≈4.9s
      timers.push(setTimeout(function () { openProvider('feishu', true); }, 5400)); // → connected ≈9.3s
      timers.push(setTimeout(function () { autoWecom(); }, 9800));                  // form+submit → connected ≈13.2s
      // 一次性演示：结束后停在「三渠道已连接」。切换 tab 回来会重新播放（不自动循环，避免后台churn）
    }

    this.autoPlay = autoPlay;
    this.stop = clearTimers;
    this.rerender = function () {
      clearTimers();
      if (root.hasAttribute('data-auto')) autoPlay();
      else renderCards();
    };
    root._cc = this;
    renderCards();
    // data-auto：滚动进入视区时自动播放连接动画一次（避免离屏即跑造成的卡顿）
    if (root.hasAttribute('data-auto')) {
      if ('IntersectionObserver' in window) {
        var autoStarted = false;
        var aio = new IntersectionObserver(function (ents) {
          ents.forEach(function (en) {
            if (en.isIntersecting && !autoStarted) { autoStarted = true; autoPlay(); aio.unobserve(root); }
          });
        }, { threshold: 0.3 });
        aio.observe(root);
      } else {
        autoPlay();
      }
    }
  }

  /* ============================================================
     渠道对话播放器
     ============================================================ */
  var SCRIPTS = {
    wechat: {
      title: { zh: '好友对话 · 经 iLink 机器人 — CaresAgent', en: 'Friend chat · via iLink bot — CaresAgent' },
      linked: ['wechat'],
      steps: [
        { t: 'inbound', ch: 'wechat', text: { zh: '在吗？帮我把上次发你的那篇综述 PDF，整理成今晚要用的汇报 PPT 🙏', en: 'You there? Turn that review PDF I sent into a deck for tonight? 🙏' }, att: { name: 'review_2026.pdf', kind: 'pdf' } },
        { t: 'proc-start', title: { zh: '运行中', en: 'Processing' } },
        { t: 'narration', text: { zh: '我先解析这篇综述的章节结构和图表位置。', en: 'Let me parse the review’s section structure and figure positions first.' } },
        { t: 'tool', icon: 'read', label: { zh: '翻开文档 · review_2026.pdf · 38 页', en: 'Open document · review_2026.pdf · 38 pages' } },
        { t: 'narration', text: { zh: '结构清晰，保留 Figure 2/4/7 与 Table 1，开始渲染研究级幻灯片。', en: 'Structure is clear — keeping Figure 2/4/7 + Table 1, rendering research-grade slides.' } },
        { t: 'tool', icon: 'ppt', label: { zh: '生成 PPT · slides_draft.pptx · 15 页', en: 'Create PowerPoint · slides_draft.pptx · 15 slides' } },
        { t: 'proc-end' },
        { t: 'answer', text: { zh: '搞定 ✅ 15 页汇报 PPT 已生成，图表全部用论文原图，未做 AI 臆造。文件直接发你 👇', en: 'Done ✅ A 15-slide deck using the paper’s original figures (no AI-fabricated ones). Sending it 👇' } },
        { t: 'deliver', name: 'slides_draft.pptx', kind: 'ppt', size: '2.4 MB', sent: { zh: '已发送到微信', en: 'Sent to WeChat' } }
      ]
    },
    feishu: {
      title: { zh: '项目群「研发」· @机器人 — CaresAgent', en: 'Project group · @bot — CaresAgent' },
      linked: ['feishu'],
      steps: [
        { t: 'inbound', ch: 'feishu', ctx: { zh: '项目群「研发」', en: 'Group · R&D' }, text: { zh: '@CaresAgent 把今天的销售数据 sales.csv 跑一下，要关键指标 + 异常点', en: '@CaresAgent run today’s sales.csv — key metrics + anomalies please' }, att: { name: 'sales.csv', kind: 'xls' } },
        { t: 'proc-start', title: { zh: '运行中', en: 'Processing' } },
        { t: 'narration', text: { zh: '我先校验这份 CSV 的字段、缺失值和异常分布。', en: 'Let me validate the CSV’s schema, missing values and outliers first.' } },
        { t: 'tool', icon: 'python', label: { zh: '执行 Python · pandas', en: 'Python code · pandas' } },
        { t: 'narration', text: { zh: '算出环比与 3 个异常点，正在整理成结论。', en: 'Computed MoM growth and 3 anomalies — assembling the findings.' } },
        { t: 'tool', icon: 'img', label: { zh: '执行 Python · matplotlib → metrics.png', en: 'Python code · matplotlib → metrics.png' } },
        { t: 'proc-end' },
        { t: 'answer', text: { zh: '本月 GMV 环比 +12.3%；华东转化率异常下滑 −4pt（建议核查投放）。指标图见下 👇', en: 'GMV +12.3% MoM; East-China conversion dipped −4pt (worth checking ad spend). Chart below 👇' } },
        { t: 'deliver', name: 'metrics.png', kind: 'img', size: '318 KB', sent: { zh: '已发送到飞书', en: 'Sent to Feishu' } }
      ]
    },
    wecom: {
      title: { zh: '智能机器人 · 内部直发 + 客户外发 — CaresAgent', en: 'AI bot · internal + customer outbound — CaresAgent' },
      linked: ['wecom'],
      steps: [
        { t: 'inbound', ch: 'wecom', text: { zh: '通知一下张工，明天的评审改到下午 3 点，并把会议链接发他。', en: 'Tell 张工 the review moved to 3pm tomorrow, and send him the meeting link.' } },
        { t: 'proc-start', title: { zh: '运行中', en: 'Processing' } },
        { t: 'narration', text: { zh: '先在可见范围通讯录里定位「张工」，再预定会议。', en: 'Locate 张工 in the visible directory, then book the meeting.' } },
        { t: 'tool', icon: 'target', label: { zh: '匹配企业微信联系人 · 张工', en: 'Match WeCom contacts · 张工' } },
        { t: 'tool', icon: 'link', label: { zh: '预定腾讯会议 · 2026-06-15 15:00', en: 'Book Tencent Meeting · 2026-06-15 15:00' } },
        { t: 'proc-end' },
        { t: 'outbound', status: 'sent', title: { zh: '已直接发出', en: 'Sent directly' }, targets: [{ zh: '同事·张工', en: 'Colleague · 张工' }], text: { zh: '评审改到明天 15:00，会议链接见下。', en: 'Review moved to tomorrow 15:00; meeting link below.' }, links: [{ zh: '会议链接', en: 'Meeting link' }] },
        { t: 'inbound', ch: 'wecom', text: { zh: '再把这条产品更新，群发给我的客户和客户群。', en: 'Also group-send this product update to my customers and customer groups.' } },
        { t: 'proc-start', title: { zh: '运行中', en: 'Processing' } },
        { t: 'narration', text: { zh: '客户外发不能由我直接发出 —— 我把它放进你本人的「群发助手」，你点一下发送即可。', en: 'I can’t send to customers directly — staging it in your own group-send assistant for you to tap Send.' } },
        { t: 'tool', icon: 'target', label: { zh: '发送企业微信消息 · 客户与客户群', en: 'Send WeCom message · customers & groups' } },
        { t: 'proc-end' },
        { t: 'outbound', status: 'pending', title: { zh: '已提交群发助手 · 待你在企业微信点发送', en: 'Staged in group-send assistant · tap Send in WeCom' }, targets: [{ zh: '客户·李总', en: 'Customer · 李总' }, { zh: '客户群·华东客户', en: 'Customer group · East China' }], text: { zh: 'v2.1 已发布：新增批量导出与图表模板…', en: 'v2.1 released: batch export & chart templates…' }, note: { zh: '去你的企业微信「群发助手」点一下「发送」即可真正发给客户。', en: 'Open WeCom → group-send assistant → tap Send to actually deliver.' } }
      ]
    },
    paperppt: {
      title: { zh: '阿尔茨海默病影像研究 — CaresAgent', en: "Alzheimer's Imaging Study — CaresAgent" },
      linked: [],
      steps: [
        { t: 'prompt', text: { zh: '把这篇 PDF 综述整理成 15 页研究汇报 PPT，图表用论文原图。', en: 'Turn this PDF review into a 15-slide research deck — use the paper’s original figures.' }, att: { name: 'review_2026.pdf', kind: 'pdf' } },
        { t: 'proc-start', title: { zh: '运行中', en: 'Processing' } },
        { t: 'narration', text: { zh: '我先解析论文结构，定位章节、图表位置与引用脉络。', en: 'Let me parse the paper structure — sections, figure positions and citation context.' } },
        { t: 'tool', icon: 'read', label: { zh: '翻开文档 · review_2026.pdf · 38 页', en: 'Open document · review_2026.pdf · 38 pages' } },
        { t: 'narration', text: { zh: '渲染对应页面后交给 CL-OCR：正文、表格(HTML)与公式(LaTeX)逐块识别，插图按版面裁出原图。', en: 'Render the named pages, then hand them to CL-OCR: text, tables (HTML) and formulas (LaTeX) block by block, figures cropped from the page by layout.' } },
        { t: 'tool', icon: 'scan', label: { zh: '识别文档文字 · 正文/表格/公式', en: 'OCR document text · text/tables/formulas' } },
        { t: 'tool', icon: 'img', label: { zh: '提取文档图片 · Figure 2/4/7 + Table 1 · 4 张', en: 'Extract document figures · Figure 2/4/7 + Table 1 · 4 crops' } },
        { t: 'narration', text: { zh: '套用克制的研究汇报风格，排版 15 页幻灯片。', en: 'Apply a restrained research style and lay out 15 slides.' } },
        { t: 'tool', icon: 'ppt', label: { zh: '生成 PPT · slides_draft.pptx', en: 'Create PowerPoint · slides_draft.pptx' } },
        { t: 'proc-end' },
        { t: 'answer', text: { zh: '完成 ✅ 15 页汇报 PPT，图表全部为论文原图（非 AI 臆造），按「背景 → 方法 → 影像发现 → 结论」编排。', en: 'Done ✅ A 15-slide deck — original paper figures (not AI-fabricated), ordered Background → Methods → Imaging findings → Conclusions.' } },
        { t: 'output', name: 'slides_draft.pptx', kind: 'ppt', size: { zh: '2.4 MB · 15 页', en: '2.4 MB · 15 slides' }, done: { zh: '已生成 · 可下载', en: 'Produced · download' } }
      ]
    },
    dataanalysis: {
      title: { zh: '季度销售数据分析 — CaresAgent', en: 'Quarterly Sales Analysis — CaresAgent' },
      linked: [],
      steps: [
        { t: 'prompt', text: { zh: '分析这份销售 CSV，给关键指标和异常点，注意数据质量。', en: 'Analyze this sales CSV — key metrics + anomalies, mind data quality.' }, att: { name: 'sales_q2.csv', kind: 'xls' } },
        { t: 'proc-start', title: { zh: '运行中', en: 'Processing' } },
        { t: 'narration', text: { zh: '先校验字段、缺失值与异常分布，再决定统计口径。', en: 'First validate schema, missing values and outliers, then fix the metric definitions.' } },
        { t: 'tool', icon: 'python', label: { zh: '执行 Python · pandas', en: 'Python code · pandas' } },
        { t: 'narration', text: { zh: '环比 +12.3%，华东转化率异常下滑；每项结论先对照数据核对，再写入报告。', en: '+12.3% MoM; East-China conversion dipped — every claim is checked against the data before it enters the report.' } },
        { t: 'tool', icon: 'img', label: { zh: '执行 Python · matplotlib → metrics.png', en: 'Python code · matplotlib → metrics.png' } },
        { t: 'proc-end' },
        { t: 'answer', text: { zh: '本月 GMV 环比 +12.3%；华东转化率 −4pt（建议核查投放）。每条结论都注明了数据来源。', en: 'GMV +12.3% MoM; East-China conversion −4pt (worth checking ad spend). Every claim cites its data source.' } },
        { t: 'output', name: 'report.pdf', kind: 'pdf', size: { zh: '420 KB · 含图表', en: '420 KB · with charts' }, done: { zh: '已生成 · 可下载', en: 'Produced · download' } }
      ]
    },
    ocr: {
      title: { zh: '扫描讲义 → 结构化 Markdown — CaresAgent', en: 'Scanned notes → structured Markdown — CaresAgent' },
      linked: [],
      steps: [
        { t: 'prompt', text: { zh: '把这页扫描讲义转成可编辑 Markdown：公式用 LaTeX、表格保留结构，插图也裁出来。', en: 'Turn this scanned page into editable Markdown — LaTeX formulas, structured tables, and crop the figure too.' }, att: { name: 'notes_p3.jpg', kind: 'img' } },
        { t: 'proc-start', title: { zh: '运行中', en: 'Processing' } },
        { t: 'narration', text: { zh: '这是一张图片，直接交给 CL-OCR 文档模型，而不是让通用多模态去「看」。', en: 'It’s an image — hand it to the CL-OCR document model rather than asking a general multimodal model to “read” it.' } },
        { t: 'tool', icon: 'scan', label: { zh: '识别文档文字 · notes_p3.jpg → Markdown', en: 'OCR document text · notes_p3.jpg → Markdown' } },
        { t: 'narration', text: { zh: '正文按阅读顺序、表格转 HTML、公式转 LaTeX；插图再按版面裁出原图。', en: 'Text in reading order, tables to HTML, formulas to LaTeX; the figure is cropped from the page by layout.' } },
        { t: 'tool', icon: 'img', label: { zh: '提取文档图片 · notes_p3.jpg · 1 图', en: 'Extract document figures · notes_p3.jpg · 1 figure' } },
        { t: 'proc-end' },
        { t: 'answer', text: { zh: '已转为 Markdown：1 段正文、1 个表格(HTML)、3 个公式(LaTeX)、1 张裁出的插图，保持阅读顺序。原文↔解析可在阅读器里逐块核对。', en: 'Converted to Markdown: 1 text block, 1 table (HTML), 3 formulas (LaTeX) and 1 cropped figure, in reading order. Check it block-by-block against the original in the reader.' } },
        { t: 'output', name: 'notes_p3.md', kind: 'md', size: { zh: '含 1 表 · 3 公式 · 1 图', en: '1 table · 3 formulas · 1 figure' }, done: { zh: '已生成 · 可下载', en: 'Produced · download' } }
      ]
    },
    browserqa: {
      title: { zh: '登录流程回归测试 — CaresAgent', en: 'Login Flow QA — CaresAgent' },
      linked: [],
      steps: [
        { t: 'prompt', text: { zh: '检查 staging 站点的登录流程是否正常，并截图为证。', en: 'Check the staging login flow works and capture screenshots as proof.' } },
        { t: 'proc-start', title: { zh: '运行中', en: 'Processing' } },
        { t: 'narration', text: { zh: '我用共享浏览器走一遍登录流程，逐步截图留证。', en: 'Walk the login flow in the shared browser, capturing screenshots along the way.' } },
        { t: 'tool', icon: 'search', label: { zh: '浏览网页 · 打开 staging → 填写表单 → 提交', en: 'Web browsing · open staging → fill form → submit' } },
        { t: 'narration', text: { zh: '登录成功并跳转到工作台，逐步留存了截图证据。', en: 'Login succeeded and routed to the workbench; captured step-by-step screenshots.' } },
        { t: 'tool', icon: 'img', label: { zh: '截图 · login_ok.png / dashboard.png', en: 'Screenshot · login_ok.png / dashboard.png' } },
        { t: 'proc-end' },
        { t: 'answer', text: { zh: '通过 ✅ 登录流程正常：表单校验、提交、跳转均符合预期，3 张截图为证。', en: 'Pass ✅ Login works — validation, submit and redirect all as expected, 3 screenshots attached.' } },
        { t: 'output', name: 'login_ok.png', kind: 'img', size: { zh: '1440×900', en: '1440×900' }, done: { zh: '已生成 · 可下载', en: 'Produced · download' } }
      ]
    },
    mpdraft: {
      title: { zh: 'CAIR 公众号 · 本周 AI 资讯 — CaresAgent', en: 'WeChat OA · Weekly AI News — CaresAgent' },
      linked: [],
      steps: [
        { t: 'prompt', text: { zh: '把本周 CAIR 公众号合集里的 AI 资讯整理成一篇草稿推送。', en: 'Compile this week’s AI items from our CAIR OA album into a draft.' } },
        { t: 'proc-start', title: { zh: '运行中', en: 'Processing' } },
        { t: 'narration', text: { zh: '我从公众号合集源抓取本周文章，按关键词筛 6–8 条。', en: 'Fetch this week’s articles from the OA album source and filter 6–8 by keyword.' } },
        { t: 'tool', icon: 'search', label: { zh: '抓取源文章 · 专辑 · 23 → 7', en: 'Fetch source articles · album · 23 → 7' } },
        { t: 'narration', text: { zh: '整理摘要、配图与排版，生成草稿（推送前需你确认）。', en: 'Summarize, pick images, format — create a draft (publishing waits for your confirmation).' } },
        { t: 'tool', icon: 'file', label: { zh: '创建公众号草稿 · 草稿箱', en: 'Create WeChat draft · draft box' } },
        { t: 'proc-end' },
        { t: 'answer', text: { zh: '已生成本周 AI 资讯草稿（7 条），保存在公众号草稿箱，等你在后台确认后发布。', en: 'Drafted this week’s AI digest (7 items) into the OA draft box — confirm in the console to publish.' } },
        { t: 'output', name: 'ai_news_draft', kind: 'img', size: { zh: '7 条 · 已排版', en: '7 items · formatted' }, done: { zh: '已存入草稿箱', en: 'Saved to draft box' } }
      ]
    }
  };

  function Player(root) {
    var id = root.getAttribute('data-player');
    var script = SCRIPTS[id];
    if (!script) return;
    var stage, timers = [], proc = null, started = false;

    function setTitle() {
      var tEl = root.querySelector('.cv-title');
      if (tEl) tEl.textContent = L(script.title);
      var lb = root.querySelector('[data-linkbadge]');
      if (lb) {
        lb.innerHTML = (script.linked || []).map(function (c) {
          return '<span class="chip" style="background-image:url(' + CHANNELS[c].icon + ')"></span>';
        }).join('');
      }
    }

    function clearAll() {
      timers.forEach(clearTimeout);
      timers = [];
      if (proc && proc.timerInt) clearInterval(proc.timerInt);
      proc = null;
    }

    function appear(el) {
      stage.appendChild(el);
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('show'); }); });
    }

    function makeInbound(s) {
      var ch = CHANNELS[s.ch];
      var ctx = s.ctx ? '<span class="ctx"> · ' + L(s.ctx) + '</span>' : '';
      var att = s.att
        ? '<span class="att">' + svg(s.att.kind === 'xls' ? 'xls' : s.att.kind === 'img' ? 'img' : 'file', '') + s.att.name + '</span>'
        : '';
      var el = document.createElement('div');
      el.className = 'cv-step cv-inbound';
      el.innerHTML =
        '<span class="cv-channel-badge"><span class="ci" style="background-image:url(' + ch.icon + ')"></span>' +
        (currentLang === 'en' ? 'via ' + L(ch.name) : '来自' + L(ch.name)) + ctx + '</span>' +
        '<div class="cv-bubble">' + L(s.text) + att + '</div>';
      return el;
    }

    // 桌面端：用户直接输入的提问（无渠道徽标）
    function makePrompt(s) {
      var att = s.att
        ? '<span class="att">' + svg(s.att.kind === 'xls' ? 'xls' : s.att.kind === 'img' ? 'img' : 'file', '') + s.att.name + '</span>'
        : '';
      var el = document.createElement('div');
      el.className = 'cv-step cv-inbound cv-prompt';
      el.innerHTML = '<div class="cv-bubble">' + L(s.text) + att + '</div>';
      return el;
    }

    function startProc(s) {
      var el = document.createElement('div');
      el.className = 'cv-step cv-process';
      el.innerHTML =
        '<div class="cv-process-head"><span class="cv-dot is-live"></span>' +
        '<span class="cv-proc-title">' + L(s.title) + '</span>' +
        '<span class="cv-timer">0s</span></div><div class="cv-feed"></div>';
      proc = { el: el, feed: el.querySelector('.cv-feed'), title: el.querySelector('.cv-proc-title'), dot: el.querySelector('.cv-dot'), timer: el.querySelector('.cv-timer'), start: Date.now() };
      proc.timerInt = setInterval(function () {
        if (!proc) return;
        proc.timer.textContent = Math.round((Date.now() - proc.start) / 1000) + 's';
      }, 250);
      return el;
    }

    function addNarration(s) {
      if (!proc) return;
      var p = document.createElement('p');
      p.className = 'cv-narration shiny';
      p.textContent = L(s.text);
      proc.feed.appendChild(p);
      timers.push(setTimeout(function () { p.classList.remove('shiny'); }, 1300));
    }

    function addTool(s) {
      if (!proc) return;
      var row = document.createElement('div');
      row.className = 'cv-tool';
      row.innerHTML = svg(s.icon, 'tk-ico running') + '<code>' + L(s.label) + '</code>';
      proc.feed.appendChild(row);
      timers.push(setTimeout(function () {
        var ic = row.querySelector('.tk-ico');
        if (ic) { ic.classList.remove('running'); ic.outerHTML = svg('check', 'tk-ico'); }
      }, 850));
    }

    function endProc() {
      if (!proc) return;
      if (proc.timerInt) clearInterval(proc.timerInt);
      proc.dot.classList.remove('is-live');
      proc.dot.classList.add('is-done');
      proc.title.textContent = currentLang === 'en' ? 'Processed' : '已处理';
      proc = null;
    }

    function makeAnswer(s) {
      var el = document.createElement('div');
      el.className = 'cv-step cv-answer';
      el.innerHTML = '<p>' + L(s.text) + '<span class="caret"></span></p>';
      timers.push(setTimeout(function () {
        var c = el.querySelector('.caret');
        if (c) c.remove();
      }, 2400));
      return el;
    }

    function makeDeliver(s) {
      var el = document.createElement('div');
      el.className = 'cv-step cv-deliver';
      el.innerHTML =
        '<span class="f-ico ' + s.kind + '">' + s.kind.toUpperCase() + '</span>' +
        '<span class="f-main"><span class="f-name">' + s.name + '</span><span class="f-meta">' + s.size + '</span></span>' +
        '<span class="f-sent">' + svg('check', '') + L(s.sent) + '</span>';
      return el;
    }

    // 桌面端：生成的输出（下载卡）
    function makeOutput(s) {
      var sz = typeof s.size === 'string' ? s.size : L(s.size);
      var el = document.createElement('div');
      el.className = 'cv-step cv-deliver cv-output';
      el.innerHTML =
        '<span class="f-ico ' + s.kind + '">' + s.kind.toUpperCase() + '</span>' +
        '<span class="f-main"><span class="f-name">' + s.name + '</span><span class="f-meta">' + sz + '</span></span>' +
        '<span class="f-sent">' + svg('check', '') + (s.done ? L(s.done) : (currentLang === 'en' ? 'Produced' : '已生成')) + '</span>';
      return el;
    }

    function makeOutbound(s) {
      var ic = s.status === 'sent' ? 'check' : s.status === 'pending' ? 'clock' : 'alert';
      var targets = (s.targets || []).map(function (t) { return '<span class="tg">' + L(t) + '</span>'; }).join('');
      var links = (s.links || []).map(function (l) { return '<span class="lk">' + svg('link', '') + L(l) + '</span>'; }).join('');
      var el = document.createElement('div');
      el.className = 'cv-step cv-outbound ' + s.status;
      el.innerHTML =
        '<div class="cv-ob-head"><span class="cv-ob-ico">' + svg(ic, '') + '</span><span class="cv-ob-title">' + L(s.title) + '</span></div>' +
        (targets ? '<div class="cv-ob-targets">' + targets + '</div>' : '') +
        (s.text ? '<p class="cv-ob-text">' + L(s.text) + '</p>' : '') +
        (links ? '<div class="cv-ob-links">' + links + '</div>' : '') +
        (s.note ? '<p class="cv-ob-note">' + L(s.note) + '</p>' : '');
      return el;
    }

    function play() {
      started = true; // any direct play (replay btn / lang toggle) disarms the one-shot scroll observer
      clearAll();
      stage = root.querySelector('.cv-stage');
      stage.innerHTML = '';
      setTitle();
      var t = 0;
      var DELAY = { inbound: 700, prompt: 700, 'proc-start': 650, narration: 1500, tool: 950, 'proc-end': 700, answer: 850, deliver: 750, output: 800, outbound: 850 };
      script.steps.forEach(function (s, i) {
        t += DELAY[s.t] != null ? DELAY[s.t] : 700;
        timers.push(setTimeout(function () {
          if (s.t === 'inbound') appear(makeInbound(s));
          else if (s.t === 'prompt') appear(makePrompt(s));
          else if (s.t === 'proc-start') appear(startProc(s));
          else if (s.t === 'narration') addNarration(s);
          else if (s.t === 'tool') addTool(s);
          else if (s.t === 'proc-end') endProc();
          else if (s.t === 'answer') appear(makeAnswer(s));
          else if (s.t === 'deliver') appear(makeDeliver(s));
          else if (s.t === 'output') appear(makeOutput(s));
          else if (s.t === 'outbound') appear(makeOutbound(s));
          stage.scrollTop = stage.scrollHeight;
        }, t));
      });
    }

    // Tab 面板内的播放器由 Tab 控制器驱动；否则滚动进入视区自动播放一次
    var inTab = !!(root.closest && root.closest('[data-lab-panel]'));
    if (!inTab && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (en.isIntersecting && !started) { started = true; play(); io.unobserve(root); }
        });
      }, { threshold: 0.35 });
      io.observe(root);
    } else if (!inTab) {
      play();
    }

    var replay = root.parentElement && root.parentElement.querySelector('[data-replay]');
    if (replay) replay.addEventListener('click', play);

    this.replay = play;
    this.stop = clearAll;
    this.reset = function () { clearAll(); setTitle(); };
    root._player = this;
  }

  /* ---------------- 核心能力小演示（plan / permission） ---------------- */
  function initCoreDemos() {
    // plan rail：循环点亮
    document.querySelectorAll('[data-plan-demo]').forEach(function (root) {
      var steps = Array.prototype.slice.call(root.querySelectorAll('.cd-plan-step'));
      if (!steps.length) return;
      function setIcon(step, kind) {
        var slot = step.querySelector('.pico');
        if (!slot) return;
        if (kind === 'done') slot.innerHTML = '<span class="pico-done">' + svg('check', '') + '</span>';
        else if (kind === 'running') slot.innerHTML = '<span class="pico-run"></span>';
        else slot.innerHTML = '<span class="pico-ring"></span>';
      }
      var idx = 0;
      function tick() {
        steps.forEach(function (s, i) {
          s.classList.remove('running', 'done', 'pending');
          if (i < idx) { s.classList.add('done'); setIcon(s, 'done'); }
          else if (i === idx) { s.classList.add('running'); setIcon(s, 'running'); }
          else { s.classList.add('pending'); setIcon(s, 'pending'); }
        });
        idx++;
        if (idx > steps.length) { idx = 0; }
      }
      tick();
      // 尊重 reduced-motion：不再循环点亮（tick() 已先渲染一个静态状态）
      var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduceMotion) {
        // 仅在进入视区时循环，离屏暂停，省主线程
        if ('IntersectionObserver' in window) {
          var loopId = null;
          var pio = new IntersectionObserver(function (ents) {
            ents.forEach(function (en) {
              if (en.isIntersecting) { if (!loopId) loopId = setInterval(tick, 1400); }
              else if (loopId) { clearInterval(loopId); loopId = null; }
            });
          }, { rootMargin: '80px' });
          pio.observe(root);
        } else {
          setInterval(tick, 1400);
        }
      }
    });

    // permission：点击 Allow 切换为已授权
    document.querySelectorAll('[data-perm-demo]').forEach(function (root) {
      var btn = root.querySelector('.pg-allow');
      if (!btn) return;
      var orig = btn.textContent;
      btn.addEventListener('click', function () {
        root.classList.add('granted');
        btn.innerHTML = svg('check', '').replace('viewBox', 'style="width:14px;height:14px;vertical-align:-2px" viewBox') + ' ' + (currentLang === 'en' ? 'Allowed' : '已允许');
        setTimeout(function () {
          root.classList.remove('granted');
          btn.textContent = orig;
        }, 2200);
      });
    });
  }

  /* ---------------- 「实战演示」Tab 控制器 ---------------- */
  function initTabs() {
    document.querySelectorAll('[data-lab]').forEach(function (lab) {
      var tabs = Array.prototype.slice.call(lab.querySelectorAll('[data-tab]'));
      var panels = Array.prototype.slice.call(lab.querySelectorAll('[data-lab-panel]'));
      if (!tabs.length) return;
      function panelFor(key) {
        return panels.filter(function (p) { return p.getAttribute('data-lab-panel') === key; })[0];
      }
      function stopPanel(p) {
        if (!p) return;
        p.querySelectorAll('[data-player]').forEach(function (r) { if (r._player) r._player.stop(); });
        p.querySelectorAll('[data-connect]').forEach(function (r) { if (r._cc) r._cc.stop(); });
      }
      function playPanel(p) {
        if (!p) return;
        p.querySelectorAll('[data-player]').forEach(function (r) { if (r._player) r._player.replay(); });
        p.querySelectorAll('[data-connect]').forEach(function (r) { if (r._cc) r._cc.autoPlay(); });
      }
      var current = tabs[0].getAttribute('data-tab');
      function activate(key, doPlay) {
        tabs.forEach(function (t) {
          var on = t.getAttribute('data-tab') === key;
          t.classList.toggle('active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        panels.forEach(function (p) {
          var on = p.getAttribute('data-lab-panel') === key;
          p.hidden = !on;
          if (!on) stopPanel(p);
        });
        current = key;
        if (doPlay) playPanel(panelFor(key));
      }
      tabs.forEach(function (t) {
        t.addEventListener('click', function () { activate(t.getAttribute('data-tab'), true); });
      });
      activate(current, false);
      // 首次滚动进入视区时播放当前 tab
      var played = false;
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (ents) {
          ents.forEach(function (en) {
            if (en.isIntersecting && !played) { played = true; playPanel(panelFor(current)); }
          });
        }, { threshold: 0.2 });
        io.observe(lab);
      } else {
        playPanel(panelFor(current));
      }
      lab._activateTab = activate;
    });
  }

  /* ---------------- 下载卡：OS 检测 + SHA 复制（兼容 v1 主页） ---------------- */
  function initDownload() {
    if (!document.querySelector('.dl-card')) return;
    var ua = navigator.userAgent, plat = navigator.platform || '';
    var os = /Mac|iPhone|iPad/i.test(plat) || /Macintosh/i.test(ua) ? 'mac'
      : /Win/i.test(plat) || /Windows/i.test(ua) ? 'win'
      : /Linux/i.test(plat) && !/Android/i.test(ua) ? 'linux' : 'mac';
    var card = document.querySelector('.dl-card[data-os="' + os + '"]');
    if (card) {
      card.classList.add('detected');
      var pill = card.querySelector('.dl-recommend');
      if (pill) pill.hidden = false;
    }
    // Fill the (otherwise empty) download buttons from downloads/manifest.json.
    // An absent or failed fetch leaves the buttons in their "coming soon"
    // fallback state.
    fetch('downloads/manifest.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) {
        if (!m || !m.builds) return;
        document.querySelectorAll('.dl-card').forEach(function (c) {
          var b = m.builds.filter(function (x) { return x.os === c.getAttribute('data-os'); })[0];
          if (!b) return;
          var a = c.querySelector('.dl-btn');
          if (a) { a.setAttribute('href', b.url); a.removeAttribute('aria-disabled'); a.classList.remove('is-soon'); }
          var meta = c.querySelector('.dl-meta');
          if (meta && b.size) meta.textContent = b.ext + ' · ' + b.size;
          var sha = c.querySelector('.dl-sha');
          if (sha && b.sha256) {
            sha.setAttribute('data-sha', b.sha256);
            var code = sha.querySelector('code');
            if (code) code.textContent = b.sha256.slice(0, 6) + '…' + b.sha256.slice(-6);
            sha.hidden = false;
          }
        });
      })
      .catch(function () {});
    document.querySelectorAll('.dl-sha').forEach(function (btn) {
      var label = btn.querySelector('.sha-copy');
      var timer = null;
      btn.addEventListener('click', function () {
        var sha = btn.getAttribute('data-sha') || '';
        function done() {
          if (label) label.textContent = currentLang === 'en' ? 'Copied ✓' : '已复制 ✓';
          clearTimeout(timer);
          timer = setTimeout(function () { if (label) label.textContent = currentLang === 'en' ? 'Copy' : '复制'; }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(sha).then(done, done);
        else done();
      });
    });
  }

  /* ---------------- 使用与配置 走查动画 ---------------- */
  function ConfigWalk(root) {
    var navs = root.querySelectorAll('[data-cfgnav]');
    var panes = root.querySelectorAll('[data-cfgpane]');
    var timers = [];
    var started = false;
    function clearAll() { timers.forEach(clearTimeout); timers = []; }
    function setActive(key) {
      navs.forEach(function (n) { n.classList.toggle('active', n.getAttribute('data-cfgnav') === key); });
      panes.forEach(function (p) { p.classList.toggle('show', p.getAttribute('data-cfgpane') === key); });
    }
    function typeInto(input, done) {
      var full = input.getAttribute('data-type') || '';
      input.classList.add('typing');
      var i = 0;
      function step() {
        i++;
        var shown = full.slice(0, i).replace(/&/g, '&amp;').replace(/</g, '&lt;');
        input.innerHTML = '<span>' + shown + '</span><span class="cfg-cursor"></span>';
        if (i < full.length) timers.push(setTimeout(step, 36));
        else timers.push(setTimeout(function () {
          input.innerHTML = '<span>' + full.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>';
          input.classList.remove('typing');
          if (done) done();
        }, 260));
      }
      timers.push(setTimeout(step, 160));
    }
    function reset() {
      clearAll();
      setActive('project');
      root.querySelectorAll('.cfg-menu-item').forEach(function (m) { m.classList.remove('hl'); });
      root.querySelectorAll('.cfg-folder').forEach(function (f) { f.classList.remove('picked'); });
      root.querySelectorAll('.cfg-input').forEach(function (inp) {
        inp.innerHTML = '<span class="ph">' + (inp.getAttribute('data-ph') || '') + '</span>';
        inp.classList.remove('typing');
      });
      root.querySelectorAll('.cfg-ch').forEach(function (c) {
        c.classList.remove('on');
        var st = c.querySelector('.st');
        if (st && c.getAttribute('data-ch')) st.textContent = currentLang === 'en' ? 'Not connected' : '未连接';
      });
    }
    var CHK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4 4 10-10.5"/></svg>';
    function play() {
      started = true;
      reset();
      // 场景一：侧栏「项目」菜单 —— 高亮「打开文件夹」，项目路径落定
      timers.push(setTimeout(function () {
        var open = root.querySelectorAll('[data-cfgpane="project"] .cfg-menu-item')[1];
        if (open) open.classList.add('hl');
        timers.push(setTimeout(function () {
          var f = root.querySelector('[data-cfgpane="project"] .cfg-folder');
          if (f) f.classList.add('picked');
          timers.push(setTimeout(goModel, 1400));
        }, 900));
      }, 700));
      // 场景二：设置·模型 —— 三个字段依次键入（即时生效，无保存态）
      function goModel() {
        setActive('model');
        var inputs = Array.prototype.slice.call(root.querySelectorAll('[data-cfgpane="model"] .cfg-input'));
        function chain(idx) {
          if (idx >= inputs.length) { timers.push(setTimeout(goChannel, 1200)); return; }
          typeInto(inputs[idx], function () { chain(idx + 1); });
        }
        timers.push(setTimeout(function () { chain(0); }, 480));
      }
      // 场景三：连接手机（可选）—— 微信 未连接 → 连接中 → 已连接
      function goChannel() {
        setActive('channel');
        timers.push(setTimeout(function () {
          var ch = root.querySelector('.cfg-ch[data-ch="wechat"]');
          var st = ch && ch.querySelector('.st');
          if (st) st.textContent = currentLang === 'en' ? 'Connecting…' : '连接中…';
          timers.push(setTimeout(function () {
            if (ch) ch.classList.add('on');
            if (st) st.innerHTML = CHK + '<span>' + (currentLang === 'en' ? 'Connected' : '已连接') + '</span>';
          }, 1200));
        }, 520));
      }
    }
    reset();
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting && !started) { play(); io.unobserve(root); } });
      }, { threshold: 0.4 });
      io.observe(root);
    } else { play(); }
    var rb = root.parentElement && root.parentElement.querySelector('[data-cfg-replay]');
    if (rb) rb.addEventListener('click', play);
    this.replay = play;
    root._cfg = this;
  }

  /* ---------------- 启动 ---------------- */
  var connectControllers = [];
  var players = [];

  function setRibbonHeight() {
    var ribbon = document.querySelector('.demo-ribbon');
    if (ribbon) document.documentElement.style.setProperty('--ribbon-h', ribbon.offsetHeight + 'px');
  }

  function boot() {
    applyStatic(currentLang);
    setRibbonHeight();
    window.addEventListener('resize', setRibbonHeight);
    initReveal();
    initNav();
    initNavActive();
    initAnimPause();
    document.querySelectorAll('[data-connect]').forEach(function (root) {
      connectControllers.push(new ConnectController(root));
    });
    document.querySelectorAll('[data-player]').forEach(function (root) {
      players.push(new Player(root));
    });
    initCoreDemos();
    initTabs();
    initDownload();
    initTermDemo();
    initUsageDemo();
    document.querySelectorAll('[data-cfgwalk]').forEach(function (root) { new ConfigWalk(root); });

    var toggle = document.getElementById('langToggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        currentLang = currentLang === 'en' ? 'zh' : 'en';
        applyStatic(currentLang);
        connectControllers.forEach(function (c) { c.rerender(); });
        players.forEach(function (p) { p.replay(); });
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
