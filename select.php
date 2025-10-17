<?php
// POSTリクエストからデータを取得
$lowestNote = isset($_POST['lowest_note']) ? (int)$_POST['lowest_note'] : 0;
$highestNote = isset($_POST['highest_note']) ? (int)$_POST['highest_note'] : 0;

// MIDIノートナンバーを音名に変換する関数
function midiNoteToName($midiNote) {
    $noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    $octave = floor($midiNote / 12) - 1;
    $noteIndex = $midiNote % 12;
    return $noteNames[$noteIndex] . $octave;
}

// 最低音と最高音を音名に変換
$lowestNoteName = $lowestNote > 0 ? midiNoteToName($lowestNote) : "--";
$highestNoteName = $highestNote > 0 ? midiNoteToName($highestNote) : "--";

// 音域に合った曲のサンプルデータ（実際の運用ではデータベースから取得するなど）
$songs = [
    // 低音域（C3-C4：48-60）
    ['title' => '情熱大陸', 'artist' => '葉加瀬太郎', 'min' => 48, 'max' => 60],
    ['title' => '366日', 'artist' => 'HY', 'min' => 50, 'max' => 62],
    
    // 中低音域（C4-G4：60-67）
    ['title' => 'Jupiter', 'artist' => '平原綾香', 'min' => 55, 'max' => 67],
    ['title' => '恋', 'artist' => '星野源', 'min' => 57, 'max' => 69],
    
    // 中音域（G4-C5：67-72）
    ['title' => 'TSUNAMI', 'artist' => 'サザンオールスターズ', 'min' => 60, 'max' => 72],
    ['title' => 'シュガーソングとビターステップ', 'artist' => 'UNISON SQUARE GARDEN', 'min' => 62, 'max' => 74],
    
    // 中高音域（C5-G5：72-79）
    ['title' => 'レット・イット・ゴー', 'artist' => '松たか子', 'min' => 67, 'max' => 79],
    ['title' => '残酷な天使のテーゼ', 'artist' => '高橋洋子', 'min' => 69, 'max' => 81],
    
    // 高音域（G5以上：79以上）
    ['title' => 'シャルル', 'artist' => 'バルーン', 'min' => 74, 'max' => 86],
    ['title' => 'アイノカタチ', 'artist' => 'MISIA', 'min' => 76, 'max' => 88],
];

// 音域に合った曲のフィルタリング（ユーザーの音域に完全に収まる曲のみ）
$matchingSongs = [];
if ($lowestNote > 0 && $highestNote > 0) {
    foreach ($songs as $song) {
        if ($lowestNote <= $song['min'] && $highestNote >= $song['max']) {
            $matchingSongs[] = $song;
        }
    }
}
?>

<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>あなたの音域に合った曲</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f0f2f5;
            color: #333;
        }

        .container {
            padding: 40px;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.1);
            width: 90%;
            max-width: 800px;
        }

        h1 {
            color: #1a73e8;
            margin-top: 0;
        }

        .vocal-range {
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }

        .vocal-range span {
            font-weight: bold;
            color: #1a73e8;
        }

        .songs-list {
            margin-top: 30px;
        }

        .song-card {
            padding: 15px;
            margin-bottom: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            transition: transform 0.3s, box-shadow 0.3s;
        }

        .song-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .song-title {
            font-weight: bold;
            font-size: 1.2em;
            margin-bottom: 5px;
        }

        .song-artist {
            color: #666;
        }
        
        .song-range {
            margin-top: 8px;
            font-size: 0.9em;
            color: #1a73e8;
        }
        
        .no-songs {
            padding: 20px;
            text-align: center;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        
        .back-button {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #6c757d;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>あなたの音域に合った曲</h1>
        
        <div class="vocal-range">
            <p>あなたの音域: <span><?php echo $lowestNoteName; ?></span> から <span><?php echo $highestNoteName; ?></span></p>
            <p>MIDIノート番号: <span><?php echo $lowestNote; ?></span> から <span><?php echo $highestNote; ?></span></p>
        </div>
        
        <?php if (count($matchingSongs) > 0): ?>
            <div class="songs-list">
                <h2>おすすめの曲</h2>
                <?php foreach ($matchingSongs as $song): ?>
                    <div class="song-card">
                        <div class="song-title"><?php echo htmlspecialchars($song['title']); ?></div>
                        <div class="song-artist"><?php echo htmlspecialchars($song['artist']); ?></div>
                        <div class="song-range">音域: <?php echo midiNoteToName($song['min']); ?> から <?php echo midiNoteToName($song['max']); ?></div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <div class="no-songs">
                <p>あなたの音域に完全に収まる曲が見つかりませんでした。</p>
                <p>より多くの曲をチェックするには、もう少し高音域または低音域まで測定してみてください。</p>
            </div>
        <?php endif; ?>
        
        <a href="index.html" class="back-button">戻る</a>
    </div>
</body>
</html>