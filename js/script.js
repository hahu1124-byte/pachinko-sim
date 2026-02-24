/* --- 動き (JavaScript) --- */
const SPECS = { n: 319.7, s: 99.4, st: 163, jt: 100 };
let hits = 0, rushCount = 0, currentRot = 0, totalRot = 0, totalBall = 0, currentRushHits = 0, maxHamari = 0;
let mode = '通常', rRem = 0, isAuto = false, autoSpeed = 'slow', isAnim = false;
let lcdCount = 0, optKokuchi = false;
let reservedStock = [], activeJob = null;
let slumpData = [0], slumpLabels = ["0"], historyData = [], historyLabels = [];
let sChart, hChart, firstHitRot = 0, rushSeriesCount = 0;

// 正しい抽選フロー：先に当たり外れを決め、それに合わせて演出を抽選する
function createJob() {
    const isHit = Math.random() < (1 / (mode === '通常' || mode === '時短' ? SPECS.n : SPECS.s));
    let res = {
        isHit: isHit,
        heavy: false,
        name: [],
        trust: 0,
        vibe: false,
        vibeColor: "none",
        flash: false,
        text: "",
        holdType: "none",
        currentView: "none",
        isRushSure: false
    };

    const r = Math.random() * 100;

    if (isHit) {
        // 【当たり時の演出振り分け】
        if (mode === '通常' || mode === '時短') {
            if (r < 1) { res.name.push("全回転リーチ"); res.isRushSure = true; res.text = "祝"; res.trust = 100; }
            else if (r < 3) { res.name.push("突発当り"); res.isRushSure = true; res.vibe = true; res.vibeColor = "rainbow"; res.trust = 100; }
            else if (r < 6) { res.name.push("虹レバ"); res.vibe = true; res.vibeColor = "rainbow"; res.isRushSure = true; res.trust = 100; }
            else if (r < 10) { res.name.push("渚カヲル"); res.isRushSure = true; res.trust = 100; }
            else if (r < 15) { res.name.push("最終号機リーチ"); res.text = "最終号機\n画ブレ金"; res.vibe = true; res.vibeColor = "red"; res.trust = 98.0; }
            else if (r < 25) { res.name.push("赤レバ"); res.vibe = true; res.vibeColor = "red"; res.trust = 96.5; }
            else if (r < 35) { res.name.push("ロンギヌスの槍保留"); res.holdType = "vibe"; res.trust = 95.0; }
            else if (r < 45) { res.name.push("カウントダウン"); res.text = "３・２・１\n・０"; res.trust = 92.0; }
            else if (r < 60) { res.name.push("白レバ"); res.vibe = true; res.vibeColor = "white"; res.trust = 90.0; }
            else if (r < 75) { res.name.push("レイ背景"); res.text = "レイ背景"; res.trust = 85.0; }
            else if (r < 85) { res.name.push("赤保留"); res.holdType = "red"; res.trust = 90.0; }
            else if (r < 90) { res.name.push("震える保留"); res.holdType = "vibe"; res.trust = 80.0; }
            else { res.name.push("通常"); res.trust = 0.1; }
        } else {
            // ST中当たり演出
            if (r < 5) { res.name.push("突発当り"); res.vibe = true; res.vibeColor = "rainbow"; res.trust = 100; }
            else if (r < 15) { res.name.push("ST次回予告"); res.text = "次回予告"; res.trust = 100; }
            else if (r < 25) { res.name.push("STレイ背景"); res.text = "レイ背景"; res.trust = 100; }
            else if (r < 45) { res.name.push("ST赤レバ"); res.vibe = true; res.vibeColor = "red"; res.trust = 99.0; }
            else { res.name.push("ST赤保留"); res.holdType = "red"; res.trust = 95.0; }
        }
    } else {
        // 【外れ時の演出振り分け】
        // ！！修正箇所！！
        // ハズレは当たりに比べて約318倍発生するため、ハズレ時に表示される確率は
        // 当たり時の確率の「318分の1以下」にしなければ、本来の信頼度にはならない（分母の罠の解消）。
        // 目標信頼度 = 当たり時の振り分け / (当たり時振り分け + ハズレ時振り分け比率*318)
        if (mode === '通常' || mode === '時短') {
            // 当たりとの比率計算に基づく信頼度設定（318倍の分母を考慮）
            if (r < 0.001) { res.name.push("最終号機リーチ"); res.text = "最終号機\n画ブレ銀"; res.trust = 98.0; }
            else if (r < 0.0015) { res.name.push("ロンギヌスの槍保留"); res.holdType = "vibe"; res.trust = 95.0; }
            else if (r < 0.005) { res.name.push("赤レバ"); res.vibe = true; res.vibeColor = "red"; res.trust = 96.5; }
            else if (r < 0.007) { res.name.push("カウントダウン"); res.text = "３・２・１\n・・"; res.trust = 92.0; }
            else if (r < 0.012) { res.name.push("白レバ"); res.vibe = true; res.vibeColor = "white"; res.trust = 90.0; }
            else if (r < 0.017) { res.name.push("赤保留"); res.holdType = "red"; res.trust = 90.0; }
            else if (r < 0.025) { res.name.push("震える保留"); res.holdType = "vibe"; res.trust = 80.0; }
            else if (r < 0.035) { res.name.push("レイ背景"); res.text = "レイ背景"; res.trust = 85.0; }
            else if (r < 0.835) { res.name.push("緑保留"); res.holdType = "green"; res.trust = 11.0; }
            else if (r < 4.835) { res.name.push("青保留"); res.holdType = "blue"; res.trust = 3.0; }
            else { res.trust = 0.1; }
        } else {
            // ST中外れ演出 (ST中はハズレが約98回/1回当たり となるため比率は約98倍)
            // ST赤保留(95.0%目標) 当たり時60%: 60 / (60 + X*98) = 0.95 -> 約 0.032%
            if (r < 0.032) { res.name.push("ST赤保留"); res.holdType = "red"; res.trust = 95.0; }
            // ST緑保留(20.0%目標) 当たり時0%: チャンス演出としてハズレ時 約1.0%
            else if (r < 1.032) { res.name.push("ST緑保留"); res.holdType = "green"; res.trust = 20.0; }
            else { res.trust = 0.1; }
        }
    }

    // 保留の見た目決定
    if (res.holdType === "red" || (res.vibe && !res.isRushSure)) {
        let rr = Math.random();
        res.currentView = rr < 0.4 ? "blue" : (rr < 0.8 ? "green" : "red");
    } else if (res.holdType === "vibe") {
        res.currentView = "vibe";
    } else { res.currentView = res.holdType; }

    res.heavy = (res.trust >= 50);
    res.displayName = Array.from(new Set(res.name)).join("+").replace(/ST/g, "") || "通常";
    return res;
}

