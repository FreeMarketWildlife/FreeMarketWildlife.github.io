/* Authoritative multiplayer adapter. Load after ten-conquerors.js; classic index stays offline. */
(() => {
  'use strict';
  if (!window.TenConquest) return;
  const panel = document.getElementById('network-panel');
  const protocolVersion = 2, localMap = window.KINGDOM_RIFT_MAP || globalThis.KINGDOM_RIFT_MAP;
  if (!localMap) return; // Networking is specific to the Rift 5v5 page.
  const mapContract = Object.freeze({id:localMap.id,revision:localMap.revision,width:localMap.width,height:localMap.height});
  const compatible = msg => msg.version === protocolVersion && !!msg.map && Object.keys(mapContract).every(key => msg.map[key] === mapContract[key]);
  const endpoint = new URL(window.KINGDOM_SERVER || document.querySelector('meta[name="kingdom-server"]')?.content || location.origin);
  const base = endpoint.origin;
  let socket = null, active = false, intentional = false, room = '', heroId = null, seq = 0;
  let lobby = null, ready = false, attempts = 0, retry = null, pingTimer = null, received = 0, rtt = null;
  let lastOrderAt = 0;
  const originalUpdate = update, originalCommand = command, originalCast = cast, originalChoose = chooseHero, originalInit = init;
  const originalTenSelect = tenSelect;
  const originalUpdateUI = updateUI;
  const rematchMessage = () => `${winner === 0 ? 'Verdant' : 'Crimson'} wins · Leave room and create another to rematch`;
  const key = () => 'kingdom-room-v2:' + mapContract.id + ':' + mapContract.revision + ':' + base + ':' + room;
  const storage = {
    get() { try { return sessionStorage.getItem(key()); } catch { return null; } },
    set(token) { try { sessionStorage.setItem(key(), token); } catch {} },
    remove() { try { sessionStorage.removeItem(key()); } catch {} },
  };
  function status(text) {
    api.status = text;
    const node = document.getElementById('network-status'); if (node) node.textContent = text;
    window.dispatchEvent(new CustomEvent('kingdom-network', { detail: { status: text, room, heroId, lobby, rtt } }));
  }
  function send(value) {
    if (socket?.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(value)); return true;
  }
  function input(action) {
    if (!active || !lobby?.started || !heroId) return false;
    if (action.type === 'move' || action.type === 'attack') {
      if (Date.now() - lastOrderAt < 65) return false;
      lastOrderAt = Date.now();
    }
    return send({ type: 'input', seq: ++seq, action });
  }
  function restoreVisual(list, byId) {
    return (list || []).map(p => ({ ...p, ...(p.sourceId ? { source: byId.get(p.sourceId) } : {}),
      ...(p.targetId ? { target: byId.get(p.targetId) } : {}) }));
  }
  function applySnapshot(msg) {
    received = Date.now();
    const before = new Map(units.map(u => [u.id, u]));
    const live = msg.full ? new Map() : before;
    for (const value of msg.units) {
      let unit = live.get(value.id);
      if (!unit) { unit = { ...value }; live.set(value.id, unit); }
      else {
        const { x, y, ...fields } = value;
        Object.assign(unit, fields);
        if (x !== undefined) unit._networkX = x;
        if (y !== undefined) unit._networkY = y;
        if (document.hidden || Math.hypot((unit._networkX ?? unit.x) - unit.x, (unit._networkY ?? unit.y) - unit.y) > 400) {
          unit.x = unit._networkX ?? unit.x; unit.y = unit._networkY ?? unit.y;
        }
      }
    }
    for (const id of msg.removed || []) live.delete(id);
    units = [...live.values()]; clock = msg.clock; kills = msg.kills; winner = msg.winner;
    effects = restoreVisual(msg.effects, live); projectiles = restoreVisual(msg.projectiles, live);
    skillshots = restoreVisual(msg.skillshots, live); floats = []; particles = [];
    const changedHero = selected?.id !== heroId;
    selected = live.get(heroId) || null;
    if (changedHero && selected) { camera.x = selected.x; camera.y = selected.y; follow = true; renderRoster(); }
    paused = false; speed = 1;
    if (selected) flashCd = Math.max(0, (selected.flashCooldown || 0) - clock);
    api.lastTick = msg.tick;
    if (winner !== null && api.status !== rematchMessage()) status(rematchMessage());
  }
  function renderLobby() {
    if (!panel) return;
    const slots = document.getElementById('network-slots');
    slots.replaceChildren();
    for (const slot of lobby?.slots || []) {
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.networkHero = String(slot.heroId);
      button.textContent = `${slot.team ? 'Crimson' : 'Verdant'} · ${slot.name} · ${slot.player || 'Bot'}${slot.reserved ? ' (reconnecting)' : ''}${slot.ready ? ' ✓' : ''}${slot.heroId === heroId ? ' · You' : ''}${slot.host ? ' · Host' : ''}`;
      button.disabled = !!lobby.started || (!!slot.player && slot.heroId !== heroId);
      button.onclick = () => send({ type: 'pick', heroId: slot.heroId });
      slots.appendChild(button);
    }
    const own = lobby?.slots.find(s => s.heroId === heroId);
    ready = own?.ready || false;
    document.getElementById('network-ready').textContent = ready ? 'Unready' : 'Ready';
    document.getElementById('network-ready').disabled = !active || !!lobby?.started;
    document.getElementById('network-start').disabled = !active || !!lobby?.started || !own?.host;
    document.getElementById('network-leave').disabled = !active;
    for (const id of ['pause', 'speed', 'reset']) {
      const element = document.getElementById(id); if (element) element.disabled = active;
    }
    if (active) status(lobby?.started ? (winner !== null ? rematchMessage() : `Online · ${room} · ${rtt ?? '…'} ms`) : `Room ${room} · choose a team slot, ready, then host starts`);
  }
  function connect(code, name) {
    code = String(code).trim().toUpperCase();
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) { status('Enter a six-character room code.'); return; }
    if (socket) { intentional = true; socket.close(); clearInterval(pingTimer); }
    clearTimeout(retry); room = code; active = true; intentional = false; lobby = null; heroId = null;
    status(`Connecting to ${room}…`);
    const ws = new WebSocket(base.replace(/^http/, 'ws') + `/api/kingdom/rooms/${room}/socket`);
    socket = ws;
    const joinName = String(name || document.getElementById('network-name')?.value || 'Conqueror').slice(0, 24);
    ws.addEventListener('open', () => {
      if (socket !== ws) return;
      received = Date.now();
      send({ type: 'join', version: protocolVersion, map: mapContract, name: joinName, token: storage.get() });
      pingTimer = setInterval(() => {
        if (Date.now() - received > 30000) { ws.close(); return; }
        send({ type: 'ping', sent: Date.now() });
      }, 5000);
    });
    ws.addEventListener('message', event => {
      if (socket !== ws) return;
      let msg; try { msg = JSON.parse(event.data); } catch { return; }
      received = Date.now();
      if (['hello','welcome','lobby','snapshot'].includes(msg.type) && !compatible(msg)) {
        intentional = true; clearInterval(pingTimer);
        status('Game map/version changed. Reload this page and create a new room.');
        ws.close(); return;
      }
      if (msg.type === 'welcome') {
        storage.set(msg.token); heroId = msg.heroId; seq = msg.seq; attempts = 0;
        const url = new URL(location.href); url.searchParams.set('room', room); history.replaceState(null, '', url);
        const node = document.getElementById('network-room'); if (node) node.value = room;
      } else if (msg.type === 'snapshot') applySnapshot(msg);
      else if (msg.type === 'lobby') {
        lobby = msg;
        // Pick changes are reflected by the slot labeled with this connection's hero ownership.
        const own = msg.slots.find(s => s.heroId === heroId);
        if (!own?.player) send({ type: 'ping', sent: Date.now() });
        renderLobby();
      } else if (msg.type === 'picked') { heroId = msg.heroId; selected = units.find(u => u.id === heroId) || null; renderRoster(); renderLobby(); }
      else if (msg.type === 'pong') { rtt = Math.max(0, Date.now() - msg.sent); renderLobby(); }
      else if (msg.type === 'error') {
        status(msg.code.replaceAll('_', ' ').toLowerCase());
        if (['RESUME_EXPIRED', 'ROOM_FULL', 'MATCH_STARTED', 'MAP_MISMATCH', 'VERSION_MISMATCH'].includes(msg.code)) {
          if (['RESUME_EXPIRED','MAP_MISMATCH','VERSION_MISMATCH'].includes(msg.code)) storage.remove();
          intentional = true; ws.close();
        }
      }
    });
    ws.addEventListener('close', () => {
      if (socket !== ws) return;
      clearInterval(pingTimer);
      if (intentional) return;
      if (++attempts > 8) { status('Connection lost. Your hero stays with a bot; retry Join to reconnect.'); return; }
      status(`Connection lost · reconnecting (${attempts}/8)…`);
      const delay = Math.min(10000, 500 * 2 ** (attempts - 1));
      retry = setTimeout(() => connect(room, joinName), delay);
    });
    ws.addEventListener('error', () => status('Room server unavailable. Practice remains available with Leave.'));
    renderLobby();
  }
  async function create(name) {
    status('Creating room…');
    try {
      const response = await fetch(base + '/api/kingdom/rooms', { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.room) throw new Error(data.error || 'Room server unavailable');
      if (!compatible(data)) throw new Error('Game map/version changed. Reload this page before creating a room.');
      attempts = 0; connect(data.room, name); return data.room;
    } catch (error) { status('Could not create room: ' + error.message); return null; }
  }
  function leave() {
    intentional = true; clearTimeout(retry); clearInterval(pingTimer);
    send({ type: 'leave' });
    if (socket) socket.close(); socket = null; active = false; heroId = null; lobby = null; attempts = 0;
    storage.remove();
    const url = new URL(location.href); url.searchParams.delete('room'); history.replaceState(null, '', url);
    originalInit(); renderLobby(); status('Practice · local bots. Create a room to play with friends.');
  }
  const api = window.KingdomNetwork = { create, join: connect, leave, input,
    ready: value => send({ type: 'ready', ready: value }), start: () => send({ type: 'start' }),
    pick: id => send({ type: 'pick', heroId: id }),
    get active() { return active; }, get room() { return room; }, get heroId() { return heroId; },
    get lobby() { return lobby; }, map: mapContract, version: protocolVersion, get latency() { return rtt; }, status: 'Practice', lastTick: 0 };

  update = function(dt) {
    if (!active) return originalUpdate(dt);
    const factor = Math.min(1, dt * 18);
    for (const u of units) {
      if (u._networkX !== undefined) u.x += (u._networkX - u.x) * factor;
      if (u._networkY !== undefined) u.y += (u._networkY - u.y) * factor;
    }
  };
  updateUI = function() {
    originalUpdateUI();
    if (active) {
      if (winner !== null) document.getElementById('status').textContent = rematchMessage();
      else document.getElementById('status').textContent += ` · Online ${room}${socket?.readyState === WebSocket.OPEN ? ` · ${rtt ?? '…'} ms` : ' · reconnecting'}`;
    }
  };
  command = function(p, target, attackMove) {
    if (!active) return originalCommand(p, target, attackMove);
    input(target ? { type: 'attack', targetId: target.id } : { type: 'move', x: clamp(p.x, 0, W), y: clamp(p.y, 0, H), attackMove: !!attackMove });
  };
  cast = function(u, slot, point) {
    if (!active) return originalCast(u, slot, point);
    if (u?.id === heroId) input({ type: 'cast', slot, x: clamp(point.x, 0, W), y: clamp(point.y, 0, H) });
  };
  chooseHero = function(kit) {
    if (!active) return originalChoose(kit);
    const slot = lobby?.slots.find(s => s.kit === kit); if (slot) send({ type: 'pick', heroId: slot.heroId });
  };
  tenSelect = function(id) {
    if (!active) return originalTenSelect(id);
    const unit = units.find(u => u.conqueror === id);
    if (unit) send({ type: 'pick', heroId: unit.id });
    return !!unit;
  };
  window.TenConquest.select = id => tenSelect(id);
  init = function() { if (!active) return originalInit(); };
  window.addEventListener('keydown', event => {
    if (!active || event.target?.closest?.('input,textarea,select,[contenteditable="true"]')) return;
    const action = { KeyS: 'stop', KeyB: 'recall', KeyF: 'flash' }[event.code];
    if (action) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (!event.repeat) input(action === 'flash' ? { type: action, x: clamp(mouse.x, 0, W), y: clamp(mouse.y, 0, H) } : { type: action });
    }
  }, true);
  document.addEventListener('click', event => {
    if (!active) return;
    const id = event.target.closest?.('#pause,#speed,#reset,#watch,#shop');
    if (id) { event.preventDefault(); event.stopImmediatePropagation();
      if (id.id === 'shop') status('Online armory: use the upgrade buttons in the room panel while at your fountain.');
    }
  }, true);
  if (panel) {
    panel.innerHTML = '<h3>Play with friends</h3><p id="network-status" role="status" aria-live="polite"></p><label>Your name <input id="network-name" maxlength="24" placeholder="Conqueror" autocomplete="nickname"></label><div><button id="network-create" type="button">Create room</button><button id="network-leave" type="button" disabled>Leave · practice</button></div><label>Room code <input id="network-room" maxlength="6" placeholder="ABC234" autocapitalize="characters" spellcheck="false"></label><button id="network-join" type="button">Join room</button><button id="network-copy" type="button">Copy invite</button><div id="network-slots"></div><button id="network-ready" type="button" disabled>Ready</button><button id="network-start" type="button" disabled>Start with bots</button><details><summary>Fountain armory</summary><button data-network-buy="blade" type="button">Blade · 120 bells</button><button data-network-buy="armor" type="button">Armor · 100 bells</button><button data-network-buy="boots" type="button">Boots · 80 bells</button></details><small>Host starts when friends are ready. Empty slots use bots. Reconnect reserves your hero for 90 seconds. Mouse + keyboard recommended.</small>';
    document.getElementById('network-create').onclick = () => create();
    document.getElementById('network-join').onclick = () => { attempts = 0; connect(document.getElementById('network-room').value); };
    document.getElementById('network-leave').onclick = leave;
    document.getElementById('network-ready').onclick = () => api.ready(!ready);
    document.getElementById('network-start').onclick = api.start;
    document.getElementById('network-copy').onclick = async () => {
      if (!room) return status('Create or join a room first.');
      try { await navigator.clipboard.writeText(location.href); status('Invite link copied.'); }
      catch { status('Invite: ' + location.href); }
    };
    panel.querySelectorAll('[data-network-buy]').forEach(button => button.onclick = () => input({ type: 'buy', item: button.dataset.networkBuy }));
  }
  status('Practice · local bots. Create a room to play with friends.');
  const invite = new URL(location.href).searchParams.get('room');
  if (invite && /^[A-HJ-NP-Z2-9]{6}$/i.test(invite)) connect(invite);
})();
