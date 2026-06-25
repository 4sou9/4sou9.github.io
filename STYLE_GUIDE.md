# 4sou9.github.io — スタイルガイド

複数ページをまたいでゴールへ進む**インタラクティブアート(迷路)**。各ページが
グランジ/Y2K/ブルータリスト系ポスター(`参考/` 参照)。このドキュメントは、
新しいページを既存と同じ作法で作るための指針。

---

## 1. 核となる原則

| 原則 | 内容 |
|---|---|
| **2〜4色フラット** | 1ページ = 黒(または紙) ＋ アクセント1〜3色程度で、**計2〜4色**の範囲。**階調・グラデーション禁止**(参考にもグラデは無い)。 |
| **アクセントはページ毎に変える** | 既存の層と被らない色に。中間色(dim/グレー)は基本使わず、階層はサイズ・ウェイト・位置で付ける。 |
| **インクのにじみ** | 全要素を1枚のSVGフィルタで二階調化(ぼかし→閾値→滲み)。後述。 |
| **固定pxレイアウト** | ポスターは `width:960px` 固定・中央寄せ。収まらなければ圧縮せず普通にスクロール/拡大(古いWeb式)。 |
| **現在地を悟らせない** | ページ番号・順序が分かる表示は出さない(後述)。 |
| **隠しゲートで遷移** | 各ページ中央の焦点に不可視リンク。ボタン表記・ホバー演出なし、カーソルも変えない。 |

> 遷移チェーン: `index → husk → scar → veil → rot → ash → maw → echo → index`
> (各ページの実際の色・層名は当該HTMLの `:root` を参照)

---

## 2. インクのにじみ(二階調化フィルタ)

全要素を覆う `.poster` に1枚かける。**alpha(輪郭)を閾値化**するので、フィルタ対象の
**背景は透明**であること(黒/紙は `body` 側、`html,body{background:var(--black)}`)。

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <filter id="ink" x="-3%" y="-2%" width="106%" height="104%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceGraphic" stdDeviation="0.55" result="b"/>
    <feColorMatrix in="b" type="matrix"
      values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 13 -4" result="t"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="6" result="n"/>
    <feDisplacementMap in="t" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</defs></svg>
