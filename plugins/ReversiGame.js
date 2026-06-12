/*:
 * @target MZ
 * @plugindesc リバーシ（オセロ）ミニゲーム
 * @author kotonoha*
 * @url https://aokikotori.com/
 * @version 1.0.0
 *
 * @param resultVariable
 * @text 結果格納変数
 * @desc ゲーム結果を格納する変数ID（0=負け, 1=勝ち, 2=引分）
 * @type variable
 * @default 1
 *
 * @param winCountVariable
 * @text 勝利数加算変数
 * @desc 勝利時に+1加算する変数ID（0=使用しない）
 * @type variable
 * @default 0
 *
 * @param winMe
 * @text 勝利ME
 * @desc 勝利時のME
 * @type file
 * @dir audio/me
 * @default Victory1
 *
 * @param loseMe
 * @text 敗北ME
 * @desc 敗北時のME
 * @type file
 * @dir audio/me
 * @default Defeat1
 *
 * @param putSe
 * @text 着手SE
 * @desc 石を置いた時のSE
 * @type file
 * @dir audio/se
 * @default Switch1
 *
 * @param reverseSe
 * @text 反転SE
 * @desc 石が返る時のSE
 * @type file
 * @dir audio/se
 * @default Switch2
 *
 * @param coinSe
 * @text コイントスSE
 * @desc コイントス決定時のSE
 * @type file
 * @dir audio/se
 * @default Skill2
 *
 * @command startGame
 * @text ゲーム開始
 * @desc リバーシゲームを開始します。コマンド完了まで自動ウェイトします。
 *
 * @arg cpuLevel
 * @text CPUレベル
 * @desc 1:弱い 2:普通 3:強い 4:戦略 5:先読み
 * @type number
 * @default 2
 * @min 1
 * @max 5
 *
 * @arg opponentName
 * @text 対戦相手の名前
 * @desc CPU側の表示名
 * @type string
 * @default CPU
 *
 * @arg playerName
 * @text プレイヤーの名前
 * @desc プレイヤー側の表示名
 * @type string
 * @default プレイヤー
 *
 * @help ReversiGame.js - リバーシ（オセロ）ミニゲーム v1.0.0
 *
 * ■ 概要
 * 標準8×8盤面で対戦するリバーシ（オセロ）ゲームです。
 * CPUの強さを5段階から選べます。
 * 外部画像不要で、デフォルトのRPGツクールMZアセットのみで動作します。
 *
 * ■ 使い方
 * プラグインコマンド「ゲーム開始」を実行してください。
 * コマンド完了後、結果格納変数に結果が格納されます。
 *   0 = 負け
 *   1 = 勝ち
 *   2 = 引き分け
 *
 * プラグインコマンドは完了まで自動的にウェイトするため、
 * イベント側でのループウェイトは不要です。
 *
 * ■ CPUレベル
 *   Lv1: ほぼランダム（初心者向け）
 *   Lv2: 少し考える（カジュアル）
 *   Lv3: 多く取る戦略
 *   Lv4: 位置評価＋開放度理論
 *   Lv5: 先読みAI（α-β探索＋置換表）
 *
 * ■ 操作方法
 *   方向キー: カーソル移動
 *   決定キー: 石を置く
 *   マウスクリック: 石を置く
 *   決定/キャンセル/クリック: 結果画面から終了
 *
 * ■ ライセンス
 * このプラグインはMITライセンスです。
 * 商用・非商用問わず自由に使用できます。
 */

