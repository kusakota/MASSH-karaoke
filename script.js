// HTMLから操作する要素を取得
const startButton = document.getElementById('startButton'); // 開始ボタン
const stopButton = document.getElementById('stopButton');   // 停止ボタン
const resetButton = document.getElementById('resetButton'); // リセットボタン
const resultDiv = document.getElementById('result');       // 結果表示エリア

// 最高音を表示するための要素
const highestPitchSpan = document.getElementById('highestPitch');
const highestNoteNameSpan = document.getElementById('highestNoteName');

// 最低音を表示するための要素
const lowestPitchSpan = document.getElementById('lowestPitch');
const lowestNoteNameSpan = document.getElementById('lowestNoteName');

// Web Audio API関連の変数を準備
let audioContext; // 音声処理の全体を管理するオブジェクト
let analyser;     // 周波数分析を行うためのノード
let mediaStream;  // マイクからの音声ストリーム
let animationFrameId; // アニメーションフレームのID（停止時に使用）
let detector; // Pitchyのピッチ検出器

// 最高音と最低音の周波数を記録する変数
let highestFrequency = 0;       // 最高周波数の初期値
let lowestFrequency = Infinity; // 最低周波数の初期値（どんな有限の値よりも大きい）

// 音名を定義した配列
const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * 周波数（Hz）を音名（例: "A4"）に変換する関数
 * @param {number} frequency - 変換したい周波数
 * @returns {string} - 計算された音名
 */
function frequencyToNote(frequency) {
    // 周波数が有限でない、または0の場合は処理を中断
    if (!isFinite(frequency) || frequency === 0) return "--";
    
    // 基準音A4 (440Hz) からの相対的な音の高さを計算
    const noteNum = 12 * (Math.log2(frequency / 440));
    // MIDIノートナンバーに変換し、最も近い整数に丸める
    const roundedNoteNum = Math.round(noteNum) + 69;
    // オクターブを計算 (C4が中央のド)
    const octave = Math.floor(roundedNoteNum / 12) - 1;
    // 12音階の中での音のインデックスを計算
    const noteIndex = roundedNoteNum % 12;
    
    // 配列から音名を取得し、オクターブと連結して返す
    return noteStrings[noteIndex] + octave;
}

// 開始ボタンがクリックされたときの処理
startButton.addEventListener('click', async () => {
    try {
        // AudioContextを初期化（ブラウザ間の互換性を考慮）
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // マイクへのアクセスを要求し、音声ストリームを取得
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStream = stream;

        // AnalyserNodeを作成し、設定を行う
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048; // Pitchyの推奨値または適切な値に設定

        // Pitchyの検出器を初期化
        detector = pitchy.PitchDetector.forFloat32Array(analyser.fftSize);

        // マイクからの音声ストリームをAnalyserNodeに接続
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        // UIの表示を更新
        startButton.style.display = 'none';
        stopButton.style.display = 'inline-block';
        resultDiv.style.display = 'block';

        // ピッチ分析を開始
        analyzePitch();

    } catch (err) {
        // エラー処理
        alert('マイクへのアクセスが拒否されたか、マイクが利用できません。');
        console.error(err);
    }
});

// 停止ボタンがクリックされたときの処理
stopButton.addEventListener('click', () => {
    // マイクのトラックを停止して、マイクの使用を終了
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    // analyzePitchのループを停止
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    // AudioContextを閉じてリソースを解放
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
    }
    
    // UIを初期状態に戻す
    startButton.style.display = 'inline-block';
    stopButton.style.display = 'none';
    
    // 停止時に最高音・最低音はリセットせず、記録を保持する
});

// リセットボタンがクリックされたときの処理
resetButton.addEventListener('click', () => {
    highestFrequency = 0;
    lowestFrequency = Infinity;

    highestPitchSpan.textContent = `... Hz`;
    highestNoteNameSpan.textContent = "--";
    lowestPitchSpan.textContent = `... Hz`;
    lowestNoteNameSpan.textContent = "--";
});

function analyzePitch() {
    // 波形データを格納するための配列を準備
    const dataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(dataArray);

    // Pitchyを使ってピッチとクラリティ（明瞭度）を検出
    const [pitch, clarity] = detector.findPitch(dataArray, audioContext.sampleRate);

    // クラリティが一定のしきい値（0.95）を超え、ピッチが検出された場合のみ処理
    if (clarity > 0.95 && pitch) {
        const currentFrequency = pitch;

        // 人間の声の周波数範囲（約80Hz〜1100Hz）に限定する
        const MIN_VOICE_FREQUENCY = 80;
        const MAX_VOICE_FREQUENCY = 1100;

        if (currentFrequency >= MIN_VOICE_FREQUENCY && currentFrequency <= MAX_VOICE_FREQUENCY) {
            // 現在の周波数が記録されている最高周波数より高い場合
            if (currentFrequency > highestFrequency) {
                highestFrequency = currentFrequency;
                // UIを更新
                highestPitchSpan.textContent = `${Math.round(highestFrequency)} Hz`;
                highestNoteNameSpan.textContent = frequencyToNote(highestFrequency);
            }

            // 現在の周波数が0より大きく、記録されている最低周波数より低い場合
            if (currentFrequency > 0 && currentFrequency < lowestFrequency) {
                lowestFrequency = currentFrequency;
                // UIを更新
                lowestPitchSpan.textContent = `${Math.round(lowestFrequency)} Hz`;
                lowestNoteNameSpan.textContent = frequencyToNote(lowestFrequency);
            }
        }
    }

    // 次のフレームで再度この関数を呼び出し、分析をループさせる
    animationFrameId = requestAnimationFrame(analyzePitch);
}