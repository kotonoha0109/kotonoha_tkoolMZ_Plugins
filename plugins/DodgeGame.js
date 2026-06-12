/*:
 * @target MZ
 * @plugindesc AoE回避ミニゲーム v1.0.0
 * @author kotonoha*
 * @url https://aokikotori.com/
 *
 * @param resultVariable
 * @text 結果格納変数
 * @desc ゲーム結果を格納する変数ID（0=失敗、1=成功）
 * @type variable
 * @default 1
 *
 * @param winCountVariable
 * @text 勝利数加算変数
 * @desc 成功時に+1加算する変数ID（0=使用しない）
 * @type variable
 * @default 0
 *
 * @param seDamage
 * @text 被ダメージSE
 * @desc ダメージを受けた時のSE
 * @type file
 * @dir audio/se
 * @default Damage1
 *
 * @param seActivate
 * @text AoE発動SE
 * @desc AoEが発動した時のSE
 * @type file
 * @dir audio/se
 * @default Blow7
 *
 * @param seClear
 * @text クリアSE
 * @desc ゲームクリア時のSE
 * @type file
 * @dir audio/se
 * @default Item1
 *
 * @param seFail
 * @text 失敗SE
 * @desc ゲームオーバー時のSE
 * @type file
 * @dir audio/se
 * @default Buzzer1
 *
 * @command startGame
 * @text ゲーム開始
 * @desc AoE回避ミニゲームを開始します。
 *
 * @arg gameDuration
 * @text ゲーム時間（秒）
 * @desc クリアまでの秒数
 * @type number
 * @default 30
 * @min 10
 * @max 120
 *
 * @arg maxHp
 * @text 最大HP
 * @desc プレイヤーの最大HP
 * @type number
 * @default 3
 * @min 1
 * @max 10
 *
 * @arg aoeWarningTime
 * @text AoE警告時間（ミリ秒）
 * @desc AoEが出現してから発動するまでの時間
 * @type number
 * @default 2000
 * @min 500
 * @max 5000
 *
 * @arg aoeActiveTime
 * @text AoE発動時間（ミリ秒）
 * @desc AoEが発動している時間
 * @type number
 * @default 300
 * @min 100
 * @max 1000
 *
 * @arg spawnInterval
 * @text AoE出現間隔（ミリ秒）
 * @desc AoEが出現する間隔
 * @type number
 * @default 2000
 * @min 500
 * @max 5000
 *
 * @arg hardMode
 * @text 上級モード
 * @desc ONにすると最初から全てのAoEパターンが出現します
 * @type boolean
 * @default false
 *
 * @help DodgeGame.js
 *
 * ■ 概要
 * マップ上でAoE（範囲攻撃）を回避するミニゲームです。
 * プレイヤーキャラクターを操作して、制限時間まで生き残ればクリアです。
 *
 * ■ 使い方
 * 1. 回避ゲーム用のマップを用意します（障害物のない広いマップ推奨）
 * 2. イベントからプラグインコマンド「ゲーム開始」を実行します
 * 3. 難易度ごとに引数を変えれば、複数の難易度を簡単に作成できます
 *
 * ■ 難易度設定の例
 * 初級: ゲーム時間30秒 / HP5 / 警告2000ms / 出現間隔2500ms
 * 上級: ゲーム時間45秒 / HP3 / 警告1500ms / 出現間隔1500ms / 上級ON
 * 超級: ゲーム時間60秒 / HP1 / 警告1000ms / 出現間隔1000ms / 上級ON
 *
 * ■ 操作方法
 * - 矢印キー / WASD: 移動
 * - マウス操作非対応（キーボード・ゲームパッド専用）
 *
 * ■ AoEパターン
 * 時間経過に応じて新しいパターンが追加されます。
 * 上級モードでは最初から全パターンが出現します。
 * - 円形 / ドーナツ型 / 四角形（序盤から）
 * - 直線型（8秒経過後）
 * - 十字型 / 追尾型（15秒経過後）
 * - 画面半分 / ばら撒き（20秒経過後）
 * - 格子状（30秒経過後）
 *
 * ■ 注意事項
 * ・当たり判定は先頭のキャラクターのみです。
 *   隊列歩行になっている場合はプラグインコマンド前にオフにしてください。
 *
 * ■ 結果変数
 * ゲーム終了時に結果格納変数へ値を設定します。
 *   0 = 失敗（HP0）
 *   1 = 成功（時間経過クリア）
 *
 * ■ ライセンス
 * このプラグインはMITライセンスです。
 */

