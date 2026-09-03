window.__ModuleLoader__.load({ id: "amadeus-for-dsh", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// package/client.mjs
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);
var import_react = __toESM(require("react"), 1);
var inject = ["timer", "slots"];
function apply(ctx) {
  const slots = ctx.get("slots");
  if (slots === void 0) return;
  const layout = ctx.get("layout");
  const hostLocal = {
    call: async (m, args) => {
      const res = await fetch("/amadeus/rpc?m=" + encodeURIComponent(m) + "&args=" + encodeURIComponent(JSON.stringify(args || {})), { cache: "no-store" });
      return await res.json();
    }
  };
  function domCss(css) {
    const st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
    return () => {
      try {
        st.remove();
      } catch (e) {
      }
    };
  }
  const removeCss = domCss(
    ".amad-col{display:flex;flex-direction:column;height:100%;min-height:440px;background:var(--dsw-alias-bg-base,transparent);border-left:1px solid var(--dsw-alias-border-l1,transparent);}.amad-header{display:flex;align-items:center;gap:6px;padding:8px 10px;user-select:none;background:linear-gradient(90deg,rgba(163,67,59,.45),rgba(163,67,59,.12));border-bottom:1px solid rgba(255,255,255,.1);flex:none;}.amad-dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex:none;}.amad-title{font-weight:700;letter-spacing:2px;color:var(--dsw-alias-label-primary,#f2e9e6);font-size:13px;}.amad-sub{font-size:10px;color:var(--dsw-alias-label-secondary,#9a8f8b);margin-right:auto;}.amad-btn{border:0;background:rgba(255,255,255,.08);color:inherit;width:24px;height:24px;border-radius:6px;font-size:12px;cursor:pointer;line-height:1;padding:0;flex:none;}.amad-btn:hover{background:rgba(255,255,255,.18);}.amad-frame{flex:1;min-height:300px;width:100%;border:0;display:block;background:transparent;}.amad-footer{padding:4px 10px;font-size:10px;color:var(--dsw-alias-label-secondary,#8d8380);border-top:1px solid rgba(255,255,255,.08);flex:none;}.amad-settings-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 4px;border-bottom:1px solid rgba(128,128,128,.18);}.amad-settings-label{font-weight:600;}.amad-settings-desc{font-size:12px;color:#9a8f8b;margin-top:2px;}.amad-settings select{border:1px solid rgba(128,128,128,.4);border-radius:6px;padding:4px 8px;background:transparent;color:inherit;}.amad-settings-btn{border:1px solid rgba(128,128,128,.4);background:transparent;color:inherit;border-radius:6px;padding:5px 12px;cursor:pointer;margin-right:8px;}.amad-settings-btn:hover{background:rgba(128,128,128,.15);}.amad-sb-btn{border:0;background:transparent;color:inherit;cursor:pointer;font-size:12px;padding:6px 10px;border-radius:6px;display:flex;align-items:center;gap:6px;}.amad-sb-btn:hover{background:rgba(128,128,128,.15);}.amad-warn{margin-top:14px;font-size:12px;color:#b08968;}"
  );
  ctx.effect(() => removeCss);
  const theme = ctx.get("theme");
  const AMADEUS_TOKENS = {
    "--dsw-alias-bg-base": { light: "#170b0e", dark: "#170b0e" },
    "--dsw-alias-bg-layer-1": { light: "#200f13", dark: "#200f13" },
    "--dsw-alias-bg-layer-2": { light: "#2a1419", dark: "#2a1419" },
    "--dsw-alias-bg-overlay": { light: "#331a20", dark: "#331a20" },
    "--dsw-alias-border-l1": { light: "#42262c", dark: "#42262c" },
    "--dsw-alias-border-l2": { light: "#5a333c", dark: "#5a333c" },
    "--dsw-alias-brand-primary": { light: "#e0604f", dark: "#e0604f" },
    "--dsw-alias-label-primary": { light: "#f2e4e1", dark: "#f2e4e1" },
    "--dsw-alias-label-secondary": { light: "#b49a93", dark: "#b49a93" },
    "--dsw-alias-state-error-primary": { light: "#ff6f61", dark: "#ff6f61" },
    "--dsw-alias-state-success-primary": { light: "#7fd47f", dark: "#7fd47f" },
    "--dsw-alias-state-warn-primary": { light: "#e0a06a", dark: "#e0a06a" },
    "--dsw-specific-sidebar-fill": { light: "#1a0c10", dark: "#1a0c10" }
  };
  let themeLayer = null;
  function applyTheme(on) {
    if (theme === void 0) return;
    if (on && themeLayer === null) {
      try {
        themeLayer = theme.overrideTokens("amade-theme", AMADEUS_TOKENS);
      } catch (e) {
        console.error("[amadeus] \u4E3B\u9898\u8986\u76D6\u5931\u8D25", e);
        themeLayer = null;
      }
    } else if (!on && themeLayer !== null) {
      try {
        themeLayer();
      } catch (e) {
      }
      themeLayer = null;
    }
  }
  function createStore(initial) {
    let value = initial;
    const subs = [];
    return {
      get: () => value,
      set: (next) => {
        if (next === value) return;
        value = next;
        for (let i = 0; i < subs.length; i++) subs[i]();
      },
      subscribe: (fn) => {
        subs.push(fn);
        return () => {
          const i = subs.indexOf(fn);
          if (i >= 0) subs.splice(i, 1);
        };
      }
    };
  }
  function useStore(store) {
    const [v, setV] = import_react.default.useState(store.get());
    import_react.default.useEffect(() => store.subscribe(() => setV(store.get())), []);
    return v;
  }
  const configStore = createStore(null);
  const statusStore = createStore({ tts: "", queue: 0, cache: 0, error: "", callPending: false, pendingClose: null });
  function encURI(s) {
    const bytes = new TextEncoder().encode(String(s));
    let out = "";
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      const c = String.fromCharCode(b);
      if (c >= "A" && c <= "Z" || c >= "a" && c <= "z" || c >= "0" && c <= "9" || c === "-" || c === "_" || c === "." || c === "~") out += c;
      else out += "%" + (b < 16 ? "0" : "") + b.toString(16).toUpperCase();
    }
    return out;
  }
  let lastConfigJson = "";
  let lastStatusJson = "";
  let lastCallPending = false;
  let lastPendingClose = null;
  async function refreshStatus() {
    try {
      const res = await hostLocal.call("getStatus", {});
      if (res && typeof res === "object") {
        const cfg = res.config || null;
        let cfgJson = "";
        try {
          cfgJson = cfg ? JSON.stringify(cfg) : "";
        } catch (e) {
          cfgJson = "";
        }
        if (cfgJson !== lastConfigJson) {
          lastConfigJson = cfgJson;
          configStore.set(cfg);
          applyTheme(cfg ? cfg.themeOn !== false : true);
        }
        const st = { tts: res.tts || "", queue: res.queue || 0, cache: res.cache || 0, error: "", callPending: res.callPending === true, pendingClose: typeof res.pendingClose === "number" ? res.pendingClose : null };
        const stJson = JSON.stringify(st);
        if (stJson !== lastStatusJson) {
          lastStatusJson = stJson;
          statusStore.set(st);
        }
        if (res.callPending === true && !lastCallPending) {
          lastCallPending = true;
          openDetailsSafe();
        }
        if (res.callPending !== true) lastCallPending = false;
        if (typeof res.pendingClose === "number" && res.pendingClose !== lastPendingClose) {
          lastPendingClose = res.pendingClose;
          try {
            if (layout) layout.closeDetails();
          } catch (e) {
          }
          hostLocal.call("ackClose", {}).catch(() => {
          });
        }
        if (typeof res.pendingClose !== "number") lastPendingClose = null;
      }
    } catch (e) {
      const st = { tts: "", queue: 0, cache: 0, error: String(e && e.message ? e.message : e) };
      const stJson = JSON.stringify(st);
      if (stJson !== lastStatusJson) {
        lastStatusJson = stJson;
        statusStore.set(st);
      }
    }
  }
  async function patchConfig(patch) {
    try {
      const next = await hostLocal.call("setConfig", patch);
      if (next && typeof next === "object") configStore.set(next);
      return next;
    } catch (e) {
      console.error("[amadeus] setConfig failed", e);
      return null;
    }
  }
  async function rpcSay(text) {
    try {
      return await hostLocal.call("say", { text });
    } catch (e) {
      return { ok: false };
    }
  }
  async function rpcRepeat() {
    try {
      return await hostLocal.call("repeat", {});
    } catch (e) {
      return { ok: false };
    }
  }
  async function rpcClear() {
    try {
      return await hostLocal.call("clear", {});
    } catch (e) {
      return { ok: false };
    }
  }
  async function rpcTestCall() {
    try {
      return await hostLocal.call("testCall", {});
    } catch (e) {
      return { ok: false };
    }
  }
  async function rpcTestChat() {
    try {
      return await hostLocal.call("testChat", {});
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  }
  async function rpcReport(msg) {
    try {
      await hostLocal.call("clientReport", { msg: String(msg).slice(0, 250) });
    } catch (e) {
    }
  }
  function openDetailsSafe() {
    if (layout === void 0) return;
    try {
      layout.openDetails();
    } catch (e) {
    }
  }
  rpcReport("client apply start");
  let iframeEl = null;
  let panelSrc = "/amadeus/panel.html";
  let panelSrcSet = false;
  let lastSentCfg = "";
  function notifyOpen() {
    if (!iframeEl || !iframeEl.contentWindow) return;
    try {
      iframeEl.contentWindow.postMessage({ type: "amadeus/open" }, "*");
    } catch (e) {
    }
  }
  function iframeSrc(config) {
    let q = "";
    try {
      q = encURI(JSON.stringify(config || {}));
    } catch (e) {
      q = "";
    }
    return "/amadeus/panel.html" + (q ? "?cfg=" + q : "");
  }
  function RootPoller() {
    import_react.default.useEffect(() => {
      refreshStatus().then(() => rpcReport("rpc getStatus ok"));
      const dispose = ctx.interval(refreshStatus, 2e3);
      return dispose;
    }, []);
    return null;
  }
  function AmadeusColumn() {
    const config = useStore(configStore);
    const status = useStore(statusStore);
    import_react.default.useEffect(() => {
      rpcReport("column mounted");
      return () => rpcReport("column unmounted");
    }, []);
    if (!panelSrcSet && config) {
      panelSrcSet = true;
      panelSrc = iframeSrc(config);
    }
    import_react.default.useEffect(() => {
      if (!config) return;
      let s = "";
      try {
        s = JSON.stringify(config);
      } catch (e) {
        return;
      }
      if (s === lastSentCfg) return;
      lastSentCfg = s;
      if (iframeEl && iframeEl.contentWindow) {
        try {
          iframeEl.contentWindow.postMessage({ type: "amadeus/config", value: config }, "*");
        } catch (e) {
        }
      }
    }, [config]);
    return import_react.default.createElement(
      "div",
      { className: "amad-col" },
      import_react.default.createElement("iframe", {
        className: "amad-frame",
        src: panelSrc,
        title: "Amadeus Live2D",
        allow: "microphone; camera; autoplay",
        ref: (el) => {
          iframeEl = el;
        }
      }),
      import_react.default.createElement(
        "div",
        { className: "amad-footer" },
        import_react.default.createElement("span", null, status.error ? "\u26A0 host \u4E0D\u53EF\u8FBE" : "\u25CF " + (status.tts || "\u2026") + " \xB7 \u961F\u5217 " + status.queue + (status.callPending ? " \xB7 \u{1F4DE} \u6765\u7535\u4E2D" : ""))
      )
    );
  }
  const VOICES = [
    ["ja-JP-NanamiNeural", "Nanami\uFF08\u5973\u58F0\uFF0C\u9ED8\u8BA4\uFF09"],
    ["ja-JP-KeitaNeural", "Keita\uFF08\u7537\u58F0\uFF09"],
    ["ja-JP-AoiNeural", "Aoi\uFF08\u5973\u58F0\uFF09"],
    ["ja-JP-MayuNeural", "Mayu\uFF08\u5973\u58F0\uFF09"],
    ["ja-JP-ShioriNeural", "Shiori\uFF08\u5973\u58F0\uFF09"],
    ["ja-JP-NaokiNeural", "Naoki\uFF08\u7537\u58F0\uFF09"],
    ["ja-JP-DaichiNeural", "Daichi\uFF08\u7537\u58F0\uFF09"]
  ];
  const RATES = ["-20%", "-10%", "+0%", "+10%", "+20%"];
  const PITCHES = ["-20Hz", "-10Hz", "+0Hz", "+10Hz", "+20Hz"];
  function Row(props) {
    return import_react.default.createElement(
      "div",
      { className: "amad-settings-row" },
      import_react.default.createElement(
        "div",
        null,
        import_react.default.createElement("div", { className: "amad-settings-label" }, props.label),
        props.desc ? import_react.default.createElement("div", { className: "amad-settings-desc" }, props.desc) : null
      ),
      props.control
    );
  }
  function Check(props) {
    return import_react.default.createElement("input", {
      type: "checkbox",
      checked: !!props.checked,
      onChange: (e) => props.onChange(!!e.target.checked)
    });
  }
  function Select(props) {
    const options = props.options.map((o) => import_react.default.createElement("option", { key: o[0], value: o[0] }, o[1]));
    return import_react.default.createElement("select", {
      value: props.value,
      onChange: (e) => props.onChange(e.target.value)
    }, options);
  }
  function TextInput(props) {
    return import_react.default.createElement("input", {
      type: props.type || "text",
      value: props.value || "",
      placeholder: props.placeholder || "",
      onChange: (e) => props.onChange(e.target.value),
      style: { flex: 1, minWidth: 0, border: "1px solid rgba(128,128,128,.4)", borderRadius: "6px", padding: "4px 8px", background: "transparent", color: "inherit" }
    });
  }
  function AmadeusSettings() {
    const config = useStore(configStore);
    const status = useStore(statusStore);
    if (!config) {
      return import_react.default.createElement(
        "div",
        null,
        import_react.default.createElement("div", { className: "amad-settings-row" }, import_react.default.createElement("span", null, status.error ? "\u26A0 \u65E0\u6CD5\u8FDE\u63A5 Amadeus Host\uFF1A" + status.error : "\u6B63\u5728\u8FDE\u63A5 Amadeus Host\u2026"))
      );
    }
    const group = (title) => import_react.default.createElement("div", { style: { marginTop: "18px", marginBottom: "4px", fontSize: "12px", fontWeight: 700, letterSpacing: "1px", color: "#d98a7d", textTransform: "uppercase" } }, title);
    const idleOptions = [[3e5, "5 \u5206\u949F"], [6e5, "10 \u5206\u949F"], [12e5, "20 \u5206\u949F\uFF08\u9ED8\u8BA4\uFF09"], [18e5, "30 \u5206\u949F"], [36e5, "60 \u5206\u949F"]];
    const callOptions = [[72e5, "2 \u5C0F\u65F6"], [216e5, "6 \u5C0F\u65F6"], [36e6, "10 \u5C0F\u65F6\uFF08\u9ED8\u8BA4\uFF09"], [864e5, "24 \u5C0F\u65F6"]];
    const pickIdle = (v) => idleOptions.find((o) => o[0] === v) ? v : 12e5;
    const pickCall = (v) => callOptions.find((o) => o[0] === v) ? v : 36e6;
    return import_react.default.createElement(
      "div",
      null,
      group("\u57FA\u672C\u5F00\u5173"),
      Row({ label: "\u8BED\u97F3\u6717\u8BFB", desc: "\u52A9\u624B\u56DE\u590D\u81EA\u52A8\u7531 Amadeus \u6717\u8BFB", control: Check({ checked: config.voiceOn !== false, onChange: (v) => patchConfig({ voiceOn: v }) }) }),
      Row({ label: "AI \u804A\u5929", desc: "\u53F3\u680F\u5E95\u90E8\u4E0E Amadeus \u76F4\u63A5\u5BF9\u8BDD\uFF08\u65E5\u8BED\u97F3\u9891 + \u4E2D\u6587\u6587\u5B57\uFF0C\u5E26\u957F\u671F\u8BB0\u5FC6\uFF09", control: Check({ checked: config.chatOn !== false, onChange: (v) => patchConfig({ chatOn: v }) }) }),
      Row({ label: "\u4E3B\u52A8\u6765\u7535", desc: "\u5979\u6BCF\u5929\u50CF\u539F\u4F5C\u4E00\u6837\u4E3B\u52A8\u300C\u6253\u7535\u8BDD\u300D\u7ED9\u4F60\uFF08\u6765\u7535\u94C3\u97F3 + \u9707\u5C4F\uFF09", control: Check({ checked: config.callOn !== false, onChange: (v) => patchConfig({ callOn: v }) }) }),
      Row({ label: "\u7A7A\u95F2\u95F2\u804A", desc: "\u957F\u65F6\u95F4\u4E0D\u4E92\u52A8\u65F6\uFF0C\u5979\u4E3B\u52A8\u627E\u8BDD\u9898\u5F00\u53E3\u8BF4\u8BDD", control: Check({ checked: config.idleChatOn !== false, onChange: (v) => patchConfig({ idleChatOn: v }) }) }),
      Row({ label: "\u7EA2\u8389\u6816\u4EBA\u683C\u6CE8\u5165", desc: "\u8BA9 Agent \u4EE5 Amadeus\uFF08\u7EA2\u8389\u6816\uFF09\u53E3\u543B\u56DE\u7B54\uFF0C\u4F5C\u7528\u4E8E\u6240\u6709\u4F1A\u8BDD", control: Check({ checked: config.personaOn === true, onChange: (v) => patchConfig({ personaOn: v }) }) }),
      Row({ label: "Amadeus \u5168\u5C40\u4E3B\u9898", desc: "\u6574\u5957 GUI \u5F3A\u5236\u6697\u7EA2 Amadeus \u914D\u8272\uFF08\u63D2\u4EF6\u505C\u6B62\u540E\u81EA\u52A8\u8FD8\u539F\uFF09", control: Check({ checked: config.themeOn !== false, onChange: (v) => patchConfig({ themeOn: v }) }) }),
      group("AI \u804A\u5929\uFF08\u72EC\u7ACB API\uFF0C\u7559\u7A7A\u5219\u7528 DSH \u9ED8\u8BA4\u6A21\u578B\uFF09"),
      Row({ label: "API \u5730\u5740", desc: "OpenAI \u517C\u5BB9\u683C\u5F0F", control: TextInput({ value: config.chatBaseUrl, placeholder: "https://api.deepseek.com/v1", onChange: (v) => patchConfig({ chatBaseUrl: v }) }) }),
      Row({ label: "\u6A21\u578B\u540D", control: TextInput({ value: config.chatModel, placeholder: "deepseek-chat", onChange: (v) => patchConfig({ chatModel: v }) }) }),
      Row({ label: "API Key", desc: "\u7559\u7A7A = \u4F7F\u7528 DSH \u9ED8\u8BA4\u6A21\u578B\u901A\u9053", control: TextInput({ type: "password", value: config.chatApiKey, placeholder: "sk-\u2026", onChange: (v) => patchConfig({ chatApiKey: v }) }) }),
      group("\u8BED\u97F3\u5408\u6210"),
      Row({ label: "TTS \u901A\u9053", desc: "\u4E3A\u4FDD\u8BC1\u58F0\u7EBF\u7EDF\u4E00\uFF0C\u9ED8\u8BA4\u4E0D\u81EA\u52A8\u5207\u6362\u97F3\u8272", control: Select({ value: config.provider, options: [["edge", "Edge TTS\uFF08\u9ED8\u8BA4\uFF0C\u7A33\u5B9A\uFF09"], ["voicevox", "\u672C\u5730 VOICEVOX"], ["quest", "VOICEVOX \u516C\u5171 API"], ["aqua", "\u672C\u5730 Aqua-TTS / GPT-SoVITS"], ["openai", "OpenAI \u517C\u5BB9 TTS"], ["auto", "\u81EA\u52A8\uFF08Aqua\u2192VOICEVOX\uFF0C\u4EC5\u5728\u663E\u5F0F\u5F00\u542F\u65F6\u5207\u516C\u5171\uFF09"]], onChange: (v) => patchConfig({ provider: v }) }) }),
      Row({ label: "\u97F3\u8272", control: Select({ value: config.voiceName, options: VOICES, onChange: (v) => patchConfig({ voiceName: v }) }) }),
      Row({ label: "\u8BED\u901F", control: Select({ value: config.rate, options: RATES.map((r) => [r, r]), onChange: (v) => patchConfig({ rate: v }) }) }),
      Row({ label: "\u97F3\u8C03", control: Select({ value: config.pitch, options: PITCHES.map((p) => [p, p]), onChange: (v) => patchConfig({ pitch: v }) }) }),
      Row({ label: "\u60C5\u7EEA\u5F3A\u5EA6", desc: "\u653E\u5927/\u51CF\u5F31\u60C5\u7EEA prosody\uFF080.5~2.0\uFF0C\u9ED8\u8BA4 1.0\uFF09", control: Select({ value: String(config.emotionIntensity || 1), options: [["0.5", "0.5\uFF08\u514B\u5236\uFF09"], ["0.75", "0.75"], ["1", "1.0\uFF08\u9ED8\u8BA4\uFF09"], ["1.2", "1.2\uFF08\u7A0D\u5938\u5F20\uFF09"], ["1.5", "1.5\uFF08\u5938\u5F20\uFF09"], ["2", "2.0\uFF08\u6781\u5938\u5F20\uFF09"]], onChange: (v) => patchConfig({ emotionIntensity: Number(v) }) }) }),
      Row({ label: "\u4FDD\u6301\u58F0\u7EBF\u7A33\u5B9A", desc: "\u5F00\u542F\u540E TTS \u5931\u8D25\u4E5F\u4E0D\u5207\u5230\u5176\u5B83\u97F3\u8272\uFF08\u63A8\u8350\uFF09", control: Check({ checked: config.voiceStability !== false, onChange: (v) => patchConfig({ voiceStability: v }) }) }),
      Row({ label: "\u5931\u8D25\u5207\u516C\u5171 API", desc: "\u4EC5\u5F53\u201C\u4FDD\u6301\u58F0\u7EBF\u7A33\u5B9A\u201D\u5173\u95ED\u65F6\u751F\u6548", control: Check({ checked: config.fallbackToQuest === true, onChange: (v) => patchConfig({ fallbackToQuest: v }) }) }),
      group("\u8BED\u97F3\u8F93\u5165"),
      Row({ label: "\u8BC6\u522B\u65B9\u5F0F", control: Select({ value: config.sttProvider || "auto", options: [["auto", "\u81EA\u52A8\uFF08\u4F18\u5148\u6D4F\u89C8\u5668\u8BC6\u522B\uFF09"], ["browser", "\u4EC5\u6D4F\u89C8\u5668\u8BC6\u522B"], ["api", "\u540E\u7AEF Whisper API"]], onChange: (v) => patchConfig({ sttProvider: v }) }) }),
      Row({ label: "STT API \u5730\u5740", desc: "\u7559\u7A7A\u4F7F\u7528 AI API \u5730\u5740", control: TextInput({ value: config.sttApiUrl, placeholder: "https://api.openai.com/v1", onChange: (v) => patchConfig({ sttApiUrl: v }) }) }),
      Row({ label: "STT API Key", desc: "\u7559\u7A7A\u4F7F\u7528 AI API Key", control: TextInput({ type: "password", value: config.sttApiKey, placeholder: "sk-\u2026", onChange: (v) => patchConfig({ sttApiKey: v }) }) }),
      Row({ label: "STT \u6A21\u578B", control: TextInput({ value: config.sttModel || "whisper-1", placeholder: "whisper-1", onChange: (v) => patchConfig({ sttModel: v }) }) }),
      group("\u4E3B\u52A8\u4E92\u52A8\u8282\u594F"),
      Row({ label: "\u7A7A\u95F2\u591A\u4E45\u5F00\u53E3", control: Select({ value: pickIdle(config.idleChatMs), options: idleOptions, onChange: (v) => patchConfig({ idleChatMs: Number(v) }) }) }),
      Row({ label: "\u6765\u7535\u95F4\u9694", control: Select({ value: pickCall(config.callIntervalMs), options: callOptions, onChange: (v) => patchConfig({ callIntervalMs: Number(v) }) }) }),
      import_react.default.createElement(
        "div",
        { style: { marginTop: "16px" } },
        import_react.default.createElement("button", { className: "amad-settings-btn", onClick: () => rpcSay("\u30A2\u30DE\u30C7\u30A6\u30B9\u3001\u6E96\u5099\u5B8C\u4E86\u3002") }, "\u{1F4AC} \u6D4B\u8BD5\u8BED\u97F3"),
        import_react.default.createElement("button", { className: "amad-settings-btn", onClick: async () => {
          const r = await rpcTestChat();
          window.alert(r && r.ok ? "AI API OK: " + r.content : "AI API Error: " + (r && r.error ? r.error : "unknown"));
        } }, "\u{1F50C} \u6D4B\u8BD5 AI API"),
        import_react.default.createElement("button", { className: "amad-settings-btn", onClick: rpcRepeat }, "\u21BA \u91CD\u64AD\u4E0A\u4E00\u6761"),
        import_react.default.createElement("button", { className: "amad-settings-btn", onClick: rpcClear }, "\u{1F9F9} \u6E05\u7A7A\u961F\u5217"),
        import_react.default.createElement("button", { className: "amad-settings-btn", onClick: rpcTestCall }, "\u{1F4DE} \u6D4B\u8BD5\u6765\u7535"),
        import_react.default.createElement("button", { className: "amad-settings-btn", onClick: () => {
          notifyOpen();
          if (layout) layout.openDetails();
        } }, "\u{1F441} \u6253\u5F00\u53F3\u4FA7\u680F"),
        import_react.default.createElement("button", { className: "amad-settings-btn", onClick: () => {
          if (layout) layout.closeDetails();
        } }, "\u{1F6AB} \u5173\u95ED\u53F3\u4FA7\u680F")
      ),
      import_react.default.createElement(
        "div",
        { className: "amad-settings-row", style: { marginTop: "10px" } },
        import_react.default.createElement(
          "span",
          { style: { fontSize: "12px", color: "#9a8f8b" } },
          status.error ? "\u26A0 host \u4E0D\u53EF\u8FBE" : "\u25CF " + (status.tts || "\u2026") + " \xB7 \u961F\u5217 " + status.queue + (status.callPending ? " \xB7 \u{1F4DE} \u6765\u7535\u4E2D" : "")
        )
      ),
      import_react.default.createElement("div", { className: "amad-warn" }, "\u6CE8\u610F\uFF1A\u53F3\u4FA7\u680F\u4E3A Amadeus \u4E13\u7528\uFF0C\u539F\u300C\u5DE5\u5177\u8BE6\u60C5\u300D\u9762\u677F\u5728\u63D2\u4EF6\u8FD0\u884C\u671F\u95F4\u88AB\u66FF\u4EE3\uFF0C\u505C\u6B62\u63D2\u4EF6\u540E\u6062\u590D\u3002\u7267\u6FD1\u7EA2\u8389\u6816\u89D2\u8272\u7248\u6743\u5F52 MAGES./Nitroplus\uFF1BLive2D \u6A21\u578B\u4E0E\u8BED\u97F3\u7D20\u6750\u4E3A\u7C89\u4E1D\u5236\u4F5C\uFF0C\u4EC5\u4F9B\u4E2A\u4EBA\u5B66\u4E60\uFF0C\u7981\u6B62\u5546\u7528\u3002")
    );
  }
  function SidebarToggle(props) {
    const wide = !!(props && props.wide);
    return import_react.default.createElement(
      "div",
      null,
      import_react.default.createElement(RootPoller),
      import_react.default.createElement("button", {
        className: "amad-sb-btn",
        title: "\u6253\u5F00 Amadeus \u53F3\u4FA7\u680F",
        onClick: () => {
          notifyOpen();
          if (layout) layout.openDetails();
        }
      }, wide ? "Amadeus" : "A")
    );
  }
  slots.inject("details", () => slots.register(
    { name: "details", priority: -1 },
    () => import_react.default.createElement(AmadeusColumn)
  ));
  slots.inject("sidebar.footer.action", () => slots.register(
    { name: "sidebar.footer.action", id: "amadeus", order: 50, label: "Amadeus" },
    (props) => import_react.default.createElement(SidebarToggle, props)
  ));
  slots.inject("settings.section", () => slots.register(
    { name: "settings.section", id: "amadeus", order: 90, label: "Amadeus" },
    () => import_react.default.createElement(
      "div",
      null,
      import_react.default.createElement("h2", null, "Amadeus"),
      import_react.default.createElement(AmadeusSettings)
    )
  ));
  applyTheme(true);
  openDetailsSafe();
  rpcReport("openDetails called (immediate)");
  ctx.timeout(() => {
    openDetailsSafe();
    rpcReport("openDetails retry (2s)");
  }, 2e3);
  ctx.on("connection/reset", () => {
    rpcReport("connection/reset -> openDetails");
    openDetailsSafe();
  });
}
return module.exports; } });
