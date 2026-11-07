import { defineControlUiPlugin } from "openclaw/plugin-sdk/control-ui";
import { createFeatureClient } from "openclaw/plugin-sdk/feature-contract";
import { contract } from "./contract.js";
import { WHALE_LOGO, ONEWEB_LOGO } from "./assets.generated.js";
import "./control-ui.css";

interface StatusPayload {
  state: "peak" | "off-peak";
  label: string;
  nextChangeAt: string | null;
  msUntilNextChange: number;
  prices: Record<
    string,
    { inputMiss: { off: number; peak: number }; output: { off: number; peak: number } }
  >;
  banner: { text: string; color: string | null } | null;
  fresh: boolean;
  lastFetchedAt: string | null;
  now: string;
}

function money(n: number): string {
  return "$" + n.toFixed(2);
}

function fmtCountdown(ms: number): { h: number; m: number } {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 0) return { h: 0, m: 0 };
  return { h: Math.floor(totalMin / 60), m: totalMin % 60 };
}

function fmtLocalTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default defineControlUiPlugin({
  id: "deepseek-peak-widget",
  activate(host) {
    const feature = createFeatureClient(contract, host);
    host.ui.registerWidget({
      id: "deepseek-peak-widget",
      label: "DeepSeek Pricing",
      mount(container, context) {
        const root = document.createElement("div");
        root.className = "dspw";

        // Header
        const head = document.createElement("div");
        head.className = "dspw-head";
        const logo = document.createElement("img");
        logo.className = "dspw-logo";
        logo.src = WHALE_LOGO;
        logo.alt = "";
        const titleWrap = document.createElement("div");
        const title = document.createElement("div");
        title.className = "dspw-title";
        title.textContent = "DeepSeek Pricing";
        const subtitle = document.createElement("div");
        subtitle.className = "dspw-subtitle";
        subtitle.textContent = "Peak / Off-peak status";
        titleWrap.append(title, subtitle);
        const dot = document.createElement("span");
        dot.className = "dspw-dot dspw-dot-red";
        dot.title = "parameter refresh status";
        dot.setAttribute("aria-label", "refresh status");
        head.append(logo, titleWrap, dot);

        // Separator 1
        const sep1 = document.createElement("div");
        sep1.className = "dspw-sep";

        // Status
        const status = document.createElement("div");
        status.className = "dspw-status";
        const pill = document.createElement("span");
        pill.className = "dspw-pill";
        const count = document.createElement("span");
        count.className = "dspw-count";
        status.append(pill, count);

        const contextLine = document.createElement("div");
        contextLine.className = "dspw-context";

        // Separator 2
        const sep2 = document.createElement("div");
        sep2.className = "dspw-sep";

        // Table
        const table = document.createElement("table");
        table.className = "dspw-table";
        const thead = document.createElement("thead");
        const hr = document.createElement("tr");
        for (const label of ["", "In·miss", "Output"]) {
          const th = document.createElement("th");
          th.textContent = label;
          hr.append(th);
        }
        thead.append(hr);
        const tbody = document.createElement("tbody");
        table.append(thead, tbody);

        // Banner
        const banner = document.createElement("div");
        banner.className = "dspw-banner";
        banner.style.display = "none";

        // Footer
        const foot = document.createElement("div");
        foot.className = "dspw-foot";
        const footText = document.createElement("span");
        const owLink = document.createElement("a");
        owLink.href = "https://oneweb.hu";
        owLink.target = "_blank";
        owLink.rel = "noopener noreferrer";
        owLink.className = "dspw-owlink";
        owLink.title = "OneWeb";
        const ow = document.createElement("img");
        ow.className = "dspw-ow";
        ow.src = ONEWEB_LOGO;
        ow.alt = "OneWeb";
        owLink.append(ow);
        foot.append(footText, owLink);

        root.append(head, sep1, status, contextLine, sep2, table, banner, foot);
        container.append(root);

        // ---- rendering ----
        function render(payload: StatusPayload) {
          const isPeak = payload.state === "peak";
          // Pill
          pill.textContent = payload.label;
          pill.classList.toggle("dspw-good", !isPeak);
          pill.classList.toggle("dspw-bad", isPeak);
          // Countdown (labeled hours + minutes)
          const cd = fmtCountdown(payload.msUntilNextChange);
          count.replaceChildren();
          const spanH = document.createElement("span");
          spanH.textContent = String(cd.h);
          const unitH = document.createElement("span");
          unitH.className = "dspw-unit";
          unitH.textContent = "h";
          const spanM = document.createElement("span");
          spanM.textContent = String(cd.m).padStart(2, "0");
          const unitM = document.createElement("span");
          unitM.className = "dspw-unit";
          unitM.textContent = "m";
          count.append(spanH, unitH, document.createTextNode(" "), spanM, unitM);
          count.classList.toggle("dspw-good", !isPeak);
          count.classList.toggle("dspw-bad", isPeak);
          // Context
          const nextTxt = payload.nextChangeAt ? fmtClock(payload.nextChangeAt) : "—";
          contextLine.textContent = isPeak
            ? `until off-peak (½ price) → ${nextTxt}`
            : `until peak pricing (2× cost) → ${nextTxt}`;
          // Dot
          dot.classList.toggle("dspw-dot-red", !payload.fresh);
          dot.classList.toggle("dspw-dot-green", payload.fresh);
          // Table
          tbody.replaceChildren();
          const models = Object.keys(payload.prices);
          models.forEach((model, i) => {
            const p = payload.prices[model];
            const rowOff = document.createElement("tr");
            const th = document.createElement("td");
            th.className = "dspw-rowhead";
            if (i === 0) th.classList.add("dspw-modelrow");
            else th.classList.add("dspw-modelrow-gap");
            th.textContent = model;
            const inOff = document.createElement("td");
            inOff.className = "dspw-off";
            inOff.textContent = money(p.inputMiss.off);
            const outOff = document.createElement("td");
            outOff.className = "dspw-off";
            outOff.textContent = money(p.output.off);
            rowOff.append(th, inOff, outOff);

            const rowPeak = document.createElement("tr");
            const thp = document.createElement("td");
            const inp = document.createElement("td");
            inp.className = "dspw-peak";
            inp.textContent = money(p.inputMiss.peak);
            const outp = document.createElement("td");
            outp.className = "dspw-peak";
            outp.textContent = money(p.output.peak);
            rowPeak.append(thp, inp, outp);

            tbody.append(rowOff, rowPeak);
          });
          // Banner
          if (payload.banner) {
            banner.textContent = payload.banner.text;
            banner.style.background = payload.banner.color || "var(--dspw-accent, #4D6BFE)";
            banner.style.display = "";
          } else {
            banner.style.display = "none";
          }
          // Footer
          const updated = payload.lastFetchedAt
            ? fmtClock(payload.lastFetchedAt)
            : "—";
          footText.textContent =
            `Updated ${updated} · peak = 2× off-peak`;
        }

        let disposed = false;

        async function load(signal: AbortSignal): Promise<void> {
          try {
            const payload = await feature.invoke("status", {});
            if (!disposed && !signal.aborted) render(payload);
          } catch {
            // Show a stable offline placeholder rather than crashing.
            if (!disposed && !signal.aborted) {
              pill.textContent = "Unavailable";
              count.textContent = "--h --m";
              count.className = "dspw-count dspw-muted";
              dot.classList.add("dspw-dot-red");
            }
          }
        }

        // Remaining-time refresh every minute (lightweight; only text updates).
        const clockTimer = setInterval(() => {
          if (disposed) return;
          void load(context.signal);
        }, 60_000);

        void load(context.signal);

        return {
          update(next) {
            // Re-render on any widget prop/presentation change.
            if (!next.signal.aborted) void load(next.signal);
          },
          dispose() {
            disposed = true;
            clearInterval(clockTimer);
            root.remove();
          },
        };
      },
    });
  },
});