(() => {
	'use strict';

	// プラグインパラメータの取得
	const pluginName = 'DodgeGame';
	const parameters = PluginManager.parameters(pluginName);
	const resultVariable = Number(parameters['resultVariable'] || 1);
	const winCountVariable = Number(parameters['winCountVariable'] || 0);
	const seDamage = String(parameters['seDamage'] || 'Damage1');
	const seActivate = String(parameters['seActivate'] || 'Blow7');
	const seClear = String(parameters['seClear'] || 'Item1');
	const seFail = String(parameters['seFail'] || 'Buzzer1');

	// プラグインコマンドから渡されるゲーム設定（一時保存用）
	let _gameConfig = {
		gameDuration: 30,
		maxHp: 3,
		aoeWarningTime: 2000,
		aoeActiveTime: 300,
		spawnInterval: 2000,
		hardMode: false,
	};

	// ゲーム終了フラグ（イベントコマンドの待機制御用）
	let _gameFinished = false;

	// プラグインコマンド登録
	PluginManager.registerCommand(pluginName, 'startGame', function(args) {
		_gameConfig = {
			gameDuration: Number(args.gameDuration || 30),
			maxHp: Number(args.maxHp || 3),
			aoeWarningTime: Number(args.aoeWarningTime || 2000),
			aoeActiveTime: Number(args.aoeActiveTime || 300),
			spawnInterval: Number(args.spawnInterval || 2000),
			hardMode: args.hardMode === 'true',
		};
		_gameFinished = false;
		SceneManager.push(Scene_DodgeGame);
		this.setWaitMode('dodgeGame');
	});

	// イベントインタプリタの待機制御（ゲーム終了まで次のコマンドを実行しない）
	const _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
	Game_Interpreter.prototype.updateWaitMode = function() {
		if (this._waitMode === 'dodgeGame') {
			if (_gameFinished) {
				this._waitMode = '';
				return false;
			}
			return true;
		}
		return _Game_Interpreter_updateWaitMode.call(this);
	};

	// ========================================
	// AoEスプライト基底クラス
	// ========================================
	class Sprite_AoE extends Sprite {
		initialize() {
			super.initialize();
			this._graphics = new PIXI.Graphics();
			this.addChild(this._graphics);
			this.aoeType = '';
		}

		setup(type, x, y, params) {
			this.aoeType = type;
			this.aoeX = x;
			this.aoeY = y;

			// タイプに応じたパラメータ設定
			if (type === 'circle') {
				this.aoeRadius = params.radius;
			} else if (type === 'donut') {
				this.aoeOuterRadius = params.outerRadius;
				this.aoeInnerRadius = params.innerRadius;
			} else if (type === 'rect') {
				this.aoeWidth = params.width;
				this.aoeHeight = params.height;
			} else if (type === 'line') {
				this.aoeWidth = params.width;
				this.aoeLength = params.length;
				this.aoeAngle = params.angle;
			} else if (type === 'cross') {
				this.aoeWidth = params.width;
				this.aoeLength = params.length;
			} else if (type === 'half-left' || type === 'half-right' || type === 'half-top' || type === 'half-bottom') {
				this.aoeMapWidth = params.mapWidth;
				this.aoeMapHeight = params.mapHeight;
			} else if (type === 'grid') {
				this.aoeMapWidth = params.mapWidth;
				this.aoeMapHeight = params.mapHeight;
				this.aoeCellSize = params.cellSize;
				this.aoePattern = params.pattern;
			}

			this._lifeTime = 0;
			this.resolved = false;
			this.endingSePlayed = false;

			this.updateGraphics();
		}

		update() {
			super.update();
			this._lifeTime++;
			this.updateGraphics();
		}

		getAge() {
			return this._lifeTime * (1000 / 60);
		}

		isWarning() {
			return this.getAge() < _gameConfig.aoeWarningTime;
		}

		isActive() {
			const age = this.getAge();
			return age >= _gameConfig.aoeWarningTime && age < (_gameConfig.aoeWarningTime + _gameConfig.aoeActiveTime);
		}

		isFinished() {
			return this.getAge() >= (_gameConfig.aoeWarningTime + _gameConfig.aoeActiveTime);
		}

		updateGraphics() {
			this._graphics.clear();
			const age = this.getAge();

			const screenX = this.aoeX - $gameMap.displayX() * $gameMap.tileWidth();
			const screenY = this.aoeY - $gameMap.displayY() * $gameMap.tileHeight();

			if (this.isWarning()) {
				this.drawWarning(screenX, screenY, age);
			} else if (this.isActive()) {
				this.drawActive(screenX, screenY);
			}
		}

		drawWarning(screenX, screenY, age) {
			const progress = age / _gameConfig.aoeWarningTime;
			const g = this._graphics;

			const baseColor = 0xFFA000;
			const strokeColor = 0xFF8C00;

			if (this.aoeType === 'circle') {
				g.beginFill(baseColor, 0.3);
				g.lineStyle(2, strokeColor, 0.8);
				g.drawCircle(screenX, screenY, this.aoeRadius);
				g.endFill();

				g.beginFill(0xFFC832, 0.2);
				g.lineStyle(0);
				g.drawCircle(screenX, screenY, this.aoeRadius * progress);
				g.endFill();

			} else if (this.aoeType === 'donut') {
				g.beginFill(baseColor, 0.3);
				g.lineStyle(2, strokeColor, 0.8);
				g.drawCircle(screenX, screenY, this.aoeOuterRadius);
				g.beginHole();
				g.drawCircle(screenX, screenY, this.aoeInnerRadius);
				g.endHole();
				g.endFill();

				const currentOuterRadius = this.aoeInnerRadius + (this.aoeOuterRadius - this.aoeInnerRadius) * progress;
				g.beginFill(0xFFC832, 0.3);
				g.lineStyle(0);
				g.drawCircle(screenX, screenY, currentOuterRadius);
				g.beginHole();
				g.drawCircle(screenX, screenY, this.aoeInnerRadius);
				g.endHole();
				g.endFill();

			} else if (this.aoeType === 'rect') {
				const x = screenX - this.aoeWidth / 2;
				const y = screenY - this.aoeHeight / 2;
				g.beginFill(baseColor, 0.3);
				g.lineStyle(2, strokeColor, 0.8);
				g.drawRect(x, y, this.aoeWidth, this.aoeHeight);
				g.endFill();

				const w = this.aoeWidth * progress;
				const h = this.aoeHeight * progress;
				g.beginFill(0xFFC832, 0.2);
				g.lineStyle(0);
				g.drawRect(screenX - w / 2, screenY - h / 2, w, h);
				g.endFill();

			} else if (this.aoeType === 'line') {
				g.position.set(screenX, screenY);
				g.rotation = this.aoeAngle;

				g.beginFill(baseColor, 0.3);
				g.lineStyle(2, strokeColor, 0.8);
				g.drawRect(-this.aoeWidth / 2, -this.aoeLength / 2, this.aoeWidth, this.aoeLength);
				g.endFill();

				const l = this.aoeLength * progress;
				g.beginFill(0xFFC832, 0.2);
				g.lineStyle(0);
				g.drawRect(-this.aoeWidth / 2, -l / 2, this.aoeWidth, l);
				g.endFill();

			} else if (this.aoeType === 'cross') {
				const halfW = this.aoeWidth / 2;
				const halfL = this.aoeLength / 2;

				g.beginFill(baseColor, 0.3);
				g.lineStyle(2, strokeColor, 0.8);
				g.drawRect(screenX - halfW, screenY - halfL, this.aoeWidth, this.aoeLength);
				g.drawRect(screenX - halfL, screenY - halfW, this.aoeLength, this.aoeWidth);
				g.endFill();

				const l = this.aoeLength * progress;
				g.beginFill(0xFFC832, 0.2);
				g.lineStyle(0);
				g.drawRect(screenX - halfW, screenY - l / 2, this.aoeWidth, l);
				g.drawRect(screenX - l / 2, screenY - halfW, l, this.aoeWidth);
				g.endFill();

			} else if (this.aoeType.startsWith('half-')) {
				const pulseAlpha = 0.3 + Math.sin(progress * Math.PI * 4) * 0.2;
				g.beginFill(baseColor, pulseAlpha);
				g.lineStyle(3, strokeColor, 0.8);

				if (this.aoeType === 'half-left') {
					g.drawRect(0, 0, this.aoeMapWidth / 2, this.aoeMapHeight);
				} else if (this.aoeType === 'half-right') {
					g.drawRect(this.aoeMapWidth / 2, 0, this.aoeMapWidth / 2, this.aoeMapHeight);
				} else if (this.aoeType === 'half-top') {
					g.drawRect(0, 0, this.aoeMapWidth, this.aoeMapHeight / 2);
				} else if (this.aoeType === 'half-bottom') {
					g.drawRect(0, this.aoeMapHeight / 2, this.aoeMapWidth, this.aoeMapHeight / 2);
				}
				g.endFill();

			} else if (this.aoeType === 'grid') {
				g.beginFill(baseColor, 0.3);
				g.lineStyle(2, strokeColor, 0.8);

				const cols = Math.ceil(this.aoeMapWidth / this.aoeCellSize);
				const rows = Math.ceil(this.aoeMapHeight / this.aoeCellSize);
				for (let row = 0; row < rows; row++) {
					for (let col = 0; col < cols; col++) {
						if ((row + col + this.aoePattern) % 2 === 0) {
							const x = col * this.aoeCellSize;
							const y = row * this.aoeCellSize;
							const w = Math.min(this.aoeCellSize, this.aoeMapWidth - x);
							const h = Math.min(this.aoeCellSize, this.aoeMapHeight - y);
							g.drawRect(x, y, w, h);
						}
					}
				}
				g.endFill();

				g.beginFill(0xFFC832, 0.2);
				g.lineStyle(0);
				for (let row = 0; row < rows; row++) {
					for (let col = 0; col < cols; col++) {
						if ((row + col + this.aoePattern) % 2 === 0) {
							const x = col * this.aoeCellSize;
							const y = row * this.aoeCellSize;
							const w = Math.min(this.aoeCellSize, this.aoeMapWidth - x);
							const h = Math.min(this.aoeCellSize, this.aoeMapHeight - y);
							g.drawRect(x, y, w * progress, h * progress);
						}
					}
				}
				g.endFill();
			}

			if (this.aoeType !== 'line') {
				g.position.set(0, 0);
				g.rotation = 0;
			}
		}

		drawActive(screenX, screenY) {
			const g = this._graphics;
			const age = this.getAge();
			const activeProgress = (age - _gameConfig.aoeWarningTime) / _gameConfig.aoeActiveTime;
			const isEnding = activeProgress > 0.7;

			if (isEnding && !this.endingSePlayed) {
				AudioManager.playSe({ name: seActivate, volume: 90, pitch: 100, pan: 0 });
				this.endingSePlayed = true;
			}

			const baseColor = isEnding ? 0xFF6464 : 0xFFFFC8;
			const strokeColor = isEnding ? 0xFF0000 : 0xFFC800;
			const alpha = 0.9;

			g.beginFill(baseColor, alpha);
			g.lineStyle(3, strokeColor, 1);

			if (this.aoeType === 'circle') {
				g.drawCircle(screenX, screenY, this.aoeRadius);

			} else if (this.aoeType === 'donut') {
				g.drawCircle(screenX, screenY, this.aoeOuterRadius);
				g.beginHole();
				g.drawCircle(screenX, screenY, this.aoeInnerRadius);
				g.endHole();

			} else if (this.aoeType === 'rect') {
				g.drawRect(screenX - this.aoeWidth / 2, screenY - this.aoeHeight / 2, this.aoeWidth, this.aoeHeight);

			} else if (this.aoeType === 'line') {
				g.position.set(screenX, screenY);
				g.rotation = this.aoeAngle;
				g.drawRect(-this.aoeWidth / 2, -this.aoeLength / 2, this.aoeWidth, this.aoeLength);

			} else if (this.aoeType === 'cross') {
				const halfW = this.aoeWidth / 2;
				const halfL = this.aoeLength / 2;
				g.drawRect(screenX - halfW, screenY - halfL, this.aoeWidth, this.aoeLength);
				g.drawRect(screenX - halfL, screenY - halfW, this.aoeLength, this.aoeWidth);

			} else if (this.aoeType.startsWith('half-')) {
				if (this.aoeType === 'half-left') {
					g.drawRect(0, 0, this.aoeMapWidth / 2, this.aoeMapHeight);
				} else if (this.aoeType === 'half-right') {
					g.drawRect(this.aoeMapWidth / 2, 0, this.aoeMapWidth / 2, this.aoeMapHeight);
				} else if (this.aoeType === 'half-top') {
					g.drawRect(0, 0, this.aoeMapWidth, this.aoeMapHeight / 2);
				} else if (this.aoeType === 'half-bottom') {
					g.drawRect(0, this.aoeMapHeight / 2, this.aoeMapWidth, this.aoeMapHeight / 2);
				}

			} else if (this.aoeType === 'grid') {
				const cols = Math.ceil(this.aoeMapWidth / this.aoeCellSize);
				const rows = Math.ceil(this.aoeMapHeight / this.aoeCellSize);
				for (let row = 0; row < rows; row++) {
					for (let col = 0; col < cols; col++) {
						if ((row + col + this.aoePattern) % 2 === 0) {
							const x = col * this.aoeCellSize;
							const y = row * this.aoeCellSize;
							const w = Math.min(this.aoeCellSize, this.aoeMapWidth - x);
							const h = Math.min(this.aoeCellSize, this.aoeMapHeight - y);
							g.drawRect(x, y, w, h);
						}
					}
				}
			}

			g.endFill();

			if (this.aoeType !== 'line') {
				g.position.set(0, 0);
				g.rotation = 0;
			}
		}

		checkCollision(playerX, playerY) {
			const playerRadius = 16;

			if (this.aoeType === 'circle') {
				const dist = Math.hypot(playerX - this.aoeX, playerY - this.aoeY);
				return dist < (this.aoeRadius + playerRadius);

			} else if (this.aoeType === 'donut') {
				const dist = Math.hypot(playerX - this.aoeX, playerY - this.aoeY);
				return dist >= (this.aoeInnerRadius - playerRadius) && dist <= (this.aoeOuterRadius + playerRadius);

			} else if (this.aoeType === 'rect') {
				const halfW = this.aoeWidth / 2 + playerRadius;
				const halfH = this.aoeHeight / 2 + playerRadius;
				const dx = Math.abs(playerX - this.aoeX);
				const dy = Math.abs(playerY - this.aoeY);
				return dx < halfW && dy < halfH;

			} else if (this.aoeType === 'line') {
				const cos = Math.cos(-this.aoeAngle);
				const sin = Math.sin(-this.aoeAngle);
				const dx = playerX - this.aoeX;
				const dy = playerY - this.aoeY;
				const rotatedX = dx * cos - dy * sin;
				const rotatedY = dx * sin + dy * cos;
				return Math.abs(rotatedX) < (this.aoeWidth / 2 + playerRadius) &&
				       Math.abs(rotatedY) < (this.aoeLength / 2 + playerRadius);

			} else if (this.aoeType === 'cross') {
				const dx = Math.abs(playerX - this.aoeX);
				const dy = Math.abs(playerY - this.aoeY);
				const hitVertical = dx < (this.aoeWidth / 2 + playerRadius) && dy < (this.aoeLength / 2 + playerRadius);
				const hitHorizontal = dy < (this.aoeWidth / 2 + playerRadius) && dx < (this.aoeLength / 2 + playerRadius);
				return hitVertical || hitHorizontal;

			} else if (this.aoeType === 'half-left') {
				return playerX < (this.aoeMapWidth / 2);

			} else if (this.aoeType === 'half-right') {
				return playerX >= (this.aoeMapWidth / 2);

			} else if (this.aoeType === 'half-top') {
				return playerY < (this.aoeMapHeight / 2);

			} else if (this.aoeType === 'half-bottom') {
				return playerY >= (this.aoeMapHeight / 2);

			} else if (this.aoeType === 'grid') {
				const col = Math.floor(playerX / this.aoeCellSize);
				const row = Math.floor(playerY / this.aoeCellSize);
				return (row + col + this.aoePattern) % 2 === 0;
			}

			return false;
		}
	}

	// ========================================
	// 回避ゲームシーン
	// ========================================
	class Scene_DodgeGame extends Scene_Base {
		initialize() {
			super.initialize();
			this._gamePhase = 'playing';
			this._hp = _gameConfig.maxHp;
			this._aoeSprites = [];
			this._aoePool = [];
			this._lastSpawnFrame = 0;
			this._isInvincible = false;
			this._invincibleEndFrame = 0;
			this._resultType = '';
			this._readyGoFrames = 90;
			this._isTerminating = false;
			this._terminateTimer = 0;

			// 追加ギミック用変数
			this._chaseCount = 0;
			this._chaseTimer = 0;
		}

		create() {
			super.create();

			// プレイヤーをマップの中央に配置
			const centerX = Math.floor($gameMap.width() / 2);
			const centerY = Math.floor($gameMap.height() / 2);
			$gamePlayer.locate(centerX, centerY);
			$gamePlayer.center(centerX, centerY);

			this.createBackground();
			this.createWindowLayer();
			this.createUILayer();
			this.createResultWindow();
			this._elapsedFrames = 0;
		}

		createBackground() {
			this._spriteset = new Spriteset_Map();
			this.addChild(this._spriteset);

			this._aoeContainer = new Sprite();
			this._spriteset._tilemap.addChild(this._aoeContainer);
			this._aoeContainer.z = 0.5;
		}

		createWindowLayer() {
			this._windowLayer = new WindowLayer();
			this._windowLayer.x = (Graphics.width - Graphics.boxWidth) / 2;
			this._windowLayer.y = (Graphics.height - Graphics.boxHeight) / 2;
			this.addChild(this._windowLayer);
		}

		start() {
			super.start();

			$gameMessage.clear();
			$gameMap.refresh();

			// 元の設定を保存
			this._savedMoveSpeed = $gamePlayer.realMoveSpeed();

			$gamePlayer.setThrough(false);
			$gamePlayer.setMoveSpeed(5);
			$gamePlayer.setTransparent(false);

			if ($gamePlayer._moveRouteForcing) {
				$gamePlayer._moveRouteForcing = false;
			}
		}

		isActive() {
			return true;
		}

		stop() {
			// Scene_Baseのstopがプレイヤーの移動を止めるのを防ぐ
		}

		createUILayer() {
			// HP表示
			this._hpWindow = new Window_Base(new Rectangle(10, 10, 200, 80));
			this._hpWindow.opacity = 0;
			this._hpWindow.frameVisible = false;
			this.addWindow(this._hpWindow);
			this.updateHpDisplay();

			// タイマー表示
			this._timerWindow = new Window_Base(new Rectangle(170, 10, 200, 80));
			this._timerWindow.opacity = 0;
			this._timerWindow.frameVisible = false;
			this.addWindow(this._timerWindow);
		}

		createResultWindow() {
			const width = 400;
			const height = 200;
			const x = (Graphics.boxWidth - width) / 2;
			const y = (Graphics.boxHeight - height) / 2;

			this._resultWindow = new Window_Base(new Rectangle(x, y, width, height));
			this._resultWindow.setBackgroundType(0);
			this._resultWindow.hide();
			this.addWindow(this._resultWindow);
		}

		update() {
			super.update();

			$gameScreen.update();

			if (this._spriteset) {
				this._spriteset.update();
			}

			if (this._gamePhase === 'playing') {
				this.updateGame();
			} else if (this._gamePhase === 'result') {
				this.updateResult();
			}
		}

		updateGame() {
			// Ready/Go演出中
			if (this._readyGoFrames > 0) {
				this._readyGoFrames--;

				$gamePlayer.update();
				$gameMap.update(true);

				if (!this._readyGoWindow) {
					const width = 600;
					const height = 150;
					const x = (Graphics.boxWidth - width) / 2;
					const y = (Graphics.boxHeight - height) / 2;
					this._readyGoWindow = new Window_Base(new Rectangle(x, y, width, height));
					this._readyGoWindow.opacity = 0;
					this._readyGoWindow.frameVisible = false;
					this.addWindow(this._readyGoWindow);
				}

				this._readyGoWindow.contents.clear();
				this._readyGoWindow.contents.fontSize = 72;
				const text = this._readyGoFrames > 30 ? 'Ready' : 'Go!!';
				const textWidth = this._readyGoWindow.textWidth(text);
				const x = (this._readyGoWindow.width - textWidth) / 2;
				this._readyGoWindow.drawText(text, x, 20, textWidth, 'center');

				return;
			} else if (this._readyGoWindow) {
				this._readyGoWindow.hide();
				this._readyGoWindow = null;
			}

			this._elapsedFrames++;
			const elapsed = this._elapsedFrames / 60;

			const originalCanMove = $gamePlayer.canMove;
			$gamePlayer.canMove = function() { return true; };

			$gamePlayer.moveByInput();
			$gamePlayer.updateDashing();

			$gamePlayer.canMove = originalCanMove;

			$gamePlayer.update();
			$gameMap.update(true);

			this.updateTimerDisplay(elapsed);

			// クリア判定
			if (elapsed >= _gameConfig.gameDuration) {
				this.gameClear();
				return;
			}

			// AoE生成（時間経過で出現頻度上昇）
			const difficultyMultiplier = _gameConfig.hardMode
				? 0.5
				: Math.max(0.5, 1 - (elapsed / _gameConfig.gameDuration) * 0.5);

			const baseIntervalFrames = (_gameConfig.spawnInterval / 1000) * 60;
			const currentIntervalFrames = baseIntervalFrames * difficultyMultiplier;

			if (this._elapsedFrames - this._lastSpawnFrame > currentIntervalFrames) {
				this.spawnAoE();
				this._lastSpawnFrame = this._elapsedFrames;
			}

			// 追尾ギミックの更新
			if (this._chaseCount > 0) {
				this._chaseTimer--;
				if (this._chaseTimer <= 0) {
					this._chaseCount--;
					this._chaseTimer = 20;
					const tileWidth = $gameMap.tileWidth();
					const tileHeight = $gameMap.tileHeight();
					const px = $gamePlayer._realX * tileWidth + tileWidth / 2;
					const py = $gamePlayer._realY * tileHeight + tileHeight / 2;
					this.spawnSingleAoE('circle', px, py, { radius: 70 });
				}
			}

			// 無敵時間更新
			if (this._isInvincible && this._elapsedFrames > this._invincibleEndFrame) {
				this._isInvincible = false;
			}

			// プレイヤー座標取得（ピクセル単位）
			const tileWidth = $gameMap.tileWidth();
			const tileHeight = $gameMap.tileHeight();
			const playerX = $gamePlayer._realX * tileWidth + tileWidth / 2;
			const playerY = $gamePlayer._realY * tileHeight + tileHeight / 2;

			// AoE更新と当たり判定
			for (let i = this._aoeSprites.length - 1; i >= 0; i--) {
				if (this._gamePhase !== 'playing') break;

				const aoe = this._aoeSprites[i];

				if (aoe.isActive() && !aoe.resolved && !this._isInvincible) {
					if (aoe.checkCollision(playerX, playerY)) {
						this.takeDamage();
						aoe.resolved = true;
					}
				}

				if (aoe.isFinished()) {
					this._aoeContainer.removeChild(aoe);
					this._aoeSprites.splice(i, 1);
					this._aoePool.push(aoe);
				}
			}
		}

		updateResult() {
			if (Input.isTriggered('ok') || Input.isTriggered('cancel') ||
				TouchInput.isTriggered() || TouchInput.isCancelled()) {
				if (!this._isTerminating) {
					this._isTerminating = true;
					this.startTerminatingProcess();
				}
			}

			if (this._isTerminating) {
				this._terminateTimer--;
				if (this._terminateTimer <= 0) {
					const resultValue = (this._resultType === 'win') ? 1 : 0;
					$gameVariables.setValue(resultVariable, resultValue);

					$gameScreen.startTint([0, 0, 0, 0], 30);
					this.popScene();
				}
			}
		}

		startTerminatingProcess() {
			$gameScreen.startTint([-255, -255, -255, 0], 30);
			this._terminateTimer = 30;
			$gamePlayer.setDirection(8);
		}

		updateHpDisplay() {
			this._hpWindow.contents.clear();
			this._hpWindow.drawText('HP:', 10, 10, 100, 'left');

			let x = 60;
			for (let i = 0; i < _gameConfig.maxHp; i++) {
				const color = i < this._hp ? '#00ff00' : '#333333';
				this._hpWindow.contents.fillRect(x, 20, 20, 20, color);
				x += 25;
			}
		}

		updateTimerDisplay(elapsed) {
			const remaining = Math.max(0, _gameConfig.gameDuration - elapsed);
			this._timerWindow.contents.clear();
			this._timerWindow.drawText(`Time: ${remaining.toFixed(1)}s`, 10, 10, 180, 'left');
		}

		spawnAoE() {
			const mapWidth = $gameMap.width() * $gameMap.tileWidth();
			const mapHeight = $gameMap.height() * $gameMap.tileHeight();

			const tileWidth = $gameMap.tileWidth();
			const tileHeight = $gameMap.tileHeight();
			const playerX = $gamePlayer._realX * tileWidth + tileWidth / 2;
			const playerY = $gamePlayer._realY * tileHeight + tileHeight / 2;

			// 経過時間に応じてAoEタイプの選択肢を増やす
			const elapsed = this._elapsedFrames / 60;
			const effectiveElapsed = _gameConfig.hardMode ? 999 : elapsed;

			let types = ['circle', 'donut', 'rect'];

			if (effectiveElapsed > 8) types.push('line');
			if (effectiveElapsed > 15) types.push('cross', 'chase');
			if (effectiveElapsed > 20) types.push('half-left', 'half-right', 'half-top', 'half-bottom', 'spread');
			if (effectiveElapsed > 30) types.push('grid', 'grid');

			const type = types[Math.floor(Math.random() * types.length)];

			// 複合パターン
			if (type === 'chase') {
				this._chaseCount = 5;
				this._chaseTimer = 0;
				return;
			} else if (type === 'spread') {
				const count = 5 + Math.floor(Math.random() * 4);
				const screenLeft = $gameMap.displayX() * tileWidth;
				const screenTop = $gameMap.displayY() * tileHeight;

				for (let i = 0; i < count; i++) {
					const rx = screenLeft + Graphics.width * (0.1 + Math.random() * 0.8);
					const ry = screenTop + Graphics.height * (0.1 + Math.random() * 0.8);
					this.spawnSingleAoE('circle', rx, ry, { radius: 50 + Math.random() * 30 });
				}
				return;
			}

			// 単発パターン
			let x, y, params;
			const angle = Math.random() * Math.PI * 2;
			const offset = Math.random() * 80;

			if (type === 'circle') {
				const radius = 60 + Math.random() * 40;
				x = playerX + Math.cos(angle) * offset;
				y = playerY + Math.sin(angle) * offset;
				x = Math.max(radius, Math.min(mapWidth - radius, x));
				y = Math.max(radius, Math.min(mapHeight - radius, y));
				params = { radius: radius };

			} else if (type === 'donut') {
				const outerRadius = 100 + Math.random() * 40;
				const innerRadius = 50 + Math.random() * 20;
				const donutOffset = innerRadius + Math.random() * (outerRadius - innerRadius);
				x = playerX + Math.cos(angle) * donutOffset;
				y = playerY + Math.sin(angle) * donutOffset;
				x = Math.max(outerRadius, Math.min(mapWidth - outerRadius, x));
				y = Math.max(outerRadius, Math.min(mapHeight - outerRadius, y));
				params = { outerRadius: outerRadius, innerRadius: innerRadius };

			} else if (type === 'rect') {
				const width = 100 + Math.random() * 80;
				const height = 100 + Math.random() * 80;
				x = playerX + Math.cos(angle) * offset;
				y = playerY + Math.sin(angle) * offset;
				x = Math.max(width / 2, Math.min(mapWidth - width / 2, x));
				y = Math.max(height / 2, Math.min(mapHeight - height / 2, y));
				params = { width: width, height: height };

			} else if (type === 'line') {
				const lineCount = 3 + Math.floor(Math.random() * 2);
				for (let i = 0; i < lineCount; i++) {
					const width = 60 + Math.random() * 40;
					const length = 2000;
					const targetX = playerX + (Math.random() - 0.5) * 300;
					const targetY = playerY + (Math.random() - 0.5) * 300;
					const shootAngle = Math.random() * Math.PI * 2;
					const lParams = { width: width, length: length, angle: shootAngle };
					this.spawnSingleAoE('line', targetX, targetY, lParams);
				}
				return;

			} else if (type === 'cross') {
				const width = 50 + Math.random() * 30;
				const length = Math.max(mapWidth, mapHeight);
				x = playerX + Math.cos(angle) * offset;
				y = playerY + Math.sin(angle) * offset;
				x = Math.max(0, Math.min(mapWidth, x));
				y = Math.max(0, Math.min(mapHeight, y));
				params = { width: width, length: length };

			} else if (type === 'half-left' || type === 'half-right' || type === 'half-top' || type === 'half-bottom') {
				x = 0;
				y = 0;
				params = { mapWidth: mapWidth, mapHeight: mapHeight };

			} else if (type === 'grid') {
				const cellSize = 96 + Math.random() * 96;
				const pattern = Math.floor(Math.random() * 2);
				x = 0;
				y = 0;
				params = { mapWidth: mapWidth, mapHeight: mapHeight, cellSize: cellSize, pattern: pattern };
			}

			this.spawnSingleAoE(type, x, y, params);
		}

		spawnSingleAoE(type, x, y, params) {
			let aoe;
			if (this._aoePool.length > 0) {
				aoe = this._aoePool.pop();
			} else {
				aoe = new Sprite_AoE();
			}
			aoe.setup(type, x, y, params);

			this._aoeContainer.addChild(aoe);
			this._aoeSprites.push(aoe);
		}

		takeDamage() {
			this._hp--;
			this._isInvincible = true;
			this._invincibleEndFrame = this._elapsedFrames + 60;

			this.updateHpDisplay();

			$gameScreen.startFlash([255, 0, 0, 128], 10);
			this.startShake(6, 6, 15);
			AudioManager.playSe({ name: seDamage, volume: 90, pitch: 100, pan: 0 });

			if (this._hp <= 0) {
				this.gameOver();
			}
		}

		startShake(power, speed, duration) {
			$gameScreen.startShake(power, speed, duration);
		}

		gameClear() {
			this._gamePhase = 'result';
			this._resultType = 'win';
			$gameVariables.setValue(resultVariable, 1);

			if (winCountVariable > 0) {
				const count = $gameVariables.value(winCountVariable);
				$gameVariables.setValue(winCountVariable, count + 1);
			}

			this._resultWindow.contents.clear();
			this._resultWindow.drawText('SUCCESS!', 0, 20, this._resultWindow.width - 32, 'center');
			this._resultWindow.drawText(`${_gameConfig.gameDuration}秒間生き残りました！`, 0, 60, this._resultWindow.width - 32, 'center');
			this._resultWindow.drawText('決定キーで終了', 0, 100, this._resultWindow.width - 32, 'center');
			this._resultWindow.show();

			AudioManager.playSe({ name: seClear, volume: 90, pitch: 100, pan: 0 });

			this._aoeSprites.forEach(aoe => this._aoeContainer.removeChild(aoe));
			this._aoeSprites = [];
		}

		gameOver() {
			this._gamePhase = 'result';
			this._resultType = 'lose';
			$gameVariables.setValue(resultVariable, 0);

			const elapsed = this._elapsedFrames / 60;

			this._resultWindow.contents.clear();
			this._resultWindow.drawText('FAILED...', 0, 20, this._resultWindow.width - 32, 'center');
			this._resultWindow.drawText(`${elapsed.toFixed(1)}秒生き残りました`, 0, 60, this._resultWindow.width - 32, 'center');
			this._resultWindow.drawText('決定キーで終了', 0, 100, this._resultWindow.width - 32, 'center');
			this._resultWindow.show();

			AudioManager.playSe({ name: seFail, volume: 90, pitch: 100, pan: 0 });

			this._aoeSprites.forEach(aoe => this._aoeContainer.removeChild(aoe));
			this._aoeSprites = [];
		}

		terminate() {
			super.terminate();

			// イベントインタプリタの待機を解除
			_gameFinished = true;

			if (this._savedMoveSpeed !== undefined) {
				$gamePlayer.setMoveSpeed(this._savedMoveSpeed);
			}

			// プール内のスプライトを破棄
			if (this._aoePool) {
				this._aoePool.forEach(aoe => aoe.destroy());
				this._aoePool = [];
			}

			if (this._spriteset) {
				this._spriteset.destroy();
			}
		}
	}

	// グローバルスコープに登録
	window.Scene_DodgeGame = Scene_DodgeGame;

})();
