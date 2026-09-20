// 다국어(ko/ja/en). 한국어 원문이 곧 키라서 코드에는 원문을 그대로 두고 T("원문", 값...)으로 감싼다.
// 정적 HTML은 로드할 때 한 번 훑어서 사전에 있는 문장을 바꾸고, JS가 나중에 만드는 문구는 관찰자가 같은 방식으로 바꾼다.
// 언어를 바꾸면 페이지를 다시 불러온다 (진행 상황은 이미 localStorage에 저장돼 있다).
(function (global) {
  "use strict";

  const SUPPORTED = ["ko", "ja", "en"];
  const LS = "pz_lang";
  let lang = "ko";
  try {
    const saved = localStorage.getItem(LS);
    if (SUPPORTED.includes(saved)) lang = saved;
    else {
      const n = (navigator.language || "ko").slice(0, 2).toLowerCase();
      lang = n === "ja" ? "ja" : n === "en" ? "en" : "ko";
    }
  } catch (e) {}

  const DICT = {};
  const idx = lang === "ja" ? 0 : 1;
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const HANGUL = /[가-힣]/;

  function T(key, ...args) {
    let s = key;
    if (lang !== "ko") {
      const e = DICT[key];
      if (e) s = e[idx];
    }
    return args.length ? s.replace(/\{(\d+)\}/g, (m, i) => (args[i] !== undefined ? args[i] : m)) : s;
  }

  const missing = new Set();
  function tr(text) {
    if (lang === "ko" || !HANGUL.test(text)) return text;
    const key = norm(text);
    const e = DICT[key];
    if (!e) {
      missing.add(key);
      return text;
    }
    const lead = text.match(/^\s*/)[0];
    const trail = text.match(/\s*$/)[0];
    return lead + e[idx] + trail;
  }

  const ATTRS = ["aria-label", "title", "alt", "placeholder"];
  function translateNode(root) {
    if (lang === "ko") return;
    if (root.nodeType === 3) {
      const p = root.parentNode;
      if (p && (p.nodeName === "SCRIPT" || p.nodeName === "STYLE")) return;
      const v = tr(root.nodeValue);
      if (v !== root.nodeValue) root.nodeValue = v;
      return;
    }
    if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n = root;
    do {
      if (n.nodeType === 3) translateNode(n);
      else if (n.nodeName !== "SCRIPT" && n.nodeName !== "STYLE") {
        for (const a of ATTRS) if (n.hasAttribute && n.hasAttribute(a)) {
          const v = tr(n.getAttribute(a));
          if (v !== n.getAttribute(a)) n.setAttribute(a, v);
        }
      }
    } while ((n = w.nextNode()));
  }

  function start() {
    document.documentElement.lang = lang;
    if (lang !== "ko") {
      translateNode(document.documentElement);
      document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"]').forEach((meta) => {
        meta.setAttribute("content", tr(meta.getAttribute("content")));
      });
      new MutationObserver((records) => {
        for (const r of records) {
          if (r.type === "childList") r.addedNodes.forEach(translateNode);
          else if (r.type === "characterData") translateNode(r.target);
          else if (r.type === "attributes") {
            const v = tr(r.target.getAttribute(r.attributeName));
            if (v !== r.target.getAttribute(r.attributeName)) r.target.setAttribute(r.attributeName, v);
          }
        }
      }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    }
    const host = document.querySelector("[data-lang-host], .header-inner");
    if (host) {
      const box = document.createElement("div");
      box.className = "lang-switch";
      box.setAttribute("role", "group");
      box.setAttribute("aria-label", "Language");
      [["ko", "한"], ["ja", "日"], ["en", "EN"]].forEach(([code, label]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        b.lang = code;
        if (code === lang) b.className = "active";
        b.addEventListener("click", () => {
          if (code === lang) return;
          try {
            localStorage.setItem(LS, code);
          } catch (e) {}
          location.reload();
        });
        box.appendChild(b);
      });
      host.appendChild(box);
    }
  }

  global.T = T;
  global.Lang = {
    get: () => lang,
    t: T,
    add: (d) => Object.assign(DICT, d),
    missing: () => [...missing]
  };
  // 동기 스크립트라서 <body>가 있을 때만 바로 시작하고, 아니면 DOM이 다 만들어진 뒤 시작한다.
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(window);