// --- 以下、システムロジック (変更なし) ---
async function startProcess() {
    if (!isAuto || isAnim) return;
    if (mode !== '通常' && rRem <= 0) {
        addLog(`【${mode}終了】 ${currentRushHits}連`);
        rushSeriesCount++; historyData.push(firstHitRot); historyLabels.push(`${rushSeriesCount}回目(${currentRushHits}連)`); hChart.update();
        mode = '通常'; currentRushHits = 0; firstHitRot = 0; updateUI();
    }
    activeJob = reservedStock.shift(); if (activeJob) activeJob.currentView = activeJob.holdType;
    refillStock(); updateUI();
    let eff = activeJob;
    if (optKokuchi && eff.isHit) { eff.flash = true; eff.trust = 100; eff.displayName = "インフラ告知"; }
    totalRot++; currentRot++; lcdCount++;
    if (mode !== '通常') { rRem--; totalBall -= 0.05; } else { totalBall -= 13.8; }
    updateCharts();
    // trustが50以上（激熱以上）、または当落が確定している場合のみログに出力
    if (eff.trust >= 50.0 || eff.isHit) { addLog(`${mode} ${lcdCount}回転【${eff.displayName}】信頼度:${eff.trust.toFixed(1)}%`); }
    const machineEl = document.getElementById('machine'), screenEl = document.getElementById('screen');
    if (eff.vibe) { machineEl.classList.add('vibrate', 'vibe-' + eff.vibeColor); screenEl.classList.add('vibrate', 'vibe-' + eff.vibeColor); }
    if (eff.flash) document.getElementById('lamp').classList.add('lamp-active');
    if (eff.text) { const ov = document.getElementById('effect-overlay'); ov.innerText = eff.text; ov.style.display = 'block'; }
    let currentSpeed = autoSpeed;
    // 高速オート中、期待度が高い演出（信頼度10%以上、緑保留などチャンスアップ以上）が来た場合は低速にする
    if (autoSpeed === 'fast' && eff.trust >= 10.0) {
        currentSpeed = 'slow';
    }

    // スピード調整。高速オート(fast)時は20ms、低速オート・チャンス時(slow)は600ms、激熱(heavy)は1800ms
    let spinTime = (eff.heavy) ? 1800 : (currentSpeed === 'fast' ? 20 : 600);
    let spin = setInterval(() => { [1, 2, 3].forEach(i => { let n = Math.floor(Math.random() * 9) + 1; const el = document.getElementById('d' + i); el.innerText = n; el.className = getDigitClass(n, mode); }); }, 40);
    await new Promise(r => setTimeout(r, spinTime));
    clearInterval(spin);
    let finalNums, hitDigit;
    if (eff.isHit) {
        if (eff.isRushSure && (mode === '通常' || mode === '時短')) {
            hitDigit = [1, 3, 5, 9][Math.floor(Math.random() * 4)];
        } else {
            let rand = Math.random() * 100;
            if (mode === '通常' || mode === '時短') {
                if (rand < 3) hitDigit = 7;
                else if (rand < 44) { hitDigit = [2, 4, 6, 8][Math.floor(Math.random() * 4)]; }
                else { hitDigit = [1, 3, 5, 9][Math.floor(Math.random() * 4)]; }
            } else { hitDigit = (Math.random() < 0.5) ? 3 : 1; }
        }
        finalNums = [hitDigit, hitDigit, hitDigit];
    } else { finalNums = generateFinalDigits(); }
    [1, 3, 2].forEach(i => { const el = document.getElementById('d' + i); el.innerText = finalNums[i - 1]; el.className = getDigitClass(finalNums[i - 1], mode); });
    machineEl.classList.remove('vibrate', 'vibe-white', 'vibe-red', 'vibe-rainbow');
    screenEl.classList.remove('vibrate', 'vibe-white', 'vibe-red', 'vibe-rainbow');
    document.getElementById('lamp').classList.remove('lamp-active');
    document.getElementById('effect-overlay').style.display = 'none';
    if (eff.isHit) {
        isAnim = true; hits++;
        if (mode === '通常') {
            firstHitRot = lcdCount;
            if (currentRot > maxHamari) { maxHamari = currentRot; document.getElementById('max-hamari-box').innerText = `最大ハマリ: ${maxHamari}`; }
        }
        let bonusBall, isST = false, needsUpgrade = false, isRightUpgrade = false, originalHit = hitDigit;
        if (mode === '通常') {
            rushCount = 1;
            if (eff.isRushSure) { isST = true; bonusBall = 420; addLog(">> プレミアム演出！！"); }
            else if (originalHit === 7) { isST = true; bonusBall = 1400; addLog(">> 全回転！！"); }
            else if (originalHit % 2 !== 0) { isST = true; bonusBall = 420; }
            else { if (Math.random() < 0.20) { isST = true; needsUpgrade = true; bonusBall = 420; } else { isST = false; bonusBall = 420; } }
        } else if (mode === '時短') {
            isST = true; bonusBall = 1400; isRightUpgrade = true;
            addLog(`>> 時短引き戻し成功！ 【${originalHit}】`);
        } else { isST = true; bonusBall = 1400; rushCount++; isRightUpgrade = true; }
        addLog(`>> 当たり！ 【${originalHit}】${lcdCount}回転`);
        totalBall += bonusBall; currentRot = 0;
        await new Promise(r => setTimeout(r, 1000));
        if (mode === '通常' && needsUpgrade) {
            let nextOdd = [1, 3, 5, 9][Math.floor(Math.random() * 4)];
            addLog(`>> ${nextOdd}図柄へ昇格！！`);
            document.getElementById('lamp').classList.add('lamp-active');
            [1, 2, 3].forEach(i => { const el = document.getElementById('d' + i); el.innerText = nextOdd; el.className = 'digit odd'; });
            await new Promise(r => setTimeout(r, 800));
            document.getElementById('lamp').classList.remove('lamp-active');
        }
        if (isRightUpgrade) {
            machineEl.classList.add('vibe-rainbow');
            document.getElementById('lamp').classList.add('lamp-active');
            [1, 2, 3].forEach(i => { const el = document.getElementById('d' + i); el.innerText = 7; el.className = 'digit gold'; });
            await new Promise(r => setTimeout(r, 1000));
            machineEl.classList.remove('vibe-rainbow');
            document.getElementById('lamp').classList.remove('lamp-active');
        }
        if (isST) { mode = 'ST'; rRem = SPECS.st; } else { mode = '時短'; rRem = SPECS.jt; }
        currentRushHits++; lcdCount = 0; updateUI();
        await new Promise(r => setTimeout(r, 600));
    }
    isAnim = false; updateUI(); updateAutoBtns();
    // 次回転への待機時間も調整（高速時は20ms、低速時は150ms）
    let nextDelay = (autoSpeed === 'fast' && (!eff || eff.trust < 10.0)) ? 20 : 150;
    if (isAuto) setTimeout(startProcess, nextDelay);
}