(() => {
	'use strict';

	const pluginName = 'ReversiGame';
	const parameters = PluginManager.parameters(pluginName);
	const resultVariable = Number(parameters['resultVariable'] || 1);
	const winCountVariable = Number(parameters['winCountVariable'] || 0);
	const winMe = String(parameters['winMe'] || 'Victory1');
	const loseMe = String(parameters['loseMe'] || 'Defeat1');
	const putSe = String(parameters['putSe'] || 'Switch1');
	const reverseSe = String(parameters['reverseSe'] || 'Switch2');
	const coinSe = String(parameters['coinSe'] || 'Skill2');

	const BOARD_SIZE = 8;
	const CELL_SIZE = 40;
	const BOARD_MARGIN = 8;
	const NONE = 0;
	const BLACK = 1;
	const WHITE = 2;
	const WALL = -1;

	// ゲーム設定（プラグインコマンドから設定）
	let _gameConfig = {
		cpuLevel: 2,
		opponentName: 'CPU',
		playerName: 'プレイヤー'
	};
	let _gameFinished = false;

	// ========================================
	// プラグインコマンド登録
	// ========================================
	PluginManager.registerCommand(pluginName, 'startGame', function(args) {
		_gameConfig = {
			cpuLevel: Math.min(5, Math.max(1, Number(args.cpuLevel || 2))),
			opponentName: String(args.opponentName || 'CPU'),
			playerName: String(args.playerName || 'プレイヤー')
		};
		_gameFinished = false;
		SceneManager.push(Scene_ReversiGame);
		this.setWaitMode('reversiGame');
	});

	// ウェイトモード拡張
	const _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
	Game_Interpreter.prototype.updateWaitMode = function() {
		if (this._waitMode === 'reversiGame') {
			if (_gameFinished) {
				this._waitMode = '';
				return false;
			}
			return true;
		}
		return _Game_Interpreter_updateWaitMode.call(this);
	};

	// ========================================
	// 盤面クラス
	// ========================================
	class ReversiBoard {
		constructor(skipInit) {
			this.width = BOARD_SIZE;
			this.height = BOARD_SIZE;
			this.cells = [];
			if (!skipInit) this.generateBoard();
		}

		// 標準8×8盤面の初期化
		generateBoard() {
			this.cells = new Array(this.width * this.height).fill(NONE);
			const cx = this.width / 2 - 1;
			const cy = this.height / 2 - 1;
			this.set(cx, cy, WHITE);
			this.set(cx + 1, cy, BLACK);
			this.set(cx, cy + 1, BLACK);
			this.set(cx + 1, cy + 1, WHITE);
		}

		get(x, y) {
			if (x < 0 || x >= this.width || y < 0 || y >= this.height) return WALL;
			return this.cells[y * this.width + x];
		}

		set(x, y, color) {
			if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
				this.cells[y * this.width + x] = color;
			}
		}

		canPut(x, y, color) {
			if (this.get(x, y) !== NONE) return false;
			return this.countFlippable(x, y, color) > 0;
		}

		countFlippable(x, y, color) {
			let total = 0;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					if (dx === 0 && dy === 0) continue;
					total += this.countFlippableDir(x, y, color, dx, dy);
				}
			}
			return total;
		}

		countFlippableDir(x, y, color, dx, dy) {
			let count = 0;
			let nx = x + dx;
			let ny = y + dy;
			const opponent = (color === BLACK) ? WHITE : BLACK;
			while (this.get(nx, ny) === opponent) {
				count++;
				nx += dx;
				ny += dy;
			}
			if (count > 0 && this.get(nx, ny) === color) {
				return count;
			}
			return 0;
		}

		putStone(x, y, color) {
			if (!this.canPut(x, y, color)) return [];
			this.set(x, y, color);
			let flipped = [];
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					if (dx === 0 && dy === 0) continue;
					const n = this.countFlippableDir(x, y, color, dx, dy);
					if (n > 0) {
						let nx = x + dx;
						let ny = y + dy;
						for (let i = 0; i < n; i++) {
							this.set(nx, ny, color);
							flipped.push({x: nx, y: ny});
							nx += dx;
							ny += dy;
						}
					}
				}
			}
			return flipped;
		}

		countStones() {
			let b = 0, w = 0;
			for (const c of this.cells) {
				if (c === BLACK) b++;
				else if (c === WHITE) w++;
			}
			return { black: b, white: w };
		}

		countEmpty() {
			let n = 0;
			for (const c of this.cells) {
				if (c === NONE) n++;
			}
			return n;
		}

		getValidMoves(color) {
			const moves = [];
			for (let y = 0; y < this.height; y++) {
				for (let x = 0; x < this.width; x++) {
					if (this.canPut(x, y, color)) {
						moves.push({x, y});
					}
				}
			}
			return moves;
		}

		clone() {
			const newBoard = new ReversiBoard(true);
			newBoard.cells = [...this.cells];
			return newBoard;
		}
	}

	// ========================================
	// ゲームシーン
	// ========================================
	class Scene_ReversiGame extends Scene_MenuBase {
		initialize() {
			super.initialize();
			this._board = new ReversiBoard();
			this._turn = BLACK;
			this._gamePhase = 'start';
			this._animQueue = [];
			this._passCount = 0;
			this._cursorIndex = -1;
			this._validMoves = [];
			this._animWait = 0;
			this._playerColor = BLACK;

			// 初期石のインデックス（8×8中央: cx=3, cy=3）
			const cx = 3;
			const cy = 3;
			this._initStoneIndices = [
				cy * BOARD_SIZE + cx,
				cy * BOARD_SIZE + (cx + 1),
				(cy + 1) * BOARD_SIZE + cx,
				(cy + 1) * BOARD_SIZE + (cx + 1)
			];
			this._tossColor = BLACK;
			this._coinTossCount = 0;

			// AI用置換表（Lv5で使用）
			this._transpositionTable = new Map();

			// ゲーム設定
			this._opponentName = _gameConfig.opponentName;
			this._opponentLevel = _gameConfig.cpuLevel;
			this._playerName = _gameConfig.playerName;
		}

		create() {
			super.create();
			this.createStoneBitmaps();
			this.createAllWindows();
			this.drawBoardGrid();

			// 開始アニメーション準備
			this._boardWindow.alpha = 0;
			this._boardWindow.y += 50;
			this._animPhase = 'start';
		}

		terminate() {
			super.terminate();
			_gameFinished = true;
		}

		// 石・ガイド・コイントス用ビットマップを事前生成
		createStoneBitmaps() {
			const s = CELL_SIZE;
			const r = s / 2 - 4;

			// 黒石
			this._blackStoneBmp = new Bitmap(s, s);
			this._blackStoneBmp.drawCircle(s / 2, s / 2, r, '#222222');
			this._blackStoneBmp.drawCircle(s / 2 - 2, s / 2 - 2, r * 0.35, '#555555');

			// 白石
			this._whiteStoneBmp = new Bitmap(s, s);
			this._whiteStoneBmp.drawCircle(s / 2, s / 2, r, '#dddddd');
			this._whiteStoneBmp.drawCircle(s / 2 - 2, s / 2 - 2, r * 0.35, '#ffffff');

			// ガイド（配置可能マーカー）
			this._guideBmp = new Bitmap(s, s);
			this._guideBmp.drawCircle(s / 2, s / 2, 5, 'rgba(255, 220, 80, 0.7)');

			// コイントス用（大きめ）
			this._coinBlackBmp = new Bitmap(80, 80);
			this._coinBlackBmp.drawCircle(40, 40, 30, '#222222');
			this._coinBlackBmp.drawCircle(36, 36, 10, '#555555');

			this._coinWhiteBmp = new Bitmap(80, 80);
			this._coinWhiteBmp.drawCircle(40, 40, 30, '#dddddd');
			this._coinWhiteBmp.drawCircle(36, 36, 10, '#ffffff');
		}

		createAllWindows() {
			// 情報ウィンドウ（上部）
			this._infoWindow = new Window_Base(new Rectangle(0, 0, Graphics.boxWidth, 80));
			this._infoWindow.setBackgroundType(1);
			this.addWindow(this._infoWindow);

			// 盤面ウィンドウ（中央）
			const pad = 12;
			const innerSize = BOARD_SIZE * CELL_SIZE + BOARD_MARGIN * 2;
			const bwW = innerSize + pad * 2;
			const bwH = innerSize + pad * 2;
			const bwX = (Graphics.boxWidth - bwW) / 2;
			const bwY = 80 + ((Graphics.boxHeight - 80 - 80) - bwH) / 2;
			this._boardWindow = new Window_Base(new Rectangle(bwX, bwY, bwW, bwH));
			this._boardWindow.setBackgroundType(0);
			this._boardOriginY = bwY; // アニメーション用に保存
			this.addWindow(this._boardWindow);

			// メッセージウィンドウ（最下部）
			const msgH = 80;
			const msgY = Graphics.boxHeight - msgH;
			this._messageWindow = new Window_Base(new Rectangle(0, msgY, Graphics.boxWidth, msgH));
			this._messageWindow.setBackgroundType(1);
			this.addWindow(this._messageWindow);

			// 盤面セルスプライト
			this._pieceSprites = [];
			for (let y = 0; y < BOARD_SIZE; y++) {
				for (let x = 0; x < BOARD_SIZE; x++) {
					const sprite = new Sprite();
					sprite.anchor.set(0.5);
					sprite.x = BOARD_MARGIN + x * CELL_SIZE + CELL_SIZE / 2;
					sprite.y = BOARD_MARGIN + y * CELL_SIZE + CELL_SIZE / 2;
					sprite.visible = false;
					this._boardWindow.addInnerChild(sprite);
					this._pieceSprites.push(sprite);
				}
			}

			// コイントス用スプライト
			this._coinSprite = new Sprite();
			this._coinSprite.anchor.set(0.5);
			this._coinSprite.x = BOARD_MARGIN + BOARD_SIZE * CELL_SIZE / 2;
			this._coinSprite.y = BOARD_MARGIN + BOARD_SIZE * CELL_SIZE / 2;
			this._coinSprite.visible = false;
			this._boardWindow.addInnerChild(this._coinSprite);

			// カーソル（PIXI.Graphics）
			this._cursorSprite = new PIXI.Graphics();
			this._cursorSprite.lineStyle(3, 0xFFFF00, 1);
			const half = CELL_SIZE / 2 - 2;
			this._cursorSprite.drawRect(-half, -half, half * 2, half * 2);
			this._cursorSprite.visible = false;
			this._boardWindow.addInnerChild(this._cursorSprite);
		}

		// 盤面の背景・グリッド線・星を描画（一度だけ）
		drawBoardGrid() {
			const contents = this._boardWindow.contents;
			const m = BOARD_MARGIN;
			const boardPx = BOARD_SIZE * CELL_SIZE;

			// 外枠
			contents.fillRect(m - 2, m - 2, boardPx + 4, boardPx + 4, '#0D3B10');
			// 盤面背景
			contents.fillRect(m, m, boardPx, boardPx, '#1B5E20');

			// グリッド線
			for (let i = 0; i <= BOARD_SIZE; i++) {
				contents.fillRect(m + i * CELL_SIZE, m, 1, boardPx, '#0D4B15');
				contents.fillRect(m, m + i * CELL_SIZE, boardPx, 1, '#0D4B15');
			}

			// 星（標準オセロの4点）
			const dots = [{x:2,y:2}, {x:6,y:2}, {x:2,y:6}, {x:6,y:6}];
			for (const d of dots) {
				contents.drawCircle(m + d.x * CELL_SIZE, m + d.y * CELL_SIZE, 3, '#0D4B15');
			}
		}

		// 石のインジケーター描画（アウトライン付き）
		_drawStoneIndicator(contents, x, y, radius, color) {
			contents.drawCircle(x, y, radius + 1, '#000000');
			contents.drawCircle(x, y, radius, color);
		}

		refreshBoard() {
			// 情報ウィンドウ更新
			const counts = this._board.countStones();
			const contents = this._infoWindow.contents;
			contents.clear();
			const cx = this._infoWindow.innerWidth / 2;

			const pColor = (this._playerColor === BLACK) ? '#222222' : '#dddddd';
			const cColor = (this._playerColor === BLACK) ? '#dddddd' : '#222222';
			const pCount = (this._playerColor === BLACK) ? counts.black : counts.white;
			const cCount = (this._playerColor === BLACK) ? counts.white : counts.black;

			this._drawStoneIndicator(contents, cx - 194, 26, 12, pColor);
			this._infoWindow.drawText(`${this._playerName}: ${pCount}個`, cx - 170, 10, 200, 'left');
			this._drawStoneIndicator(contents, cx + 66, 26, 12, cColor);
			this._infoWindow.drawText(`${this._opponentName}: ${cCount}個`, cx + 90, 10, 200, 'left');

			// 盤面スプライト更新
			for (let y = 0; y < BOARD_SIZE; y++) {
				for (let x = 0; x < BOARD_SIZE; x++) {
					const idx = y * BOARD_SIZE + x;
					const cell = this._board.get(x, y);
					const sprite = this._pieceSprites[idx];

					// コイントス中は全セルスプライト非表示
					if (this._animPhase === 'coinToss') {
						sprite.visible = false;
						continue;
					}

					if (cell === BLACK) {
						sprite.bitmap = this._blackStoneBmp;
						sprite.visible = true;
						sprite.opacity = 255;
						sprite.scale.set(1.0);
					} else if (cell === WHITE) {
						sprite.bitmap = this._whiteStoneBmp;
						sprite.visible = true;
						sprite.opacity = 255;
						sprite.scale.set(1.0);
					} else if (cell === NONE) {
						if (this.isValidMove(x, y) && this._turn === this._playerColor) {
							sprite.bitmap = this._guideBmp;
							sprite.visible = true;
							sprite.opacity = 200;
							sprite.scale.set(1.0);
						} else {
							sprite.visible = false;
						}
					} else {
						sprite.visible = false;
					}

					// 初期石アニメーション中はまだの石を非表示
					if (this._animPhase === 'initStones') {
						const initOrder = this._initStoneIndices.indexOf(idx);
						if (initOrder >= 0 && initOrder >= this._animIndex) {
							sprite.visible = false;
						}
						if (sprite.visible) sprite.scale.set(1.0);
					}
				}
			}
		}

		isValidMove(x, y) {
			return this._validMoves.some(m => m.x === x && m.y === y);
		}

		// ========================================
		// 更新処理
		// ========================================
		update() {
			super.update();

			if (this._animPhase === 'start') {
				this.updateStartAnimation();
				return;
			} else if (this._animPhase === 'coinToss') {
				this.updateCoinTossAnimation();
				return;
			} else if (this._animPhase === 'initStones') {
				this.updateInitStonesAnimation();
				return;
			}

			if (this._gamePhase === 'player') {
				this.updatePlayerInput();
				this.updateCursor();
			} else if (this._gamePhase === 'animate') {
				this.updateAnimation();
			} else if (this._gamePhase === 'end') {
				if (Input.isTriggered('ok') || Input.isTriggered('cancel') ||
					TouchInput.isTriggered() || TouchInput.isCancelled()) {
					this.popScene();
				}
			}
		}

		updateStartAnimation() {
			this._boardWindow.alpha += 0.05;
			this._boardWindow.y -= 2.5;
			if (this._boardWindow.alpha >= 1) {
				this._boardWindow.alpha = 1;
				this._boardWindow.y = this._boardOriginY;

				// コイントス演出へ
				this._animPhase = 'coinToss';
				this._coinTossCount = 30 + Math.randomInt(2);
				this._animWait = 0;
				this._coinSprite.visible = true;
				this._messageWindow.drawText("運命の選択...", 0, 10, this._messageWindow.innerWidth, 'center');
			}
		}

		updateCoinTossAnimation() {
			if (this._animWait > 0) {
				this._animWait--;
				return;
			}

			if (this._coinTossCount > 0) {
				this._tossColor = (this._tossColor === BLACK) ? WHITE : BLACK;
				AudioManager.playSe({ name: 'Cursor1', volume: 50, pitch: 150 - this._coinTossCount * 2, pan: 0 });
				// コイン表示更新
				this._coinSprite.bitmap = (this._tossColor === BLACK) ? this._coinBlackBmp : this._coinWhiteBmp;
				this.refreshBoard();
				this._coinTossCount--;
				this._animWait = Math.floor((30 - this._coinTossCount) / 10) + 2;
			} else {
				// 決定
				this._playerColor = this._tossColor;
				this._turn = BLACK;
				AudioManager.playSe({ name: coinSe, volume: 80, pitch: 100, pan: 0 });

				this._messageWindow.contents.clear();
				const colorName = (this._playerColor === BLACK) ? "黒（先手）" : "白（後手）";
				this._messageWindow.drawText(`あなたは${colorName}です`, 0, 10, this._messageWindow.innerWidth, 'center');

				this._animPhase = 'initStones';
				this._animIndex = 0;
				this._animWait = 60;
			}
		}

		updateInitStonesAnimation() {
			if (this._animWait > 0) {
				this._animWait--;
				return;
			}

			if (this._animIndex < this._initStoneIndices.length) {
				// 初期石配置開始時にコインスプライトを非表示
				if (this._coinSprite.visible) {
					this._coinSprite.visible = false;
				}
				AudioManager.playSe({ name: putSe, volume: 90, pitch: 100, pan: 0 });
				this._animIndex++;
				this.refreshBoard();
				this._animWait = 10;
			} else {
				this._animPhase = 'none';
				this.checkTurn();
			}
		}

		// ========================================
		// ターン管理
		// ========================================
		checkTurn() {
			if (this._gamePhase === 'end') return;

			const moves = this._board.getValidMoves(this._turn);
			this._validMoves = moves;
			this.refreshBoard();

			if (this._turn === this._playerColor) {
				this._messageWindow.contents.clear();
				if (moves.length === 0) {
					this._messageWindow.drawText("置ける場所がありません！ PASS", 0, 10, this._messageWindow.innerWidth, 'center');
					this._passCount++;
					this._gamePhase = 'wait';
					setTimeout(() => this.changeTurn(), 1000);
				} else {
					this._passCount = 0;
					this._messageWindow.drawText("あなたの番です", 0, 10, this._messageWindow.innerWidth, 'center');
					this._gamePhase = 'player';
					this._cursorIndex = 0;
					this.updateCursor();
				}
			} else {
				this._messageWindow.contents.clear();
				if (moves.length === 0) {
					this._messageWindow.drawText(`${this._opponentName} PASS`, 0, 10, this._messageWindow.innerWidth, 'center');
					this._passCount++;
					this._gamePhase = 'wait';
					setTimeout(() => this.changeTurn(), 1000);
				} else {
					this._passCount = 0;
					this._messageWindow.drawText(`${this._opponentName}の番です`, 0, 10, this._messageWindow.innerWidth, 'center');
					this._gamePhase = 'cpu';
					setTimeout(() => this.cpuMove(), 800);
				}
			}

			if (this._passCount >= 2) {
				this.endGame();
			}
		}

		changeTurn() {
			if (this._gamePhase === 'end') return;
			this._turn = (this._turn === BLACK) ? WHITE : BLACK;
			this.checkTurn();
		}

		// ========================================
		// プレイヤー入力
		// ========================================
		updateCursor() {
			if (this._validMoves.length > 0) {
				const move = this._validMoves[this._cursorIndex];
				this._cursorSprite.x = BOARD_MARGIN + move.x * CELL_SIZE + CELL_SIZE / 2;
				this._cursorSprite.y = BOARD_MARGIN + move.y * CELL_SIZE + CELL_SIZE / 2;
				this._cursorSprite.visible = true;

				const t = Date.now() / 200;
				this._cursorSprite.alpha = 0.8 + Math.sin(t) * 0.2;
			} else {
				this._cursorSprite.visible = false;
			}
		}

		updatePlayerInput() {
			if (this._validMoves.length === 0) return;

			// マウスクリック
			if (TouchInput.isTriggered()) {
				const cell = this._touchToCell(TouchInput.x, TouchInput.y);
				if (cell) {
					const idx = this._validMoves.findIndex(m => m.x === cell.x && m.y === cell.y);
					if (idx >= 0) {
						this._cursorIndex = idx;
						this.executeMove(cell.x, cell.y);
						return;
					}
				}
			}

			if (Input.isRepeated('left') || Input.isRepeated('up')) {
				this._cursorIndex = (this._cursorIndex - 1 + this._validMoves.length) % this._validMoves.length;
				SoundManager.playCursor();
			} else if (Input.isRepeated('right') || Input.isRepeated('down')) {
				this._cursorIndex = (this._cursorIndex + 1) % this._validMoves.length;
				SoundManager.playCursor();
			} else if (Input.isTriggered('ok')) {
				const move = this._validMoves[this._cursorIndex];
				this.executeMove(move.x, move.y);
			} else if (Input.isTriggered('cancel')) {
				SoundManager.playBuzzer();
			}
		}

		// 画面座標→盤面マス座標に変換
		_touchToCell(screenX, screenY) {
			const bw = this._boardWindow;
			const pad = bw.padding;
			const localX = screenX - bw.x - pad - BOARD_MARGIN;
			const localY = screenY - bw.y - pad - BOARD_MARGIN;
			const cx = Math.floor(localX / CELL_SIZE);
			const cy = Math.floor(localY / CELL_SIZE);
			if (cx < 0 || cx >= BOARD_SIZE || cy < 0 || cy >= BOARD_SIZE) return null;
			return { x: cx, y: cy };
		}

		// ========================================
		// 確定石判定（改良版：部分的確定石も評価）
		// ========================================
		countStableStones(board, color) {
			let stableCount = 0;
			for (let y = 0; y < BOARD_SIZE; y++) {
				for (let x = 0; x < BOARD_SIZE; x++) {
					if (board.get(x, y) === color) {
						stableCount += this.getStoneStability(board, x, y, color);
					}
				}
			}
			return stableCount;
		}

		getStoneStability(board, x, y, color) {
			let stableDirections = 0;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					if (dx === 0 && dy === 0) continue;
					if (this.isDirectionStable(board, x, y, color, dx, dy)) {
						stableDirections++;
					}
				}
			}
			return stableDirections / 8.0;
		}

		isDirectionStable(board, x, y, color, dx, dy) {
			let nx = x + dx;
			let ny = y + dy;
			while (true) {
				const cell = board.get(nx, ny);
				if (cell === WALL) return true;
				if (cell === NONE) return false;
				if (cell !== color) return false;
				nx += dx;
				ny += dy;
			}
		}

		// ========================================
		// 盤面ハッシュ化（置換表用）
		// ========================================
		getBoardHash(board) {
			return board.cells.join(',');
		}

		// ========================================
		// Move Ordering（良い手から探索）
		// ========================================
		orderMoves(board, moves, color, depth) {
			const opponent = (color === BLACK) ? WHITE : BLACK;
			const scored = moves.map(move => {
				let score = 0;

				// 1. 取れる石の数（終盤ほど重視）
				const flipCount = board.countFlippable(move.x, move.y, color);
				score += flipCount * (10 - depth);

				// 2. 角は最優先
				if (this._isCorner(move.x, move.y)) {
					score += 1000;
				}

				// 3. 中央付近の手を優先
				const centerX = BOARD_SIZE / 2;
				const centerY = BOARD_SIZE / 2;
				const distToCenter = Math.abs(move.x - centerX) + Math.abs(move.y - centerY);
				score -= distToCenter * 5;

				// 4. 辺隣接は高評価
				let edgeAdj = 0;
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						if (dx === 0 && dy === 0) continue;
						if (board.get(move.x + dx, move.y + dy) === WALL) edgeAdj++;
					}
				}
				score += edgeAdj * 20;

				// 5. 危険な手（相手に確定石を与える手）は最後に
				const simBoard = board.clone();
				simBoard.putStone(move.x, move.y, color);
				const opStableAfter = this.countStableStones(simBoard, opponent);
				const opStableBefore = this.countStableStones(board, opponent);
				if (opStableAfter > opStableBefore + 0.5) {
					score -= 500;
				}

				return { move, score };
			});

			scored.sort((a, b) => b.score - a.score);
			return scored.map(s => s.move);
		}

		// 角判定
		_isCorner(x, y) {
			return (x === 0 || x === BOARD_SIZE - 1) && (y === 0 || y === BOARD_SIZE - 1);
		}

		// ========================================
		// α-β枝刈り付きMinimax探索（置換表対応）
		// ========================================
		minimax(board, depth, alpha, beta, isMaximizing, color) {
			// 置換表チェック
			const hash = this.getBoardHash(board);
			if (this._transpositionTable.has(hash)) {
				const entry = this._transpositionTable.get(hash);
				if (entry.depth >= depth) {
					return entry.score;
				}
			}

			const opponent = (color === BLACK) ? WHITE : BLACK;
			let moves = board.getValidMoves(color);

			if (depth === 0) {
				const score = this.evaluateBoard(board, this._turn);
				this._transpositionTable.set(hash, { depth, score });
				return score;
			}

			if (moves.length === 0) {
				const opMoves = board.getValidMoves(opponent);
				if (opMoves.length === 0) {
					const score = this.evaluateBoard(board, this._turn);
					this._transpositionTable.set(hash, { depth, score });
					return score;
				}
				return this.minimax(board, depth, alpha, beta, !isMaximizing, opponent);
			}

			// Move Ordering（深度3以上で実行）
			if (depth >= 3) {
				moves = this.orderMoves(board, moves, color, depth);
			}

			if (isMaximizing) {
				let maxEval = -999999;
				for (const move of moves) {
					const simBoard = board.clone();
					simBoard.putStone(move.x, move.y, color);
					const evaluation = this.minimax(simBoard, depth - 1, alpha, beta, false, opponent);
					maxEval = Math.max(maxEval, evaluation);
					alpha = Math.max(alpha, evaluation);
					if (beta <= alpha) break;
				}
				this._transpositionTable.set(hash, { depth, score: maxEval });
				return maxEval;
			} else {
				let minEval = 999999;
				for (const move of moves) {
					const simBoard = board.clone();
					simBoard.putStone(move.x, move.y, color);
					const evaluation = this.minimax(simBoard, depth - 1, alpha, beta, true, opponent);
					minEval = Math.min(minEval, evaluation);
					beta = Math.min(beta, evaluation);
					if (beta <= alpha) break;
				}
				this._transpositionTable.set(hash, { depth, score: minEval });
				return minEval;
			}
		}

		// ========================================
		// 盤面評価関数（8×8標準盤面対応）
		// ========================================
		evaluateBoard(board, aiColor) {
			const opponent = (aiColor === BLACK) ? WHITE : BLACK;
			const emptyCount = board.countEmpty();
			const totalCells = BOARD_SIZE * BOARD_SIZE;
			const gameProgress = 1 - (emptyCount / totalCells);

			let score = 0;

			// ゲーム終了判定（最優先）
			if (emptyCount === 0) {
				const counts = board.countStones();
				const myCount = (aiColor === BLACK) ? counts.black : counts.white;
				const opCount = (aiColor === BLACK) ? counts.white : counts.black;
				return (myCount - opCount) * 10000;
			}

			// 1. 石数評価（終盤のみ重視）
			const counts = board.countStones();
			const myCount = (aiColor === BLACK) ? counts.black : counts.white;
			const opCount = (aiColor === BLACK) ? counts.white : counts.black;
			if (gameProgress > 0.7) {
				score += (myCount - opCount) * 100;
			} else if (gameProgress < 0.3) {
				score -= (myCount - opCount) * 10;
			}

			// 2. 確定石評価
			const myStable = this.countStableStones(board, aiColor);
			const opStable = this.countStableStones(board, opponent);
			score += (myStable - opStable) * 200;

			// 3. 角の評価（8×8オセロで最重要）
			const corners = [{x:0,y:0}, {x:7,y:0}, {x:0,y:7}, {x:7,y:7}];
			const xSquares = [{x:1,y:1}, {x:6,y:1}, {x:1,y:6}, {x:6,y:6}];
			const cSquares = [
				[{x:0,y:1},{x:1,y:0}], [{x:6,y:0},{x:7,y:1}],
				[{x:0,y:6},{x:1,y:7}], [{x:6,y:7},{x:7,y:6}]
			];
			for (let i = 0; i < 4; i++) {
				const corner = corners[i];
				const cornerCell = board.get(corner.x, corner.y);
				if (cornerCell === aiColor) {
					score += 150;
				} else if (cornerCell === opponent) {
					score -= 150;
				} else {
					// 角が空いている場合、X打ち・C打ちはペナルティ
					const xs = xSquares[i];
					const xCell = board.get(xs.x, xs.y);
					if (xCell === aiColor) score -= 60;
					else if (xCell === opponent) score += 60;

					for (const cs of cSquares[i]) {
						const cCell = board.get(cs.x, cs.y);
						if (cCell === aiColor) score -= 30;
						else if (cCell === opponent) score += 30;
					}
				}
			}

			// 4. 着手可能数評価（Mobility）
			const myMoves = board.getValidMoves(aiColor).length;
			const opMoves = board.getValidMoves(opponent).length;
			if (gameProgress < 0.8) {
				score += (myMoves - opMoves) * 40;
			}

			// 5. 潜在的着手可能数
			if (gameProgress < 0.6 && emptyCount > 10) {
				let myPotential = 0;
				let opPotential = 0;
				for (let y = 0; y < BOARD_SIZE; y++) {
					for (let x = 0; x < BOARD_SIZE; x++) {
						if (board.get(x, y) === NONE) {
							let myNeighbor = false;
							let opNeighbor = false;
							for (let dy = -1; dy <= 1; dy++) {
								for (let dx = -1; dx <= 1; dx++) {
									if (dx === 0 && dy === 0) continue;
									const cell = board.get(x + dx, y + dy);
									if (cell === aiColor) myNeighbor = true;
									if (cell === opponent) opNeighbor = true;
								}
							}
							if (myNeighbor) myPotential++;
							if (opNeighbor) opPotential++;
						}
					}
				}
				score += (myPotential - opPotential) * 5;
			}

			// 6. 辺の安定評価
			let myEdgeAdj = 0;
			let opEdgeAdj = 0;
			for (let y = 0; y < BOARD_SIZE; y++) {
				for (let x = 0; x < BOARD_SIZE; x++) {
					const cell = board.get(x, y);
					if (cell === aiColor || cell === opponent) {
						let edgeCount = 0;
						for (let dy = -1; dy <= 1; dy++) {
							for (let dx = -1; dx <= 1; dx++) {
								if (dx === 0 && dy === 0) continue;
								if (board.get(x + dx, y + dy) === WALL) edgeCount++;
							}
						}
						const edgeBonus = Math.min(edgeCount, 4) * 5;
						if (cell === aiColor) myEdgeAdj += edgeBonus;
						else opEdgeAdj += edgeBonus;
					}
				}
			}
			score += (myEdgeAdj - opEdgeAdj);

			// 7. 中央制圧評価（序盤のみ）
			if (gameProgress < 0.4) {
				const centerX = BOARD_SIZE / 2;
				const centerY = BOARD_SIZE / 2;
				let myCentral = 0;
				let opCentral = 0;
				for (let y = 0; y < BOARD_SIZE; y++) {
					for (let x = 0; x < BOARD_SIZE; x++) {
						const cell = board.get(x, y);
						if (cell === aiColor || cell === opponent) {
							const dist = Math.abs(x - centerX) + Math.abs(y - centerY);
							const centralValue = Math.max(0, 5 - dist);
							if (cell === aiColor) myCentral += centralValue;
							else opCentral += centralValue;
						}
					}
				}
				score += (myCentral - opCentral) * 3;
			}

			// 8. パリティ（残り石数の偶奇）
			if (gameProgress > 0.5) {
				if (emptyCount % 2 === 1) {
					if (aiColor === this._turn) score += 10;
					else score -= 10;
				}
			}

			return score;
		}

		// ========================================
		// CPU思考
		// ========================================
		cpuMove() {
			if (this._gamePhase === 'end') return;
			const moves = this._validMoves;
			if (moves.length === 0) return;

			let bestMove = moves[0];
			let bestScore = -999999;
			const level = this._opponentLevel;
			const emptyCount = this._board.countEmpty();

			// Lv4用：1手読み評価関数
			const evaluateMove = (board, move, color) => {
				const count = board.countFlippable(move.x, move.y, color);
				let score = 0;

				// 開放度理論
				const totalCells = BOARD_SIZE * BOARD_SIZE;
				if (emptyCount > totalCells * 0.5) {
					score -= count * 3;
				} else {
					score += count * 5;
				}

				// 角ボーナス
				if (this._isCorner(move.x, move.y)) {
					score += 200;
				}

				// 位置評価
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						if (dx === 0 && dy === 0) continue;
						const nx = move.x + dx;
						const ny = move.y + dy;
						const neighbor = board.get(nx, ny);

						if (neighbor === WALL) {
							score += 10;
						} else if (neighbor === NONE) {
							let edgesAround = 0;
							for (let ndy = -1; ndy <= 1; ndy++) {
								for (let ndx = -1; ndx <= 1; ndx++) {
									if (ndx === 0 && ndy === 0) continue;
									if (board.get(nx + ndx, ny + ndy) === WALL) edgesAround++;
								}
							}
							if (edgesAround >= 5) score -= 50;
							else if (edgesAround >= 3) score -= 20;
						}
					}
				}
				return score;
			};

			if (level === 5) {
				// Lv5: 先読みAI（α-β探索＋置換表）
				this._transpositionTable = new Map();

				// 8×8盤面用の探索深度
				let depth = 4;
				if (emptyCount <= 14) {
					depth = 14;
				} else if (emptyCount <= 22) {
					depth = 8;
				} else if (emptyCount <= 35) {
					depth = 6;
				}

				const orderedMoves = this.orderMoves(this._board, moves, this._turn, depth);

				let alpha = -999999;
				const beta = 999999;

				for (const move of orderedMoves) {
					const simBoard = this._board.clone();
					simBoard.putStone(move.x, move.y, this._turn);
					const opponent = (this._turn === BLACK) ? WHITE : BLACK;
					const score = this.minimax(simBoard, depth - 1, alpha, beta, false, opponent);
					if (score > bestScore) {
						bestScore = score;
						bestMove = move;
					}
					alpha = Math.max(alpha, score);
				}

			} else if (level === 4) {
				// Lv4: 戦略AI（1手読み＋評価関数）
				for (const move of moves) {
					const score = evaluateMove(this._board, move, this._turn);
					if (score > bestScore) {
						bestScore = score;
						bestMove = move;
					}
				}
			} else if (level === 3) {
				// Lv3: 多く取る
				for (const move of moves) {
					const count = this._board.countFlippable(move.x, move.y, this._turn);
					if (count > bestScore) {
						bestScore = count;
						bestMove = move;
					}
				}
			} else if (level === 2) {
				// Lv2: 多く取る＋ランダム
				for (const move of moves) {
					const count = this._board.countFlippable(move.x, move.y, this._turn);
					const score = count + Math.random() * 2;
					if (score > bestScore) {
						bestScore = score;
						bestMove = move;
					}
				}
			} else {
				// Lv1: ほぼランダム
				for (const move of moves) {
					const count = this._board.countFlippable(move.x, move.y, this._turn);
					const score = count + Math.random() * 8;
					if (score > bestScore) {
						bestScore = score;
						bestMove = move;
					}
				}
			}

			this.executeMove(bestMove.x, bestMove.y);
		}

		// ========================================
		// 着手実行・アニメーション
		// ========================================
		executeMove(x, y) {
			const flipped = this._board.putStone(x, y, this._turn);
			if (flipped.length === 0) return;

			AudioManager.playSe({ name: putSe, volume: 90, pitch: 100, pan: 0 });

			flipped.unshift({x, y});
			this._animQueue = flipped;
			this._animIndex = 0;
			this._animWait = 5;
			this._gamePhase = 'animate';
			this.refreshBoard();
		}

		updateAnimation() {
			if (this._animWait > 0) {
				this._animWait--;
				return;
			}

			if (this._animIndex < this._animQueue.length) {
				if (this._animIndex > 0) {
					AudioManager.playSe({ name: reverseSe, volume: 90, pitch: 120 + Math.randomInt(30), pan: 0 });
				}
				this._animIndex++;
				this._animWait = 5;
			} else {
				this._gamePhase = 'wait';
				setTimeout(() => this.changeTurn(), 300);
			}
		}

		// ========================================
		// ゲーム終了
		// ========================================
		endGame() {
			if (this._gamePhase === 'end') return;
			this._gamePhase = 'end';

			const counts = this._board.countStones();
			const pCount = (this._playerColor === BLACK) ? counts.black : counts.white;
			const cCount = (this._playerColor === BLACK) ? counts.white : counts.black;

			let resultMsg = "";
			let isWin = false;
			let resultVal = 0;

			if (pCount > cCount) {
				resultMsg = `VICTORY!  ${pCount} - ${cCount}`;
				isWin = true;
				resultVal = 1;
				AudioManager.playMe({ name: winMe, volume: 90, pitch: 100, pan: 0 });
			} else if (pCount < cCount) {
				resultMsg = `DEFEAT...  ${pCount} - ${cCount}`;
				resultVal = 0;
				AudioManager.playMe({ name: loseMe, volume: 90, pitch: 100, pan: 0 });
			} else {
				resultMsg = `DRAW  ${pCount} - ${cCount}`;
				resultVal = 2;
				AudioManager.playMe({ name: loseMe, volume: 90, pitch: 100, pan: 0 });
			}

			this._messageWindow.contents.clear();
			this._messageWindow.drawText(resultMsg, 0, 10, this._messageWindow.innerWidth, 'center');

			if (resultVariable > 0) {
				$gameVariables.setValue(resultVariable, resultVal);
			}
			if (isWin && winCountVariable > 0) {
				$gameVariables.setValue(winCountVariable, $gameVariables.value(winCountVariable) + 1);
			}
		}
	}

	window.Scene_ReversiGame = Scene_ReversiGame;

})();
