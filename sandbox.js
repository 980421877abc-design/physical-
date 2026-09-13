/* ============================================================================
 * sandbox_extras.js — 沙盒模式擴充
 *
 * 每個角色旁有一個 ⚙️ 齒輪，點開後可調整：
 *   - 傷害倍率（預設 1.0）
 *   - 重生次數（預設 0）
 * ============================================================================ */
(() => {
  'use strict';

  // ───────── 資料結構：確保每個成員都有新欄位 ─────────
  function ensureMemberFields(m) {
    if (!m) return m;
    if (typeof m.dmgMult !== 'number') m.dmgMult = 1.0;
    if (typeof m.revives !== 'number') m.revives = 0;
    return m;
  }

  // 目前展開面板的 chip（全域只允許一個打開）
  let activePanelChip = null;

  // 關閉所有面板
  function closeAllPanels() {
    document.querySelectorAll('.sandbox-adjust-panel').forEach(p => p.remove());
    document.querySelectorAll('.sandbox-gear-btn.open').forEach(b => b.classList.remove('open'));
    activePanelChip = null;
  }

  // 點畫面其他地方就關閉
  document.addEventListener('click', e => {
    if (e.target.closest('.sandbox-adjust-panel') || e.target.closest('.sandbox-gear-btn')) return;
    closeAllPanels();
  });

  // ───────── Hook sandboxRenderTeams ─────────
  let hookedRenderTeams = null;
  function tryHookRenderTeams() {
    if (hookedRenderTeams) return;
    if (typeof window.sandboxRenderTeams !== 'function') return;
    hookedRenderTeams = window.sandboxRenderTeams;
    window.sandboxRenderTeams = function () {
      if (Array.isArray(sandboxTeams)) {
        sandboxTeams.forEach(t => (t.members || []).forEach(ensureMemberFields));
      }
      hookedRenderTeams();
      enhanceTeamUI();
    };
    console.log('[sandbox_extras] sandboxRenderTeams hooked');
  }

  // ───────── 在每個 chip 上加齒輪按鈕 ─────────
  function enhanceTeamUI() {
    const container = document.getElementById('sandbox-teams');
    if (!container) return;
    const teams = sandboxTeams;
    if (!Array.isArray(teams)) return;

    teams.forEach((team, ti) => {
      (team.members || []).forEach((m, mi) => {
        // 找到對應 chip
        const hpInputs = container.querySelectorAll('.sb-hp-input');
        for (const hpInput of hpInputs) {
          if (Number(hpInput.dataset.ti) !== ti || Number(hpInput.dataset.mi) !== mi) continue;
          const chip = hpInput.closest('.sb-chip');
          if (!chip) break;

          // 已經有齒輪就跳過
          if (chip.querySelector('.sandbox-gear-btn')) break;

          const gear = document.createElement('button');
          gear.className = 'sandbox-gear-btn';
          gear.type = 'button';
          gear.textContent = '⚙️';
          gear.title = '調整此角色（傷害倍率 / 重生次數）';
          gear.style.cssText = `
            background: rgba(143,214,255,0.12);
            border: 1px solid rgba(143,214,255,0.35);
            border-radius: 6px;
            cursor: pointer;
            padding: 1px 5px;
            font-size: 0.7rem;
            margin-left: 2px;
            transition: background .15s;
            color: #cde;
          `;
          gear.addEventListener('mouseenter', () => {
            gear.style.background = 'rgba(143,214,255,0.28)';
          });
          gear.addEventListener('mouseleave', () => {
            if (!gear.classList.contains('open')) gear.style.background = 'rgba(143,214,255,0.12)';
          });
          gear.addEventListener('click', e => {
            e.stopPropagation();
            const wasOpen = gear.classList.contains('open');
            closeAllPanels();
            if (!wasOpen) {
              gear.classList.add('open');
              gear.style.background = 'rgba(143,214,255,0.35)';
              openAdjustPanel(chip, ti, mi, m);
              activePanelChip = chip;
            }
          });
          chip.appendChild(gear);
          break;
        }
      });
    });
  }

  // ───────── 開啟調整面板 ─────────
  function openAdjustPanel(chip, ti, mi, member) {
    const panel = document.createElement('div');
    panel.className = 'sandbox-adjust-panel';
    panel.style.cssText = `
      position: absolute;
      z-index: 100;
      background: rgba(15,22,32,0.98);
      border: 1px solid rgba(143,214,255,0.4);
      border-radius: 10px;
      padding: 10px 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      font-family: sans-serif;
      color: #eee;
      font-size: 0.72rem;
      min-width: 200px;
      top: 100%;
      left: 0;
      margin-top: 6px;
    `;

    panel.innerHTML = `
      <div style="font-weight:700;color:#8fd6ff;margin-bottom:8px;font-size:0.78rem;letter-spacing:.04em">
        ⚙️ 調整數值
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px">
        <label style="color:#ffd27a;flex-shrink:0">傷害倍率</label>
        <div style="display:flex;align-items:center;gap:3px">
          <input type="number" class="sbx-dmg" min="0" step="0.1" value="${member.dmgMult}"
            style="width:52px;background:rgba(255,220,120,0.15);border:1px solid rgba(255,220,120,0.4);border-radius:6px;color:#ffd27a;font-size:0.75rem;padding:3px 5px;text-align:right">
          <span style="color:#ffd27a;opacity:0.7">×</span>
        </div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px">
        <label style="color:#9ef09e;flex-shrink:0">重生次數</label>
        <div style="display:flex;align-items:center;gap:3px">
          <input type="number" class="sbx-rev" min="0" step="1" value="${member.revives}"
            style="width:52px;background:rgba(160,240,160,0.15);border:1px solid rgba(160,240,160,0.4);border-radius:6px;color:#9ef09e;font-size:0.75rem;padding:3px 5px;text-align:right">
          <span style="color:#9ef09e;opacity:0.7">↻</span>
        </div>
      </div>

      <div style="display:flex;gap:6px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1)">
        <button class="sbx-reset" style="flex:1;background:rgba(255,120,120,0.15);border:1px solid rgba(255,120,120,0.4);border-radius:6px;color:#ff9f9f;padding:4px 8px;cursor:pointer;font-size:0.68rem">重設</button>
        <button class="sbx-close" style="flex:1;background:rgba(143,214,255,0.12);border:1px solid rgba(143,214,255,0.35);border-radius:6px;color:#8fd6ff;padding:4px 8px;cursor:pointer;font-size:0.68rem">關閉</button>
      </div>

      <div class="sbx-hint" style="margin-top:8px;font-size:0.6rem;color:#889;line-height:1.5">
        💡 傷害倍率：1.0 = 正常，2.0 = 兩倍痛<br>
        💡 重生：死亡後自動滿血復活
      </div>
    `;

    // 讓 chip 成為定位基準
    if (getComputedStyle(chip).position === 'static') {
      chip.style.position = 'relative';
    }
    chip.appendChild(panel);

    const dmgEl = panel.querySelector('.sbx-dmg');
    const revEl = panel.querySelector('.sbx-rev');
    const resetBtn = panel.querySelector('.sbx-reset');
    const closeBtn = panel.querySelector('.sbx-close');

    dmgEl.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      member.dmgMult = Number.isFinite(v) && v >= 0 ? v : 1.0;
    });
    revEl.addEventListener('input', e => {
      const v = parseInt(e.target.value, 10);
      member.revives = Number.isFinite(v) && v >= 0 ? v : 0;
    });

    resetBtn.addEventListener('click', e => {
      e.stopPropagation();
      member.dmgMult = 1.0;
      member.revives = 0;
      dmgEl.value = '1';
      revEl.value = '0';
      // 如果戰鬥已開始，立刻套用
      applyToLiveBalls(ti, mi, member);
    });

    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      closeAllPanels();
    });
  }

  // 若戰鬥中，立刻套用到正在場上的球
  function applyToLiveBalls(ti, mi, member) {
    if (typeof state === 'undefined' || !state || !state.balls) return;
    if (typeof sandboxMode === 'undefined' || !sandboxMode) return;
    const player = ti + 1;
    const sameCharBalls = state.balls.filter(b => b && b.player === player && b.char && b.char.id === member.id);
    sameCharBalls.forEach(ball => {
      ball.sandboxDamageMult = member.dmgMult || 1.0;
      if ((ball.sandboxRevivesLeft || 0) === 0) {
        ball.sandboxRevivesLeft = member.revives || 0;
      }
    });
  }

  // ───────── Hook sandboxStartBattle：套用傷害倍率 / 重生 ─────────
  let hookedStartBattle = null;
  function tryHookStartBattle() {
    if (hookedStartBattle) return;
    if (typeof window.sandboxStartBattle !== 'function') return;
    hookedStartBattle = window.sandboxStartBattle;
    window.sandboxStartBattle = function () {
      hookedStartBattle();
      setTimeout(applyExtrasAfterStart, 50);
    };
    console.log('[sandbox_extras] sandboxStartBattle hooked');
  }

  function applyExtrasAfterStart() {
    if (typeof state === 'undefined' || !state || !state.balls) return;
    if (typeof sandboxMode === 'undefined' || !sandboxMode) return;

    const teams = sandboxTeams || [];

    for (const ball of state.balls) {
      if (!ball || !ball.char) continue;
      const ti = (ball.player || 1) - 1;
      if (ti < 0 || ti >= teams.length) continue;
      const team = teams[ti];
      if (!team) continue;

      // 對應成員：用 char.id + 順序推斷
      const sameCharMembers = (team.members || []).filter(m => m.id === ball.char.id);
      const member = sameCharMembers[0];
      if (!member) continue;

      ball.sandboxDamageMult = member.dmgMult || 1.0;
      if (member.revives > 0) {
        ball.sandboxRevivesLeft = member.revives;
      }
    }
  }

  // ───────── Hook dealDamage：套用傷害倍率 ─────────
  let hookedDealDamage = null;
  function tryHookDealDamage() {
    if (hookedDealDamage) return;
    if (typeof window.dealDamage !== 'function') return;
    hookedDealDamage = window.dealDamage;
    window.dealDamage = function (target, dmg, options) {
      const opts = options || {};
      let attacker = opts.attackerBall;
      if (!attacker && opts.attackerPlayer != null && typeof state !== 'undefined' && state && state.balls) {
        attacker = state.balls.find(b => b && b.player === opts.attackerPlayer && b.hp > 0);
      }
      if (attacker && attacker.sandboxDamageMult && attacker.sandboxDamageMult !== 1.0) {
        dmg = dmg * attacker.sandboxDamageMult;
      }
      return hookedDealDamage(target, dmg, options);
    };
    console.log('[sandbox_extras] dealDamage hooked');
  }

  // ───────── 重生判定 ─────────
  const deadHandled = new WeakSet();
  function checkRevives() {
    if (typeof state === 'undefined' || !state || !state.balls) return;
    if (typeof sandboxMode === 'undefined' || !sandboxMode) return;
    const W = (typeof arenaWidth === 'number' ? arenaWidth : 350);
    const H = (typeof arenaHeight === 'number' ? arenaHeight : 350);

    for (const ball of state.balls) {
      if (!ball || !ball.char) continue;
      if (ball.hp > 0) {
        deadHandled.delete(ball);
        continue;
      }
      if (deadHandled.has(ball)) continue;
      const revives = ball.sandboxRevivesLeft || 0;
      if (revives <= 0) continue;
      deadHandled.add(ball);

      ball.sandboxRevivesLeft = revives - 1;
      const effMax = (typeof getBallMaxHp === 'function') ? getBallMaxHp(ball) : 1000;
      ball.hp = effMax;
      ball.vx = (Math.random() - 0.5) * 200;
      ball.vy = (Math.random() - 0.5) * 200;
      ball.x = 40 + Math.random() * (W - 80);
      ball.y = 40 + Math.random() * (H - 80);

      if (state.hitFlashes) {
        state.hitFlashes.push({ x: ball.x, y: ball.y, r: 60, alpha: 1.2, color: '#9ef09e', t: 0.6 });
      }
      if (state.damageNumbers) {
        state.damageNumbers.push({ x: ball.x, y: ball.y - 40, value: `重生（剩 ${ball.sandboxRevivesLeft}）`, color: '#9ef09e', life: 1.2, maxLife: 1.2, scale: 1.1 });
      }
      if (typeof playHitSound === 'function') playHitSound('vampire_dash');
    }
  }

  // ───────── 主循環 ─────────
  function loop() {
    tryHookRenderTeams();
    tryHookStartBattle();
    tryHookDealDamage();
    checkRevives();
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(loop), { once: true });
  } else {
    requestAnimationFrame(loop);
  }

  console.log('[sandbox_extras] 沙盒擴充 v2 已載入');
})();