function getDigitClass(num, currentMode) {
    if (num === 7 && (currentMode !== '通常')) return 'digit gold';
    return (num % 2 !== 0) ? 'digit odd' : 'digit even';
}

function generateFinalDigits() {
    let d1 = Math.floor(Math.random() * 9) + 1;
    let d3 = Math.floor(Math.random() * 9) + 1;
    let d2 = Math.floor(Math.random() * 9) + 1;
    if (Math.random() < 0.25) {
        d3 = d1;
        while (d2 === d1) d2 = Math.floor(Math.random() * 9) + 1;
    } else {
        while (d1 === d3) d3 = Math.floor(Math.random() * 9) + 1;
    }
    if (d1 === d2 && d2 === d3) return generateFinalDigits();
    return [d1, d2, d3];
}

function refillStock() {
    while (reservedStock.length < 4) {
        reservedStock.push(createJob());
    }
    updateHesoUI();
}

function updateHesoUI() {
    const hA = document.getElementById('heso-area');
    mode !== '通常' ? hA.classList.add('right-mode') : hA.classList.remove('right-mode');
    for (let i = 0; i <= 4; i++) {
        const el = document.getElementById('h' + i);
        const s = (i === 0) ? activeJob : (reservedStock[i - 1] || null);
        el.className = `heso-ball ${i === 0 ? 'heso-current' : ''}`;
        if (s) {
            el.classList.add('heso-' + s.currentView);
        }
    }
}

