/*:
 * @target MZ
 * @plugindesc シューティングミニゲーム
 * @author kotonoha*
 * @url https://aokikotori.com/
 * @version 1.0.0
 *
 * @help ShooterGame.js - シューティングミニゲーム v1.0.0
 *
 * ■ 概要
 * 様々なタイプの敵が上から迫ってくるシューティングゲームです。
 * ショットで撃ち落としてボスを倒せばウェーブクリア。
 * ウェーブが進むごとに敵が速くなり、ボスも強化されます。
 *
 * ■ 使い方
 * プラグインコマンド「ゲーム開始」を実行してください。
 * コマンド完了後、結果格納変数に到達ウェーブ数が格納されます。
 *   0 = プレイせず中断
 *   1以上 = 到達したウェーブ番号
 *
 * プラグインコマンドは完了まで自動的にウェイトするため、
 * イベント側でのループウェイトは不要です。
 *
 * ■ 操作方法
 * - 左右キー: 自機移動
 * - 決定キー/左クリック長押し: ショット発射
 * - キャンセルキー: ゲーム中断して戻る
 *
 * ■ 敵タイプ
 * - 直進型: まっすぐ降りてくる
 * - ふらふら型: 左右に揺れながら降りてくる
 * - ランダム型: 不規則に動く
 * - 高速型: 素早く降りてくる
 *
 * ■ キャラチップ指定
 * キャラクターファイル名とインデックス（0〜7）で指定します。
 * $付きファイル（!$含む）はインデックス0固定の大型キャラ用です。
 * 自機は上向き固定、敵・ボスは下向き固定で表示されます。
 *
 * ■ ライセンス
 * このプラグインはMITライセンスです。
 * 商用・非商用問わず自由に使用できます。
 *
 * @param playerCharFile
 * @text 自機キャラファイル
 * @desc 自機に使うキャラクター画像
 * @type file
 * @dir img/characters
 * @default Actor1
 *
 * @param playerCharIndex
 * @text 自機キャラインデックス
 * @desc キャラファイル内の番号（0〜7、$付きは0固定）
 * @type number
 * @min 0
 * @max 7
 * @default 0
 *
 * @param enemyCharFile
 * @text 敵キャラファイル
 * @desc 雑魚敵に使うキャラクター画像
 * @type file
 * @dir img/characters
 * @default Monster
 *
 * @param enemyCharIndices
 * @text 敵キャラインデックス一覧
 * @desc 使用するインデックス（カンマ区切り）
 * @type text
 * @default 0,1,2,3
 *
 * @param bossCharFile
 * @text ボスキャラファイル
 * @desc ボスに使うキャラクター画像（$付き大型推奨）
 * @type file
 * @dir img/characters
 * @default Monster
 *
 * @param bossCharIndex
 * @text ボスキャラインデックス
 * @desc ボスのインデックス（$付きは0固定）
 * @type number
 * @min 0
 * @max 7
 * @default 7
 *
 * @param healCharFile
 * @text 回復アイテムキャラファイル
 * @desc 回復アイテムに使うキャラクター画像
 * @type file
 * @dir img/characters
 * @default !Other1
 *
 * @param healCharIndex
 * @text 回復アイテムキャラインデックス
 * @desc キャラファイル内の番号（0〜7、$付きは0固定）
 * @type number
 * @min 0
 * @max 7
 * @default 3
 *
 * @param healScore
 * @text 回復出現スコア間隔
 * @desc この点数ごとに回復アイテムが出現（0で無効）
 * @type number
 * @min 0
 * @default 500
 *
 * @param healSe
 * @text 回復SE
 * @desc 回復アイテム取得時のSE
 * @type file
 * @dir audio/se
 * @default Recovery
 *
 * @param healSeVolume
 * @text 回復SE音量
 * @type number
 * @min 0
 * @max 100
 * @default 80
 *
 * @param bgm
 * @text BGM
 * @desc ゲーム中に再生するBGM
 * @type file
 * @dir audio/bgm
 * @default Battle1
 *
 * @param bgmVolume
 * @text BGM音量
 * @type number
 * @min 0
 * @max 100
 * @default 80
 *
 * @param shotSe
 * @text ショットSE
 * @desc 弾を撃つ時のSE
 * @type file
 * @dir audio/se
 * @default Bow1
 *
 * @param shotSeVolume
 * @text ショットSE音量
 * @type number
 * @min 0
 * @max 100
 * @default 60
 *
 * @param destroySe
 * @text 撃破SE
 * @desc 敵を倒した時のSE
 * @type file
 * @dir audio/se
 * @default Damage5
 *
 * @param destroySeVolume
 * @text 撃破SE音量
 * @type number
 * @min 0
 * @max 100
 * @default 80
 *
 * @param fireballSe
 * @text 炎弾SE
 * @desc ボスの炎弾発射時のSE
 * @type file
 * @dir audio/se
 * @default Fire1
 *
 * @param fireballSeVolume
 * @text 炎弾SE音量
 * @type number
 * @min 0
 * @max 100
 * @default 50
 *
 * @param bossBgm
 * @text ボスBGM
 * @desc ボス戦で切り替わるBGM（空欄で通常BGM続行）
 * @type file
 * @dir audio/bgm
 * @default
 *
 * @param bossBgmVolume
 * @text ボスBGM音量
 * @type number
 * @min 0
 * @max 100
 * @default 90
 *
 * @param victoryMe
 * @text 撃破ME
 * @desc ボス撃破時に再生するME
 * @type file
 * @dir audio/me
 * @default Victory1
 *
 * @param victoryMeVolume
 * @text 撃破ME音量
 * @type number
 * @min 0
 * @max 100
 * @default 90
 *
 * @param defeatMe
 * @text 敗北ME
 * @desc ゲームオーバー時に再生するME
 * @type file
 * @dir audio/me
 * @default Defeat1
 *
 * @param defeatMeVolume
 * @text 敗北ME音量
 * @type number
 * @min 0
 * @max 100
 * @default 90
 *
 * @param damageSe
 * @text 被弾SE
 * @desc 被弾時に再生するSE
 * @type file
 * @dir audio/se
 * @default Damage1
 *
 * @param damageSeVolume
 * @text 被弾SE音量
 * @type number
 * @min 0
 * @max 100
 * @default 70
 *
 * @param highScoreVarId
 * @text ハイスコア変数ID
 * @desc ハイスコアを保存する変数のID（0で保存しない）
 * @type variable
 * @default 0
 *
 * @param background
 * @text 背景画像
 * @desc ゲームの背景（遠景画像）
 * @type file
 * @dir img/parallaxes
 * @default
 *
 * @param killsForBoss
 * @text ボス出現までの撃破数
 * @desc 雑魚を何体倒したらボス出現か
 * @type number
 * @min 3
 * @max 99
 * @default 10
 *
 * @param bossHp
 * @text ボスHP
 * @desc ボスの耐久力（何発で倒せるか）
 * @type number
 * @min 1
 * @max 50
 * @default 8
 *
 * @param bossFireInterval
 * @text ボス炎弾間隔
 * @desc ボスが炎弾を撃つ間隔（フレーム数）
 * @type number
 * @min 20
 * @max 300
 * @default 70
 *
 * @param playerLives
 * @text ライフ数
 * @desc プレイヤーの初期ライフ
 * @type number
 * @min 1
 * @max 9
 * @default 3
 *
 * @param rewardGold
 * @text クリア報酬ゴールド
 * @desc ボス撃破時にもらえるゴールド（0で報酬なし）
 * @type number
 * @min 0
 * @default 100
 *
 * @param titleImage
 * @text タイトル画像
 * @desc ゲーム開始前に表示する画像（空欄でタイトルなし→即スタート）
 * @type file
 * @dir img/pictures
 * @default
 *
 * @param resultVariable
 * @text 結果格納変数
 * @desc 到達ウェーブ数を格納する変数ID（0=プレイせず中断）
 * @type variable
 * @default 1
 *
 * @command startGame
 * @text ゲーム開始
 * @desc シューティングゲームを開始します。コマンド完了まで自動ウェイトします。
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "ShooterGame";
    const parameters = PluginManager.parameters(PLUGIN_NAME);

    // キャラクター設定
    const PLAYER_CHAR_FILE = String(parameters["playerCharFile"] || "Actor1");
    const PLAYER_CHAR_INDEX = Number(parameters["playerCharIndex"] || 0);
    const ENEMY_CHAR_FILE = String(parameters["enemyCharFile"] || "Monster");
    const ENEMY_CHAR_INDICES = String(parameters["enemyCharIndices"] || "0,1,2,3")
        .split(",").map(s => Number(s.trim()));
    const BOSS_CHAR_FILE = String(parameters["bossCharFile"] || "Monster");
    const BOSS_CHAR_INDEX = Number(parameters["bossCharIndex"] || 7);
    const HEAL_CHAR_FILE = String(parameters["healCharFile"] || "!Other1");
    const HEAL_CHAR_INDEX = Number(parameters["healCharIndex"] || 3);
    const HEAL_SCORE = Number(parameters["healScore"] || 500);
    const HEAL_SE_NAME = String(parameters["healSe"] || "Recovery");
    const HEAL_SE_VOLUME = Number(parameters["healSeVolume"] || 80);

    // サウンド設定
    const BGM_NAME = String(parameters["bgm"] || "");
    const BGM_VOLUME = Number(parameters["bgmVolume"] || 80);
    const SHOT_SE_NAME = String(parameters["shotSe"] || "Bow1");
    const SHOT_SE_VOLUME = Number(parameters["shotSeVolume"] || 60);
    const DESTROY_SE_NAME = String(parameters["destroySe"] || "Damage5");
    const DESTROY_SE_VOLUME = Number(parameters["destroySeVolume"] || 80);
    const FIREBALL_SE_NAME = String(parameters["fireballSe"] || "Fire1");
    const FIREBALL_SE_VOLUME = Number(parameters["fireballSeVolume"] || 50);
    const BOSS_BGM_NAME = String(parameters["bossBgm"] || "");
    const BOSS_BGM_VOLUME = Number(parameters["bossBgmVolume"] || 90);
    const VICTORY_ME_NAME = String(parameters["victoryMe"] || "Victory1");
    const VICTORY_ME_VOLUME = Number(parameters["victoryMeVolume"] || 90);
    const DEFEAT_ME_NAME = String(parameters["defeatMe"] || "Defeat1");
    const DEFEAT_ME_VOLUME = Number(parameters["defeatMeVolume"] || 90);
    const DAMAGE_SE_NAME = String(parameters["damageSe"] || "Damage1");
    const DAMAGE_SE_VOLUME = Number(parameters["damageSeVolume"] || 70);
    const HIGH_SCORE_VAR_ID = Number(parameters["highScoreVarId"] || 0);

    // 背景
    const BG_NAME = String(parameters["background"] || "");

    // ゲームバランス
    const KILLS_FOR_BOSS = Number(parameters["killsForBoss"] || 10);
    const BOSS_HP = Number(parameters["bossHp"] || 8);
    const BOSS_FIRE_INTERVAL = Number(parameters["bossFireInterval"] || 70);
    const PLAYER_LIVES = Number(parameters["playerLives"] || 3);
    const REWARD_GOLD = Number(parameters["rewardGold"] || 100);
    const TITLE_IMAGE = String(parameters["titleImage"] || "");
    const RESULT_VARIABLE = Number(parameters["resultVariable"] || 1);

    let _gameFinished = false;

    // ========================================
    // プラグインコマンド登録
    // ========================================
    PluginManager.registerCommand(PLUGIN_NAME, 'startGame', function() {
        _gameFinished = false;
        SceneManager.push(Scene_ShooterGame);
        this.setWaitMode('shooterGame');
    });

    // ウェイトモード拡張
    const _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === 'shooterGame') {
            if (_gameFinished) {
                this._waitMode = '';
                return false;
            }
            return true;
        }
        return _Game_Interpreter_updateWaitMode.call(this);
    };

    // ゲーム定数
    const AREA_Y = 48;
    const PLAYER_SPEED = 6;
    const BULLET_SPEED = 8;
    const SPAWN_INTERVAL = 50;
    const SHOOT_COOLDOWN = 10;
    const ANIM_INTERVAL = 12;
    const FIREBALL_SPEED = 4;

    // キャラチップ方向の行番号
    const DIR_DOWN = 0;
    const DIR_UP = 3;

    // 敵タイプ定義
    const ETYPE_STRAIGHT = 0; // 直進型
    const ETYPE_ZIGZAG   = 1; // ふらふら型
    const ETYPE_RANDOM   = 2; // ランダム型
    const ETYPE_FAST     = 3; // 高速型

    // =========================================================================
    // キャラチップスプライト ユーティリティ
    // =========================================================================

    // $付き判定（!$にも対応）
    function isBigCharacter(filename) {
        const match = filename.match(/^[\!\$]+/);
        return match && match[0].includes("$");
    }

    // キャラチップスプライト生成（animate: アニメするか）
    function createCharSprite(charFile, charIndex, dirRow, animate) {
        const big = isBigCharacter(charFile);
        const idx = big ? 0 : charIndex;
        const srcBitmap = ImageManager.loadCharacter(charFile);
        const sprite = new Sprite();
        sprite._charFile = charFile;
        sprite._charIdx = idx;
        sprite._dirRow = dirRow;
        sprite._isBig = big;
        sprite._animFrame = 1;    // 中央フレーム（静止時もこれ）
        sprite._animTimer = 0;
        sprite._animate = animate; // アニメーションするかどうか
        sprite._cw = 0;
        sprite._ch = 0;
        sprite._charReady = false;
        sprite._srcBitmap = srcBitmap; // アニメ更新用に参照を保持

        srcBitmap.addLoadListener(() => {
            const cw = srcBitmap.width / (big ? 3 : 12);
            const ch = srcBitmap.height / (big ? 4 : 8);
            sprite._cw = cw;
            sprite._ch = ch;
            sprite.bitmap = new Bitmap(cw, ch);
            sprite._charReady = true;
            redrawCharFrame(sprite, srcBitmap);
        });

        return sprite;
    }

    // キャラフレーム再描画
    function redrawCharFrame(sprite, srcBitmap) {
        if (!sprite._charReady) return;
        const big = sprite._isBig;
        const cw = sprite._cw;
        const ch = sprite._ch;
        const frame = sprite._animFrame;
        const dir = sprite._dirRow;
        const idx = sprite._charIdx;
        let sx, sy;
        if (big) {
            sx = frame * cw;
            sy = dir * ch;
        } else {
            const col = idx % 4;
            const row = Math.floor(idx / 4);
            sx = (col * 3 + frame) * cw;
            sy = (row * 4 + dir) * ch;
        }
        sprite.bitmap.clear();
        sprite.bitmap.blt(srcBitmap, sx, sy, cw, ch, 0, 0);
    }

    // 歩行アニメ更新（animateフラグ有効時のみ）
    function updateCharAnimation(sprite) {
        if (!sprite._charReady || !sprite._animate) return;
        sprite._animTimer++;
        if (sprite._animTimer >= ANIM_INTERVAL) {
            sprite._animTimer = 0;
            const pattern = [1, 2, 1, 0];
            sprite._animStep = ((sprite._animStep || 0) + 1) % pattern.length;
            sprite._animFrame = pattern[sprite._animStep];
            if (sprite._srcBitmap) {
                redrawCharFrame(sprite, sprite._srcBitmap);
            }
        }
    }

    // =========================================================================
    // サウンドヘルパー
    // =========================================================================
    function playShotSe() {
        if (SHOT_SE_NAME) {
            AudioManager.playSe({ name: SHOT_SE_NAME, volume: SHOT_SE_VOLUME, pitch: 100, pan: 0 });
        }
    }

    function playDestroySe() {
        if (DESTROY_SE_NAME) {
            AudioManager.playSe({ name: DESTROY_SE_NAME, volume: DESTROY_SE_VOLUME, pitch: 100, pan: 0 });
        }
    }

    function playVictoryMe() {
        if (VICTORY_ME_NAME) {
            AudioManager.playMe({ name: VICTORY_ME_NAME, volume: VICTORY_ME_VOLUME, pitch: 100, pan: 0 });
        }
    }

    function playDefeatMe() {
        if (DEFEAT_ME_NAME) {
            AudioManager.playMe({ name: DEFEAT_ME_NAME, volume: DEFEAT_ME_VOLUME, pitch: 100, pan: 0 });
        }
    }

    function playDamageSe() {
        if (DAMAGE_SE_NAME) {
            AudioManager.playSe({ name: DAMAGE_SE_NAME, volume: DAMAGE_SE_VOLUME, pitch: 100, pan: 0 });
        }
    }

    // =========================================================================
    // Scene_ShooterGame — シューティングミニゲーム
    // =========================================================================
    class Scene_ShooterGame extends Scene_Base {
        create() {
            super.create();
            this._createBackground();
            this._initGameState();
            this._createHudWindow();
            this._createGameLayer();
            if (TITLE_IMAGE) {
                this._createTitleScreen();
            } else {
                // タイトル画像なし → 直接レディ演出へ
                this._phase = "ready";
                this._readyTimer = 0;
            }
        }

        start() {
            super.start();
            this._savedBgm = AudioManager.saveBgm();
            if (!TITLE_IMAGE && BGM_NAME) {
                // タイトル画像なし → 即BGM開始
                AudioManager.playBgm({ name: BGM_NAME, volume: BGM_VOLUME, pitch: 100, pan: 0 });
            }
        }

        terminate() {
            super.terminate();
            _gameFinished = true;
            // 結果変数に到達ウェーブ数を格納
            if (RESULT_VARIABLE > 0) {
                $gameVariables.setValue(RESULT_VARIABLE, this._wave || 0);
            }
            // 途中終了時もハイスコア保存
            if (this._score > this._highScore && HIGH_SCORE_VAR_ID > 0) {
                $gameVariables.setValue(HIGH_SCORE_VAR_ID, this._score);
            }
            if (this._savedBgm && this._savedBgm.name) {
                AudioManager.replayBgm(this._savedBgm);
            } else {
                AudioManager.stopBgm();
            }
            // メモリリーク防止: 全スプライト・Bitmapの破棄
            this._destroyAllResources();
        }

        // 全リソース破棄
        _destroyAllResources() {
            // 残存エンティティの破棄
            this._clearAllEntities();
            // 個別スプライトのBitmap破棄と参照解放
            this._destroySprite(this._player);
            this._destroySprite(this._readySprite);
            this._destroySprite(this._waveSprite);
            this._destroySprite(this._damageFlashSprite);
            this._destroySprite(this._healFlashSprite);
            this._destroySprite(this._highScoreSprite);
            // タイトル画面（タイトル中に終了した場合）
            this._removeTitleScreen();
            // ボス撃破演出中のボススプライト
            if (this._bossDefeatBoss) {
                this._gameLayer.removeChild(this._bossDefeatBoss);
                this._destroySprite(this._bossDefeatBoss);
                this._bossDefeatBoss = null;
            }
            // 背景（ImageManager経由でないBitmapのみ破棄）
            if (this._backgroundSprite && !BG_NAME) {
                this._destroySprite(this._backgroundSprite);
            }
            // リザルトウィンドウ
            if (this._resultWindow) {
                this._resultWindow.destroy();
                this._resultWindow = null;
            }
        }

        // スプライト安全破棄ヘルパー
        _destroySprite(sprite) {
            if (!sprite) return;
            sprite._srcBitmap = null; // キャラチップ参照解放
            if (sprite.bitmap && !sprite.bitmap.isReady()) {
                // ロード完了前ならリスナー参照のみ解放
                sprite.bitmap = null;
            } else if (sprite.bitmap) {
                sprite.bitmap.destroy();
                sprite.bitmap = null;
            }
        }

        // 背景
        _createBackground() {
            this._backgroundSprite = new Sprite();
            if (BG_NAME) {
                this._backgroundSprite.bitmap = ImageManager.loadParallax(BG_NAME);
            } else {
                this._backgroundSprite.bitmap = new Bitmap(Graphics.width, Graphics.height);
                this._backgroundSprite.bitmap.fillAll("#0a0a2e");
            }
            this.addChild(this._backgroundSprite);
        }

        // ゲーム状態初期化
        _initGameState() {
            this._phase = "title";
            this._readyTimer = 0;
            this._readySprite = null;
            this._score = 0;
            this._kills = 0;
            this._lives = PLAYER_LIVES;
            this._spawnTimer = 0;
            this._shootCooldown = 0;
            this._bullets = [];
            this._enemies = [];
            this._fireballs = [];
            this._explosions = [];
            this._healItems = [];
            this._nextHealScore = HEAL_SCORE;
            this._boss = null;
            this._bossSpawned = false;
            this._bossFireTimer = 0;
            this._resultTimer = 0;
            this._playerInvincible = 0;
            // ウェーブ＆ハイスコア
            this._wave = 1;
            this._speedMultiplier = 1.0;
            this._highScore = (HIGH_SCORE_VAR_ID > 0)
                ? ($gameVariables.value(HIGH_SCORE_VAR_ID) || 0) : 0;
            // ダメージフラッシュ
            this._damageFlashSprite = null;
            this._damageFlashDuration = 0;
            // ウェーブパーフェクト
            this._wavePerfect = true;
            // ウェーブ遷移用
            this._waveTransitionTimer = 0;
            this._waveSprite = null;
        }

        // HUD
        _createHudWindow() {
            const rect = new Rectangle(0, 0, Graphics.boxWidth, AREA_Y);
            this._hudWindow = new Window_Base(rect);
            this._hudWindow.opacity = 0;
            this.addChild(this._hudWindow);
            this._refreshHud();
        }

        _refreshHud() {
            const w = this._hudWindow;
            w.contents.clear();
            w.contents.fontSize = 20;
            w.changeTextColor(ColorManager.normalColor());
            w.drawText(`SCORE: ${this._score}`, 8, -8, 300, "left");
            // LIFE ゲージ表示（■=残り □=消費済み）
            const maxLives = PLAYER_LIVES;
            const filled = "\u25a0".repeat(this._lives);
            const empty = "\u25a1".repeat(maxLives - this._lives);
            const lifeLabel = "LIFE ";
            const gaugeText = filled + empty;
            const labelWidth = w.contents.measureTextWidth(lifeLabel);
            const filledWidth = w.contents.measureTextWidth(filled);
            const gaugeWidth = w.contents.measureTextWidth(gaugeText);
            const totalWidth = labelWidth + gaugeWidth;
            const startX = w.innerWidth - 8 - totalWidth;
            w.changeTextColor(ColorManager.normalColor());
            w.drawText(lifeLabel, startX, -8, labelWidth, "left");
            w.changeTextColor(ColorManager.textColor(24));
            w.drawText(filled, startX + labelWidth, -8, gaugeWidth, "left");
            if (empty) {
                w.changeTextColor(ColorManager.textColor(7));
                w.drawText(empty, startX + labelWidth + filledWidth, -8, gaugeWidth, "left");
            }
            if (this._boss && this._phase === "boss") {
                w.changeTextColor(ColorManager.textColor(2));
                w.drawText(`BOSS HP: ${this._boss.hp}`, 0, -8, w.innerWidth, "center");
            } else {
                w.changeTextColor(ColorManager.textColor(4));
                w.drawText(`WAVE ${this._wave}`, 0, -8, w.innerWidth, "center");
            }
            w.resetFontSettings();
        }

        // ゲーム描画レイヤー
        _createGameLayer() {
            this._gameLayer = new Sprite();
            this.addChild(this._gameLayer);
            // 自機（上向き固定、アニメなし）
            this._player = createCharSprite(
                PLAYER_CHAR_FILE, PLAYER_CHAR_INDEX, DIR_UP, false
            );
            this._player.x = Graphics.boxWidth / 2 - 24;
            this._player.y = Graphics.boxHeight - 64;
            this._gameLayer.addChild(this._player);
            // 操作ナビ（左下）
            this._createNavGuide();
        }

        // タイトル画面
        _createTitleScreen() {
            // タイトル中はゲームレイヤーとHUDを隠す
            this._gameLayer.visible = false;
            this._hudWindow.visible = false;
            this._titleLayer = new Sprite();
            // タイトル画像
            this._titleImage = new Sprite();
            this._titleImage.bitmap = ImageManager.loadPicture(TITLE_IMAGE);
            this._titleImage.x = 0;
            this._titleImage.y = 0;
            this._titleLayer.addChild(this._titleImage);
            // 操作ガイド
            this._titleText = new Sprite();
            this._titleText.bitmap = new Bitmap(Graphics.boxWidth, 44);
            this._titleText.bitmap.fontSize = 20;
            this._titleText.bitmap.textColor = "#ffffff";
            this._titleText.bitmap.outlineColor = "rgba(0,0,0,0.8)";
            this._titleText.bitmap.outlineWidth = 4;
            this._titleText.bitmap.drawText(
                "決定:スタート / 弾を撃つ　左右:移動", 0, 0, Graphics.boxWidth, 44, "center"
            );
            this._titleText.y = Graphics.boxHeight - 80;
            this._titleLayer.addChild(this._titleText);
            this.addChild(this._titleLayer);
        }

        _updateTitle() {
            // 決定キー / 左クリックでゲーム開始
            if (Input.isTriggered("ok") || TouchInput.isTriggered()) {
                SoundManager.playOk();
                this._removeTitleScreen();
                this._phase = "ready";
                // BGM再生開始
                if (BGM_NAME) {
                    AudioManager.playBgm({ name: BGM_NAME, volume: BGM_VOLUME, pitch: 100, pan: 0 });
                }
                return;
            }
            // キャンセル / 右クリックで戻る
            if (Input.isTriggered("cancel") || TouchInput.isCancelled()) {
                this._wave = 0; // プレイせず中断
                SoundManager.playCancel();
                SceneManager.pop();
            }
        }

        _removeTitleScreen() {
            if (this._titleLayer) {
                this.removeChild(this._titleLayer);
                // タイトル画像はImageManager経由なのでbitmapはdestroyしない
                if (this._titleImage) {
                    this._titleImage.bitmap = null;
                }
                // 操作ガイドはnew Bitmapなので破棄OK
                this._destroySprite(this._titleText);
                this._titleImage = null;
                this._titleText = null;
                this._titleLayer = null;
                // ゲームレイヤーとHUDを表示
                if (this._gameLayer) this._gameLayer.visible = true;
                if (this._hudWindow) this._hudWindow.visible = true;
            }
        }

        // 操作ナビ表示
        _createNavGuide() {
            const navSprite = new Sprite();
            navSprite.bitmap = new Bitmap(240, 36);
            navSprite.bitmap.fontSize = 13;
            navSprite.bitmap.textColor = "rgba(255,255,255,0.5)";
            navSprite.bitmap.drawText(
                "決定:弾を撃つ　左右:移動", 0, 0, 240, 36, "left"
            );
            navSprite.x = 8;
            navSprite.y = Graphics.boxHeight - 30;
            this.addChild(navSprite);
            // ハイスコア表示（右下）
            this._highScoreSprite = new Sprite();
            this._highScoreSprite.bitmap = new Bitmap(240, 36);
            this._highScoreSprite.x = Graphics.boxWidth - 248;
            this._highScoreSprite.y = Graphics.boxHeight - 30;
            this.addChild(this._highScoreSprite);
            this._refreshHighScore();
            // ダメージフラッシュ用オーバーレイ
            this._damageFlashSprite = new Sprite();
            this._damageFlashSprite.bitmap = new Bitmap(Graphics.width, Graphics.height);
            this._damageFlashSprite.bitmap.fillAll("rgba(255,0,0,1)");
            this._damageFlashSprite.opacity = 0;
            this.addChild(this._damageFlashSprite);
        }

        // ハイスコア表示更新
        _refreshHighScore() {
            if (!this._highScoreSprite) return;
            const bmp = this._highScoreSprite.bitmap;
            bmp.clear();
            const displayScore = Math.max(this._highScore, this._score);
            if (displayScore > 0) {
                bmp.fontSize = 13;
                bmp.textColor = "rgba(255,255,255,0.5)";
                bmp.drawText(`HIGH SCORE: ${displayScore}`, 0, 0, 240, 36, "right");
            }
        }

        // =====================================================================
        // メインループ
        // =====================================================================
        update() {
            super.update();
            if (this._phase === "title") {
                this._updateTitle();
                return;
            }
            if (this._phase === "ready") {
                this._updateReady();
                // readyフェーズでもキャンセル可能（右クリック含む）
                if (Input.isTriggered("cancel") || TouchInput.isCancelled()) {
                    SoundManager.playCancel();
                    SceneManager.pop();
                }
                return;
            }
            this._updateExplosions();
            this._updateFlashes();
            this._updateDamageFlash();
            if (this._phase === "bossDefeat") {
                this._updateBossDefeat();
                return;
            }
            if (this._phase === "waveTransition") {
                this._updateWaveTransition();
                return;
            }
            if (this._phase === "playing" || this._phase === "boss") {
                this._updateInput();
                this._updateBullets();
                this._updateEnemies();
                this._updateFireballs();
                this._updateSpawn();
                this._updateCollision();
                this._updateFireballCollision();
                this._updateEnemyPlayerCollision();
                this._updateHealItems();
                this._updateAnimations();
                this._updateBossFire();
                this._updatePlayerInvincible();
                if (this._shootCooldown > 0) this._shootCooldown--;
            } else if (this._phase === "gameover") {
                this._updateResult();
            }
            if ((Input.isTriggered("cancel") || TouchInput.isCancelled()) &&
                this._phase !== "gameover" &&
                this._phase !== "bossDefeat") {
                SoundManager.playCancel();
                SceneManager.pop();
            }
        }

        // Ready → GO! 演出
        _updateReady() {
            this._readyTimer++;
            // スプライトが未作成なら作成
            if (!this._readySprite) {
                this._readySprite = new Sprite();
                this._readySprite.bitmap = new Bitmap(Graphics.boxWidth, 80);
                this._readySprite.y = Graphics.boxHeight / 2 - 40;
                this.addChild(this._readySprite);
            }
            const bmp = this._readySprite.bitmap;
            if (this._readyTimer === 1) {
                // "Ready..." 表示
                bmp.clear();
                bmp.fontSize = 48;
                bmp.textColor = "#ffffff";
                bmp.outlineColor = "rgba(0,0,0,0.8)";
                bmp.outlineWidth = 6;
                bmp.drawText("Ready...", 0, 0, Graphics.boxWidth, 80, "center");
            } else if (this._readyTimer === 70) {
                // "GO!" 表示
                bmp.clear();
                bmp.fontSize = 60;
                bmp.textColor = "#ffdd44";
                bmp.outlineColor = "rgba(0,0,0,0.8)";
                bmp.outlineWidth = 6;
                bmp.drawText("GO!", 0, 0, Graphics.boxWidth, 80, "center");
                SoundManager.playOk();
            } else if (this._readyTimer === 110) {
                // 演出終了 → ゲーム開始
                this.removeChild(this._readySprite);
                this._destroySprite(this._readySprite);
                this._readySprite = null;
                this._phase = "playing";
            }
        }

        // アニメーション更新（ボスのみアニメ有効）
        _updateAnimations() {
            for (const e of this._enemies) {
                updateCharAnimation(e);
            }
        }

        // 無敵時間の点滅
        _updatePlayerInvincible() {
            if (this._playerInvincible > 0) {
                this._playerInvincible--;
                this._player.opacity = this._playerInvincible % 4 < 2 ? 100 : 255;
                if (this._playerInvincible <= 0) {
                    this._player.opacity = 255;
                }
            }
        }

        // =====================================================================
        // 入力
        // =====================================================================
        _updateInput() {
            const pw = this._player._cw || 48;
            if (Input.isPressed("left")) {
                this._player.x = Math.max(0, this._player.x - PLAYER_SPEED);
            }
            if (Input.isPressed("right")) {
                this._player.x = Math.min(
                    Graphics.boxWidth - pw, this._player.x + PLAYER_SPEED
                );
            }
            // マウス左クリック長押しでも射撃可能
            if ((Input.isPressed("ok") || TouchInput.isPressed()) && this._shootCooldown <= 0) {
                this._shoot();
                this._shootCooldown = SHOOT_COOLDOWN;
            }
        }

        // =====================================================================
        // 自機ショット
        // =====================================================================
        _shoot() {
            playShotSe();
            const pw = this._player._cw || 48;
            const bullet = new Sprite();
            bullet.bitmap = new Bitmap(6, 16);
            bullet.bitmap.fillRect(1, 0, 4, 16, "#88ddff");
            bullet.bitmap.fillRect(2, 0, 2, 16, "#ffffff");
            bullet.x = this._player.x + pw / 2 - 3;
            bullet.y = this._player.y - 16;
            this._gameLayer.addChild(bullet);
            this._bullets.push(bullet);
        }

        _updateBullets() {
            for (let i = this._bullets.length - 1; i >= 0; i--) {
                const b = this._bullets[i];
                b.y -= BULLET_SPEED;
                if (b.y < -20) {
                    this._gameLayer.removeChild(b);
                    this._destroySprite(b);
                    this._bullets.splice(i, 1);
                }
            }
        }

        // =====================================================================
        // 敵スポーン
        // =====================================================================
        _updateSpawn() {
            if (this._bossSpawned) return;
            this._spawnTimer++;
            const interval = Math.max(20, Math.floor(SPAWN_INTERVAL / this._speedMultiplier));
            if (this._spawnTimer >= interval) {
                this._spawnTimer = 0;
                this._spawnEnemy();
            }
        }

        _spawnEnemy() {
            // ランダムに敵種を選出（グラフィック＝動きタイプ）
            const typeIndex = Math.floor(Math.random() * ENEMY_CHAR_INDICES.length);
            const charIdx = ENEMY_CHAR_INDICES[typeIndex];
            // 敵は全て下向き固定、アニメあり（足踏み=はばたき）
            const enemy = createCharSprite(ENEMY_CHAR_FILE, charIdx, DIR_DOWN, true);
            const ew = 48;

            // 画面上部のランダム位置から出現
            enemy.x = Math.random() * (Graphics.boxWidth - ew);
            enemy.y = -ew;
            enemy.hp = 1;
            enemy.isBoss = false;

            // グラフィックの配列順で敵タイプを決定
            // 0番目=直進, 1番目=ふらふら, 2番目=ランダム, 3番目=高速
            const etypes = [ETYPE_STRAIGHT, ETYPE_ZIGZAG, ETYPE_RANDOM, ETYPE_FAST];
            enemy._etype = etypes[typeIndex % etypes.length];

            // タイプ別パラメータ（ウェーブ速度倍率適用）
            const sm = this._speedMultiplier;
            switch (enemy._etype) {
                case ETYPE_STRAIGHT:
                    enemy._vy = (1.8 + Math.random() * 0.5) * sm;
                    enemy._vx = 0;
                    break;
                case ETYPE_ZIGZAG:
                    enemy._vy = (1.5 + Math.random() * 0.5) * sm;
                    enemy._vx = 0;
                    enemy._zigzagPhase = Math.random() * Math.PI * 2;
                    enemy._zigzagAmp = (2.0 + Math.random() * 1.5) * sm;
                    break;
                case ETYPE_RANDOM:
                    enemy._vy = (1.2 + Math.random() * 0.5) * sm;
                    enemy._vx = 0;
                    enemy._randomTimer = 0;
                    enemy._randomInterval = Math.max(10, Math.floor((20 + Math.random() * 30) / sm));
                    break;
                case ETYPE_FAST:
                    enemy._vy = (3.5 + Math.random() * 1.0) * sm;
                    enemy._vx = 0;
                    break;
            }

            this._gameLayer.addChild(enemy);
            this._enemies.push(enemy);
        }

        // =====================================================================
        // ボス
        // =====================================================================
        _spawnBoss() {
            this._bossSpawned = true;
            this._phase = "boss";
            // ボスは下向き固定、アニメあり
            const boss = createCharSprite(
                BOSS_CHAR_FILE, BOSS_CHAR_INDEX, DIR_DOWN, true
            );
            boss.x = Graphics.boxWidth / 2 - 48;
            boss.y = -120;
            boss.hp = BOSS_HP + Math.floor((this._wave - 1) * 2);
            boss.isBoss = true;
            boss._etype = -1;
            boss._moveDir = 1;
            boss._baseY = AREA_Y + 30;
            boss._entering = true;
            this._boss = boss;
            this._bossFireTimer = Math.max(25, Math.floor(BOSS_FIRE_INTERVAL / this._speedMultiplier));
            this._gameLayer.addChild(boss);
            this._enemies.push(boss);
            // ボスBGMに切り替え
            if (BOSS_BGM_NAME) {
                AudioManager.playBgm({ name: BOSS_BGM_NAME, volume: BOSS_BGM_VOLUME, pitch: 100, pan: 0 });
            }
            SoundManager.playReflection();
            this._refreshHud();
        }

        // ボスの炎弾発射
        _updateBossFire() {
            if (!this._boss || this._boss._entering) return;
            this._bossFireTimer--;
            if (this._bossFireTimer <= 0) {
                this._bossFireTimer = Math.max(25, Math.floor(BOSS_FIRE_INTERVAL / this._speedMultiplier));
                this._shootFireball();
            }
        }

        _shootFireball() {
            const boss = this._boss;
            const bw = boss._cw || 96;
            const bh = boss._ch || 96;
            const bossCx = boss.x + bw / 2;
            const bossCy = boss.y + bh;

            const playerCx = this._player.x + (this._player._cw || 48) / 2;
            const playerCy = this._player.y + (this._player._ch || 48) / 2;

            // プレイヤーに向かうベクトル
            const dx = playerCx - bossCx;
            const dy = playerCy - bossCy;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            const fb = new Sprite();
            const size = 16;
            fb.bitmap = new Bitmap(size, size);
            // 炎弾の描画（赤→オレンジのグラデ風）
            fb.bitmap.drawCircle(size / 2, size / 2, size / 2, "#ff4400");
            fb.bitmap.drawCircle(size / 2, size / 2, size / 3, "#ffaa00");
            fb.bitmap.drawCircle(size / 2, size / 2, size / 5, "#ffee66");
            fb.x = bossCx - size / 2;
            fb.y = bossCy;
            fb._vx = (dx / dist) * FIREBALL_SPEED;
            fb._vy = (dy / dist) * FIREBALL_SPEED;
            fb._size = size;

            this._gameLayer.addChild(fb);
            this._fireballs.push(fb);

            // 炎弾SE
            if (FIREBALL_SE_NAME) {
                AudioManager.playSe({ name: FIREBALL_SE_NAME, volume: FIREBALL_SE_VOLUME, pitch: 120, pan: 0 });
            }
        }

        // =====================================================================
        // 敵の移動
        // =====================================================================
        _updateEnemies() {
            for (let i = this._enemies.length - 1; i >= 0; i--) {
                const e = this._enemies[i];
                if (!e) continue;
                const ew = e._cw || 48;
                const eh = e._ch || 48;

                if (e.isBoss) {
                    this._updateBossMovement(e, ew);
                } else {
                    this._updateEnemyByType(e, ew);
                }

                // 画面外チェック（雑魚敵の通過はライフ減少）
                if (e.y > Graphics.boxHeight + 10 ||
                    e.x > Graphics.boxWidth + ew * 2 ||
                    e.x < -ew * 2) {
                    this._gameLayer.removeChild(e);
                    this._destroySprite(e);
                    this._enemies.splice(i, 1);
                    if (e.isBoss) {
                        this._boss = null;
                    } else {
                        this._loseLife();
                        if (this._phase === "gameover") return;
                    }
                }
            }
        }

        // タイプ別の敵移動処理
        _updateEnemyByType(e, ew) {
            switch (e._etype) {
                case ETYPE_STRAIGHT:
                    // まっすぐ降りる
                    e.y += e._vy;
                    break;

                case ETYPE_ZIGZAG:
                    // ふらふら揺れながら降りる
                    e._zigzagPhase += 0.07;
                    e.x += Math.sin(e._zigzagPhase) * e._zigzagAmp;
                    e.y += e._vy;
                    // 画面端で折り返し
                    if (e.x < 0) e.x = 0;
                    if (e.x > Graphics.boxWidth - ew) e.x = Graphics.boxWidth - ew;
                    break;

                case ETYPE_RANDOM:
                    // 一定間隔で横方向をランダム変更
                    e._randomTimer++;
                    if (e._randomTimer >= e._randomInterval) {
                        e._randomTimer = 0;
                        e._vx = (Math.random() - 0.5) * 4;
                        e._randomInterval = 15 + Math.floor(Math.random() * 25);
                    }
                    e.x += e._vx;
                    e.y += e._vy;
                    if (e.x < 0) { e.x = 0; e._vx = Math.abs(e._vx); }
                    if (e.x > Graphics.boxWidth - ew) {
                        e.x = Graphics.boxWidth - ew;
                        e._vx = -Math.abs(e._vx);
                    }
                    break;

                case ETYPE_FAST:
                    // 高速で降りる
                    e.y += e._vy;
                    break;
            }
        }

        // ボスの動き
        _updateBossMovement(boss, bw) {
            if (boss._entering) {
                boss.y += 1.5;
                if (boss.y >= boss._baseY) {
                    boss.y = boss._baseY;
                    boss._entering = false;
                }
                return;
            }
            boss.x += boss._moveDir * 2.5 * this._speedMultiplier;
            if (boss.x <= 10 || boss.x + bw >= Graphics.boxWidth - 10) {
                boss._moveDir *= -1;
            }
            boss.y = boss._baseY + Math.sin(Graphics.frameCount * 0.02) * 8;
        }

        // =====================================================================
        // 炎弾の移動
        // =====================================================================
        _updateFireballs() {
            for (let i = this._fireballs.length - 1; i >= 0; i--) {
                const fb = this._fireballs[i];
                fb.x += fb._vx;
                fb.y += fb._vy;
                // 画面外で消す
                if (fb.y > Graphics.boxHeight + 20 || fb.y < -20 ||
                    fb.x < -20 || fb.x > Graphics.boxWidth + 20) {
                    this._gameLayer.removeChild(fb);
                    this._destroySprite(fb);
                    this._fireballs.splice(i, 1);
                }
            }
        }

        // 炎弾 vs 自機の当たり判定
        _updateFireballCollision() {
            if (this._playerInvincible > 0) return;
            const px = this._player.x;
            const py = this._player.y;
            const pw = this._player._cw || 48;
            const ph = this._player._ch || 48;
            // 当たり判定を少し小さめに（キャラ中心寄り）
            const margin = 10;
            const pleft = px + margin;
            const ptop = py + margin;
            const pright = px + pw - margin;
            const pbottom = py + ph - margin;

            for (let i = this._fireballs.length - 1; i >= 0; i--) {
                const fb = this._fireballs[i];
                const fs = fb._size;
                if (fb.x + fs > pleft && fb.x < pright &&
                    fb.y + fs > ptop && fb.y < pbottom) {
                    // 被弾
                    this._gameLayer.removeChild(fb);
                    this._destroySprite(fb);
                    this._fireballs.splice(i, 1);
                    this._createExplosion(fb.x + fs / 2, fb.y + fs / 2);
                    this._loseLife();
                    if (this._phase === "gameover") return;
                    this._playerInvincible = 60; // 1秒間の無敵
                    break;
                }
            }
        }

        // 敵 vs 自機の接触判定
        _updateEnemyPlayerCollision() {
            if (this._playerInvincible > 0) return;
            const px = this._player.x;
            const py = this._player.y;
            const pw = this._player._cw || 48;
            const ph = this._player._ch || 48;
            const margin = 8;
            const pleft = px + margin;
            const ptop = py + margin;
            const pright = px + pw - margin;
            const pbottom = py + ph - margin;

            for (let i = this._enemies.length - 1; i >= 0; i--) {
                const e = this._enemies[i];
                if (!e || e.isBoss) continue; // ボスは炎弾で攻撃
                const ew = e._cw || 48;
                const eh = e._ch || 48;
                if (e.x + ew > pleft && e.x < pright &&
                    e.y + eh > ptop && e.y < pbottom) {
                    // 接触 → 敵消滅＋自機ダメージ
                    this._createExplosion(
                        e.x + ew / 2, e.y + eh / 2
                    );
                    this._gameLayer.removeChild(e);
                    this._destroySprite(e);
                    this._enemies.splice(i, 1);
                    this._loseLife();
                    if (this._phase === "gameover") return;
                    this._playerInvincible = 60;
                    break;
                }
            }
        }

        // =====================================================================
        // 弾 vs 敵の当たり判定
        // =====================================================================
        _updateCollision() {
            for (let bi = this._bullets.length - 1; bi >= 0; bi--) {
                const b = this._bullets[bi];
                if (!b) continue;
                for (let ei = this._enemies.length - 1; ei >= 0; ei--) {
                    const e = this._enemies[ei];
                    if (!e) continue;
                    const ew = e._cw || 48;
                    const eh = e._ch || 48;
                    if (b.x < e.x + ew && b.x + 6 > e.x &&
                        b.y < e.y + eh && b.y + 16 > e.y) {
                        e.hp--;
                        this._gameLayer.removeChild(b);
                        this._destroySprite(b);
                        this._bullets.splice(bi, 1);
                        if (e.hp <= 0) {
                            this._destroyEnemy(e, ei);
                            if (this._phase === "waveTransition" || this._phase === "gameover") return;
                        } else {
                            this._flashEnemy(e);
                            this._refreshHud();
                        }
                        break;
                    }
                }
            }
        }

        _destroyEnemy(enemy, index) {
            const ew = enemy._cw || 48;
            const eh = enemy._ch || 48;
            this._createExplosion(enemy.x + ew / 2, enemy.y + eh / 2);
            playDestroySe();
            if (enemy.isBoss) {
                // ボス撃破 → 連続爆発演出フェーズへ
                this._score += 50;
                this._startBossDefeat(enemy);
                // enemies配列からは除去するが、スプライトはまだ残す（演出中に消す）
                this._enemies.splice(index, 1);
            } else {
                this._gameLayer.removeChild(enemy);
                this._destroySprite(enemy);
                this._enemies.splice(index, 1);
                this._score += 10;
                this._kills++;
                this._refreshHud();
                this._checkHealSpawn();
                if (this._kills >= KILLS_FOR_BOSS && !this._bossSpawned) {
                    this._spawnBoss();
                }
            }
        }

        // =====================================================================
        // 回復アイテム
        // =====================================================================
        _checkHealSpawn() {
            if (HEAL_SCORE <= 0) return;
            // ライフ満タンなら閾値を進めず保留（減った時に出る）
            if (this._lives >= PLAYER_LIVES) return;
            // スコアが複数閾値を飛び越えた場合も1個は出す
            if (this._score >= this._nextHealScore) {
                // 飛び越えた分の閾値を追いつかせる
                while (this._nextHealScore <= this._score) {
                    this._nextHealScore += HEAL_SCORE;
                }
                this._spawnHealItem();
            }
        }

        _spawnHealItem() {
            const item = createCharSprite(HEAL_CHAR_FILE, HEAL_CHAR_INDEX, DIR_DOWN, true);
            const ew = 48;
            item.x = Math.random() * (Graphics.boxWidth - ew);
            item.y = -ew;
            item._vy = 3.5;
            this._gameLayer.addChild(item);
            this._healItems.push(item);
        }

        _updateHealItems() {
            const px = this._player.x;
            const py = this._player.y;
            const pw = this._player._cw || 48;
            const ph = this._player._ch || 48;
            const margin = 6;

            for (let i = this._healItems.length - 1; i >= 0; i--) {
                const item = this._healItems[i];
                item.y += item._vy;
                updateCharAnimation(item);

                // 画面外 → 消滅（ペナルティなし）
                if (item.y > Graphics.boxHeight + 10) {
                    this._gameLayer.removeChild(item);
                    this._destroySprite(item);
                    this._healItems.splice(i, 1);
                    continue;
                }

                // 自機との当たり判定
                const iw = item._cw || 48;
                const ih = item._ch || 48;
                if (item.x + iw > px + margin && item.x < px + pw - margin &&
                    item.y + ih > py + margin && item.y < py + ph - margin) {
                    // 回復
                    this._gameLayer.removeChild(item);
                    this._destroySprite(item);
                    this._healItems.splice(i, 1);
                    if (this._lives < PLAYER_LIVES) {
                        this._lives++;
                        AudioManager.playSe({ name: HEAL_SE_NAME, volume: HEAL_SE_VOLUME, pitch: 100, pan: 0 });
                        this._triggerHealFlash();
                        this._refreshHud();
                    }
                }
            }
        }

        // 回復時の緑フラッシュ
        _triggerHealFlash() {
            if (!this._healFlashSprite) {
                this._healFlashSprite = new Sprite();
                this._healFlashSprite.bitmap = new Bitmap(Graphics.width, Graphics.height);
                this._healFlashSprite.bitmap.fillAll("rgba(0,255,128,1)");
                this._healFlashSprite.opacity = 0;
                this.addChild(this._healFlashSprite);
            }
            this._healFlashDuration = 15;
            this._healFlashSprite.opacity = 100;
        }

        // =====================================================================
        // エフェクト
        // =====================================================================
        _createExplosion(cx, cy) {
            const size = 48;
            const exp = new Sprite();
            exp.bitmap = new Bitmap(size, size);
            exp.bitmap.drawCircle(size / 2, size / 2, size / 2, "#ff8844");
            exp.x = cx - size / 2;
            exp.y = cy - size / 2;
            exp._life = 15;
            this._gameLayer.addChild(exp);
            this._explosions.push(exp);
        }

        _updateExplosions() {
            for (let i = this._explosions.length - 1; i >= 0; i--) {
                const exp = this._explosions[i];
                exp._life--;
                exp.opacity = Math.floor((exp._life / 15) * 255);
                exp.scale.x = exp._life / 15;
                exp.scale.y = exp._life / 15;
                if (exp._life <= 0) {
                    this._gameLayer.removeChild(exp);
                    this._destroySprite(exp);
                    this._explosions.splice(i, 1);
                }
            }
        }

        _flashEnemy(enemy) {
            enemy._flashCount = 8;
        }

        _updateFlashes() {
            for (const e of this._enemies) {
                if (e._flashCount && e._flashCount > 0) {
                    e._flashCount--;
                    e.opacity = e._flashCount % 2 === 0 ? 255 : 80;
                    if (e._flashCount <= 0) e.opacity = 255;
                }
            }
        }

        // =====================================================================
        // ライフ・勝敗
        // =====================================================================
        _loseLife() {
            this._lives--;
            playDamageSe();
            this._triggerDamageFlash();
            this._wavePerfect = false;
            this._refreshHud();
            if (this._lives <= 0) {
                this._onGameOver();
            }
        }

        // ダメージ赤フラッシュ
        _triggerDamageFlash() {
            this._damageFlashDuration = 20;
            if (this._damageFlashSprite) {
                this._damageFlashSprite.opacity = 120;
            }
        }

        _updateDamageFlash() {
            if (this._damageFlashDuration > 0) {
                this._damageFlashDuration--;
                if (this._damageFlashSprite) {
                    this._damageFlashSprite.opacity =
                        Math.floor(120 * (this._damageFlashDuration / 20));
                }
            }
            // 回復フラッシュ
            if (this._healFlashDuration > 0) {
                this._healFlashDuration--;
                if (this._healFlashSprite) {
                    this._healFlashSprite.opacity =
                        Math.floor(100 * (this._healFlashDuration / 15));
                }
            }
        }

        // =====================================================================
        // ボス撃破連続爆発演出
        // =====================================================================
        _startBossDefeat(boss) {
            this._phase = "bossDefeat";
            this._bossDefeatTimer = 0;
            this._bossDefeatTotal = 90; // 約1.5秒間
            this._bossDefeatBoss = boss;
            // 残存する弾・炎弾・回復を消す（敵はもういない）
            const destroyArr = (arr) => {
                for (const s of arr) {
                    this._gameLayer.removeChild(s);
                    this._destroySprite(s);
                }
            };
            destroyArr(this._bullets);
            this._bullets = [];
            destroyArr(this._fireballs);
            this._fireballs = [];
            destroyArr(this._healItems);
            this._healItems = [];
            // ボスを半透明にしていく演出開始
            boss.opacity = 200;
        }

        _updateBossDefeat() {
            this._bossDefeatTimer++;
            const boss = this._bossDefeatBoss;
            if (!boss) { this._onClear(); return; }
            const bw = boss._cw || 96;
            const bh = boss._ch || 96;
            const cx = boss.x + bw / 2;
            const cy = boss.y + bh / 2;

            // 連続小爆発（5フレームおきにランダム位置で爆発）
            if (this._bossDefeatTimer % 5 === 0) {
                const ox = (Math.random() - 0.5) * bw * 1.2;
                const oy = (Math.random() - 0.5) * bh * 1.2;
                this._createExplosion(cx + ox, cy + oy);
                playDestroySe();
            }

            // ボスを徐々にフェードアウト
            boss.opacity = Math.max(0, 200 - Math.floor(200 * (this._bossDefeatTimer / this._bossDefeatTotal)));

            // 演出終了 → 大爆発してクリアへ
            if (this._bossDefeatTimer >= this._bossDefeatTotal) {
                // 大爆発（中心＋四方に同時爆発）
                this._createExplosion(cx, cy);
                this._createExplosion(cx - bw / 3, cy - bh / 3);
                this._createExplosion(cx + bw / 3, cy - bh / 3);
                this._createExplosion(cx - bw / 3, cy + bh / 3);
                this._createExplosion(cx + bw / 3, cy + bh / 3);
                // ボススプライト破棄
                this._gameLayer.removeChild(boss);
                this._destroySprite(boss);
                this._bossDefeatBoss = null;
                this._boss = null;
                this._onClear();
            }
        }

        _onClear() {
            // ウェーブクリア → 次のウェーブへ
            this._score += 50 * this._wave;
            if (this._wavePerfect) {
                this._score += 500;
            }
            if (REWARD_GOLD > 0) {
                $gameParty.gainGold(REWARD_GOLD);
            }
            this._clearAllEntities();
            this._refreshHud();
            this._refreshHighScore();
            AudioManager.stopBgm();
            playVictoryMe();
            this._phase = "waveTransition";
            this._waveTransitionTimer = 140;
            this._showWaveClear();
        }

        // ウェーブクリア演出表示
        _showWaveClear() {
            this._waveSprite = new Sprite();
            this._waveSprite.bitmap = new Bitmap(Graphics.boxWidth, 120);
            const bmp = this._waveSprite.bitmap;
            bmp.fontSize = 42;
            bmp.textColor = "#ffdd44";
            bmp.outlineColor = "rgba(0,0,0,0.8)";
            bmp.outlineWidth = 5;
            bmp.drawText(`WAVE ${this._wave} CLEAR!`, 0, 0, Graphics.boxWidth, 50, "center");
            if (this._wavePerfect) {
                bmp.fontSize = 24;
                bmp.textColor = "#44ffaa";
                bmp.drawText("PERFECT! +500", 0, 56, Graphics.boxWidth, 30, "center");
            }
            bmp.fontSize = 20;
            bmp.textColor = "#ffffff";
            bmp.drawText(`+${50 * this._wave} CLEAR BONUS`, 0, this._wavePerfect ? 86 : 56, Graphics.boxWidth, 30, "center");
            this._waveSprite.y = Graphics.boxHeight / 2 - 60;
            this.addChild(this._waveSprite);
        }

        // ウェーブ遷移更新
        _updateWaveTransition() {
            this._waveTransitionTimer--;
            if (this._waveTransitionTimer <= 0) {
                this._startNextWave();
            }
        }

        // 次のウェーブ開始
        _startNextWave() {
            if (this._waveSprite) {
                this.removeChild(this._waveSprite);
                this._destroySprite(this._waveSprite);
                this._waveSprite = null;
            }
            this._wave++;
            this._speedMultiplier *= 1.1;
            this._kills = 0;
            this._bossSpawned = false;
            this._boss = null;
            this._spawnTimer = 0;
            this._bossFireTimer = 0;
            this._wavePerfect = true;
            this._phase = "playing";
            this._refreshHud();
            if (BGM_NAME) {
                AudioManager.playBgm({ name: BGM_NAME, volume: BGM_VOLUME, pitch: 100, pan: 0 });
            }
        }

        _onGameOver() {
            this._phase = "gameover";
            this._resultTimer = 150;
            this._clearAllEntities();
            AudioManager.stopBgm();
            playDefeatMe();
            // ハイスコア更新
            if (this._score > this._highScore) {
                this._highScore = this._score;
                if (HIGH_SCORE_VAR_ID > 0) {
                    $gameVariables.setValue(HIGH_SCORE_VAR_ID, this._highScore);
                }
            }
            this._refreshHighScore();
        }

        _clearAllEntities() {
            const destroyAndRemove = (arr) => {
                for (const s of arr) {
                    this._gameLayer.removeChild(s);
                    this._destroySprite(s);
                }
            };
            destroyAndRemove(this._enemies);
            this._enemies = [];
            destroyAndRemove(this._bullets);
            this._bullets = [];
            destroyAndRemove(this._fireballs);
            this._fireballs = [];
            destroyAndRemove(this._healItems);
            this._healItems = [];
            // 爆発エフェクトも破棄
            destroyAndRemove(this._explosions);
            this._explosions = [];
        }

        // =====================================================================
        // リザルト
        // =====================================================================
        _updateResult() {
            if (!this._resultWindow) {
                this._createResultWindow();
            }
            this._resultTimer--;
            if (this._resultTimer <= 0) {
                if (Input.isTriggered("ok") || Input.isTriggered("cancel") ||
                    TouchInput.isTriggered() || TouchInput.isCancelled()) {
                    SceneManager.pop();
                }
            }
        }

        _createResultWindow() {
            const ww = 360;
            const wh = 220;
            const wx = (Graphics.boxWidth - ww) / 2;
            const wy = (Graphics.boxHeight - wh) / 2;
            const rect = new Rectangle(wx, wy, ww, wh);
            this._resultWindow = new Window_Base(rect);
            this.addChild(this._resultWindow);
            const w = this._resultWindow;
            const iw = w.innerWidth;
            const isNewRecord = (this._score >= this._highScore && this._score > 0);
            // タイトル
            w.contents.fontSize = 28;
            w.changeTextColor(ColorManager.textColor(18));
            w.drawText("GAME OVER", 0, 0, iw, "center");
            // ウェーブ到達
            w.contents.fontSize = 18;
            w.changeTextColor(ColorManager.textColor(4));
            w.drawText(`WAVE ${this._wave} 到達`, 0, 38, iw, "center");
            // スコア
            w.contents.fontSize = 22;
            w.changeTextColor(ColorManager.normalColor());
            w.drawText(`SCORE: ${this._score}`, 0, 66, iw, "center");
            // ハイスコア / NEW RECORD
            w.contents.fontSize = 18;
            if (isNewRecord) {
                w.changeTextColor(ColorManager.textColor(14));
                w.drawText("★ NEW RECORD! ★", 0, 96, iw, "center");
            } else if (this._highScore > 0) {
                w.changeTextColor(ColorManager.textColor(7));
                w.drawText(`HIGH SCORE: ${this._highScore}`, 0, 96, iw, "center");
            }
            // 操作ガイド
            w.contents.fontSize = 16;
            w.changeTextColor(ColorManager.systemColor());
            w.drawText("キーを押して戻る", 0, 140, iw, "center");
            w.resetFontSettings();
        }
    }

    // グローバル登録
    window.Scene_ShooterGame = Scene_ShooterGame;

})();