```
```css
.poster{ filter:url(#ink); background:transparent; }
```

### チューニングの勘所
- **`feColorMatrix` の最終行 `... 13 -4`** = alphaを `13×a - 4` にして閾値化(二階調)。RGBは恒等で色を保持。
- **小さな文字が痩せて消える** = ぼかし＋急峻な閾値による侵食。→ `stdDeviation` を下げ、閾値を緩める。
- **枠線・大見出しの「滲み」感** = `feDisplacementMap` の変位。→ `scale` で調整(高すぎると小文字を破壊)。
- 大見出しと極小文字を1パスで両立する現状値: **blur 0.55 / alpha 13 -4 / turbulence baseFreq 0.5 scale 1.5**。
- 白背景ページ(`ash`)は少し弱め: blur 0.5 / `14 -4.5` / scale 1.3。
- **不透明な背景を敷くと二階調化が無効化**して全体がぼやける(よくある事故)。

---

## 3. SVG素材の再配色(マスク技法)

素材は黒の透過アート(`assets/`、全809点)。**`mask-image` + `background-color` + `mask-mode:alpha`** で任意色に塗る。

```css
.sym{
  background:var(--accent);            /* 塗り色 */
  -webkit-mask-image:url('assets/sym/s40.svg'); mask-image:url('assets/sym/s40.svg');
  -webkit-mask-size:contain; mask-size:contain;
  -webkit-mask-repeat:no-repeat; mask-repeat:no-repeat;
  -webkit-mask-position:center; mask-position:center;
  -webkit-mask-mode:alpha; mask-mode:alpha;   /* 必須 */
}
```

### 落とし穴(重要)
1. **`mask` ショートハンドは使わない**。`mask:url(...)` は `mask-mode` を `match-source`(=luminance)に
   リセットし、黒素材が消える。必ず **`mask-image` ロングハンド**で。
2. **CSS変数に `url()` を入れない**。`--src:url(...)` は使用元(`assets/` 内のcss)基準で解決され
   `assets/assets/...` の二重404になる。マスクは**各HTMLのインライン**でHTML基準パスを直接指定する。
3. **`file://` 直開きは不可**。CSSマスクはCORSで表示されない。確認は必ずローカルhttp経由。
4. タイル状(有刺鉄線・バーコード等)は `mask-repeat:repeat-x; mask-size:NN NN`。

### `assets/` の中身(フォルダ=元パック)
`sym`(Shapes Pack 101) `circuit`/`board2`(MOTHERBOARD 各66) `fig`(Wire Figures 25)
`grunge`(UNCOMMON 45) `astral`(Astral Artifacts 85) `ten`(10_SVG 75) `grid`(4 grided 5)
`fruit`/`fruit2`/`fruit3`(Astral Fruits 35/52/146) `grenade`(Good Grenades 108)

> `assets/astral/a1〜a24` は `echo.html` が参照中。番号を振り直さないこと。

---

## 4. レイアウト

```css
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:var(--black)}
body{min-height:100vh;padding:18px;overflow:auto}   /* flex中央寄せは使わない */
.poster{position:relative;width:960px;margin:0 auto;  /* ←中央寄せはmargin auto */
        background:transparent;filter:url(#ink);padding:22px}
```
- **`margin:0 auto` で中央寄せ**。`display:flex;justify-content:center` は画面幅 < 960pxのとき
  左側がスクロール不能になるので**使わない**。
- 共有プリミティブ(色・フォント・`.poster`・`.sym`)は `assets/poster.css`。各ページは
  `<link>` で読み込み、独自レイアウトは各HTMLの `<style>` に書く(index は自己完結でinline)。
- 内部は固定px。グリッド/フレックスで**ウィンドウ間のgapを一定**にすると端正(例: `--g:12px`)。
- ウィンドウがはみ出す時は flex/grid 子要素に `min-width:0; overflow:hidden`。

---

## 5. タイポグラフィ

- **多言語の断片を混在**(日中韓英＋露/アラビア/ヘブライ/タイ/ヒンディー/ギリシャ…)。
  非ラテン文字は対応する Noto フォントを読み込む。
- **層ごとに専用フォント群**を与えて個性を出す(1層と被らせない)。例:
  - THRESHOLD: Anton / Archivo Black / UnifrakturCook / VT323 / Major Mono / Noto Serif JP
  - BLACKOUT: Orbitron / Wallpoet / DotGothic16 / Share Tech Mono / JetBrains Mono
  - WRATH: Bebas Neue / Oswald / Teko / Special Elite / Nosifer / Pirata One
  - AETHER: Cinzel / Cinzel Decorative / Cormorant / MedievalSharp / Shippori Mincho / Monoton
  - QUARANTINE: Black Ops One / Saira Stencil One
  - DECLASSIFIED: DM Serif Display / Special Elite
  - OMEN: Rubik Mono One / Nosifer
  - REPLAY: Archivo Black / Pirata One
- 縦組みは `writing-mode:vertical-rl`。ラテン語を立てるなら `text-orientation:upright`。
- 見出しは**1ページに巨大なものを1〜2語**だけ。残りは小さく多数。

---

## 6. 各層の構成アーキタイプ(参考画像 → 構図)

| 層 | 元ネタ | 構図 |
|---|---|---|
| THRESHOLD | CLEAR INTENT | エディトリアル(ヘッダ/ティッカー/3カラム/巨大語/キャプション/フッタ) |
| BLACKOUT | DIGITAL OVERLOAD | コンソール・グリッド(ウィンドウ群を等間隔、ターミナル/ASCII/16進ダンプ) |
| WRATH | A BAD GUY / 1984 | 英語のみ＋SVG記号カタログ(ARMORY 8×4)主役、機密ファイル風 |
| AETHER | KOZMIK / FEVERDREAMS | 左右対称オカルト紋章＋額縁、ミラーのラベル列 |
| QUARANTINE | — | 黒×黄の2色ハザード(ストライプテープ・警告三角・封じ込め) |
| DECLASSIFIED | — | 白(紙)背景の機密解除文書(黒塗り/赤スタンプ/二段組) |
| OMEN | DREAD | 無文字寄り・左右対称・記号と図版主体 |
| REPLAY | FIGHT | **角丸(border-radius)** のCRT放送・アイソメ機材 |

> ヘッダー/フッターも層ごとに別個性に(例: OSステータスバー、機密ケースファイル、
> コマンドラインプロンプト、証拠ログ＋バーコード、角丸ピル)。

---

## 7. 隠しゲート(遷移)

```html
<a class="gate" href="次のスラッグ.html" aria-label="進む"
   style="position:absolute;inset:0;z-index:5"></a>
```
```css
.gate{cursor:default;text-decoration:none;color:inherit;-webkit-tap-highlight-color:transparent}
.gate:focus{outline:none}
```
中央の焦点(目/実体/モニター等)に重ねる。**見た目で導線と分からせない**。

---

## 8. ページ番号・作者名の秘匿ルール

「今が何番目か」を一切出さない。

- 作者/ブランドは **`NULLSECT`**(`4SOU9` は使わない)。
- 「第N層」→ 全ページ **`深層`**。
- 番号バッジ → **`0XX`**。`vol.0N`/`VOL.IV` → **`vol.∞`/`VOL.∞`**。
- 大数字 `壱弐参肆` → **`迷`**。`layer 0N / ∞` → **`XX / ∞`**。
- `subj.`/`fig.`/`ZONE`/`CH`/`SECT`/`LEVEL` などの番号 → **`XX`**。
- `<title>` からも層番号を除去(全タブ `深層 / 〇〇`)。
- **URLも非連番のコードネーム**(`husk/scar/veil/rot/ash/maw/echo.html`)。`index` のみ入口。
- 演出として番号性のない要素(`333`・`00:33:33`・座標・`0xFE` 等のhex)は残してよい。

---

## 9. 制作・確認ワークフロー

- 素材ソース `SVG/`(4.6GB)と `参考/` は `.gitignore` 済み。**コミットしない**。
- プレビューはローカルhttp必須:
  ```
  npx serve            # → http://localhost:3000
  ```
- スクリーンショット確認(ヘッドレスChrome):
  ```
  chrome --headless=new --disable-gpu --hide-scrollbars \
    --virtual-time-budget=12000 --screenshot=out.png \
    --window-size=1040,1340 http://localhost:8799/<page>.html
  ```
  出力は書込可能な場所へ(scratchpadはアクセス拒否されることがある)。

---

## 10. 新規ページ チェックリスト

- [ ] 既存と被らないアクセントを選び `:root{--accent}` に。背景は単色、**計2〜4色以内**。
- [ ] `assets/poster.css` を読み込み、`#ink` フィルタを `<svg>` に定義。
- [ ] `.poster{width:960px;margin:0 auto;filter:url(#ink);background:transparent}`。
- [ ] SVGは `mask-image` ロングハンド＋`mask-mode:alpha`(ショートハンド/CSS変数url禁止)。
- [ ] 参考とは別の構図アーキタイプ＋専用フォント群＋ヘッダ/フッタの個性。
- [ ] 多言語の断片を散らす。見出しは巨大1〜2語のみ。
- [ ] 中央焦点に `.gate`(次スラッグへ)。前のページのゲートを新ページに繋ぐ。
- [ ] ページ番号・順序が出る表示は全て秘匿(§8)。ブランドは `NULLSECT`。
- [ ] ファイル名は非連番のコードネーム。
- [ ] http経由でレンダリング確認(マスク・二階調化・はみ出し・小文字の可読性)。