function toggleAuto(s) {
    if (isAuto && autoSpeed === s) {
        isAuto = false;
    } else {
        isAuto = true;
        autoSpeed = s;
        if (!isAnim) startProcess();
    }
    updateAutoBtns();
}

function updateAutoBtns() {
    document.getElementById('btn-slow').classList.toggle('btn-stop', isAuto && autoSpeed === 'slow');
    document.getElementById('btn-fast').classList.toggle('btn-stop', isAuto && autoSpeed === 'fast');
}

function toggleOpt(t) {
    if (t === 'kokuchi') optKokuchi = !optKokuchi;
    document.getElementById('btn-' + t).classList.toggle('active');
}

function updateUI() {
    document.getElementById('hits').innerText = hits;
    document.getElementById('rush-count').innerText = rushCount;
    document.getElementById('current-rot').innerText = currentRot;
    document.getElementById('total-rot').innerText = totalRot;
    document.getElementById('balance').innerText = Math.floor(totalBall).toLocaleString();
    document.getElementById('sub-display').innerText = mode === '通常' ? `通常:${lcdCount}` : `${mode}:${rRem}`;
    updateHesoUI();
}

function addLog(m) {
    const l = document.getElementById('log');
    l.innerHTML = `> ${m}<br>${l.innerHTML}`;
}

function initCharts() {
    sChart = new Chart(document.getElementById('slumpChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: slumpLabels,
            datasets: [{
                label: '差玉',
                data: slumpData,
                borderColor: '#8a2be2',
                borderWidth: 2,
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    hChart = new Chart(document.getElementById('historyChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: historyLabels,
            datasets: [{
                label: '初当り回転',
                data: historyData,
                backgroundColor: '#ff4444'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateCharts() {
    slumpData.push(totalBall);
    slumpLabels.push(totalRot.toString());
    sChart.update('none');
}

function openModal() {
    document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

function resetData() {
    if (confirm('データをリセットしますか？')) location.reload();
}

// --- ダークモード・ライトモード切り替え ---
function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById('btn-theme');
    body.classList.toggle('light-mode');
    if (body.classList.contains('light-mode')) {
        btn.innerText = "ダーク🌙";
    } else {
        btn.innerText = "ライト☀️";
    }
}

window.onload = () => {
    initCharts();
    refillStock();
    updateUI();
};
