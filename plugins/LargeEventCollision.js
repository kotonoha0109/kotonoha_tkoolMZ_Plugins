/*:
 * @target MZ
 * @plugindesc 大型イベントの壁めり込み防止
 * @author kotonoha*
 * @url https://aokikotori.com/
 *
 * @param activeSwitchId
 * @text 有効化スイッチID
 * @desc このスイッチがONの時だけプラグインが動作する（0で常時有効）
 * @type switch
 * @default 610
 *
 * @param eventSettings
 * @text 対象イベント設定
 * @desc 大型当たり判定を適用するイベントの設定
 * @type struct<EventSetting>[]
 * @default []
 *
 * @help LargeEventCollision.js
 *
 * ■ 概要
 * グラフィックが1タイルより大きいイベントが壁にめり込むのを防ぎます。
 * 通常、RPGツクールMZではイベントの当たり判定は1タイルですが、
 * このプラグインは移動時にグラフィックがカバーする周囲タイルも
 * 通行可能かチェックし、壁への接触を防ぎます。
 *
 * ■ 使い方
 * 1. プラグインパラメータで対象のイベントIDを設定
 * 2. グラフィックサイズに合わせて上・左・右の拡張タイル数を設定
 *    （例：2×2タイルのキャラなら上方向1、左右はそれぞれ0〜1）
 * 3. イベントの自律移動はそのまま「ランダム」等でOK
 *
 * ■ 拡張タイル数の目安
 * 2×2タイルのキャラ → 上:1, 左:0, 右:1（または左:1, 右:0）
 * 3×3タイルのキャラ → 上:2, 左:1, 右:1
 *
 * ■ イベントのメモ欄での指定
 * プラグインパラメータの代わりに、イベントのメモ欄に記述することもできます。
 * <LargeCollision:上,左,右>
 * 例：<LargeCollision:1,0,1>
 *
 * ■ 有効化スイッチ
 * 指定したスイッチがONの時だけ動作します。
 * ランダムダンジョン中だけ有効にしたい場合は、
 * ダンジョン中スイッチのID（例：610）を設定してください。
 * 0にすると常時有効になります。
 *
 * ■ 注意
 * - RandomDungeon.js等と併用可能です
 * - このプラグインは移動判定のみ変更し、表示には影響しません
 *
 * ■ ライセンス
 * このプラグインはMITライセンスです。
 */

/*~struct~EventSetting:
 * @param eventId
 * @text イベントID
 * @desc 対象のイベントID
 * @type number
 * @default 5
 *
 * @param extendUp
 * @text 上方向の拡張タイル数
 * @desc グラフィックが上方向にはみ出すタイル数
 * @type number
 * @default 1
 *
 * @param extendLeft
 * @text 左方向の拡張タイル数
 * @desc グラフィックが左方向にはみ出すタイル数
 * @type number
 * @default 0
 *
 * @param extendRight
 * @text 右方向の拡張タイル数
 * @desc グラフィックが右方向にはみ出すタイル数
 * @type number
 * @default 1
 */

(() => {
	'use strict';

	const pluginName = 'LargeEventCollision';
	const parameters = PluginManager.parameters(pluginName);

	const pActiveSwitchId = Number(parameters['activeSwitchId'] || 0);

	// プラグインパラメータからイベント設定を読み込み
	let eventSettings = [];
	try {
		const rawSettings = JSON.parse(parameters['eventSettings'] || '[]');
		eventSettings = rawSettings.map(raw => {
			const s = JSON.parse(raw);
			return {
				eventId: Number(s.eventId || 5),
				extendUp: Number(s.extendUp || 1),
				extendLeft: Number(s.extendLeft || 0),
				extendRight: Number(s.extendRight || 1)
			};
		});
	} catch (e) {
		// パース失敗時はデフォルト値を使用
	}

	// イベントIDから設定を取得
	function getSettingForEvent(event) {
		if (!event || !event.eventId) return null;

		// まずメモ欄をチェック
		const eventData = event.event ? event.event() : null;
		if (eventData && eventData.note) {
			const match = eventData.note.match(/<LargeCollision:\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*>/i);
			if (match) {
				return {
					extendUp: Number(match[1]),
					extendLeft: Number(match[2]),
					extendRight: Number(match[3])
				};
			}
		}

		// プラグインパラメータから検索
		const id = event.eventId();
		return eventSettings.find(s => s.eventId === id) || null;
	}

	// 指定座標が通行可能かチェック（マップ範囲外も不可とする）
	function isTilePassableForLarge(x, y) {
		// マップ範囲外はNG
		if (x < 0 || y < 0 || x >= $gameMap.width() || y >= $gameMap.height()) {
			return false;
		}
		// 全方向からの通行可能性をチェック（いずれかの方向で通行可能ならOK）
		return $gameMap.isPassable(x, y, 2) || $gameMap.isPassable(x, y, 4) ||
		       $gameMap.isPassable(x, y, 6) || $gameMap.isPassable(x, y, 8);
	}

	// 大型イベントの移動先通行チェック
	function canPassLarge(event, x, y, d, setting) {
		// 移動先の座標を計算
		const destX = $gameMap.roundXWithDirection(x, d);
		const destY = $gameMap.roundYWithDirection(y, d);

		// グラフィックがカバーする全タイルをチェック
		for (let dy = 0; dy <= setting.extendUp; dy++) {
			for (let dx = -setting.extendLeft; dx <= setting.extendRight; dx++) {
				const checkX = destX + dx;
				const checkY = destY - dy;
				if (!isTilePassableForLarge(checkX, checkY)) {
					return false;
				}
			}
		}
		return true;
	}

	// Game_Event の canPass をオーバーライド
	const _Game_Event_canPass = Game_Event.prototype.canPass;
	Game_Event.prototype.canPass = function(x, y, d) {
		// 有効化スイッチが指定されている場合、OFFなら通常処理
		if (pActiveSwitchId > 0 && !$gameSwitches.value(pActiveSwitchId)) {
			return _Game_Event_canPass.call(this, x, y, d);
		}
		const setting = getSettingForEvent(this);
		if (setting) {
			// まず通常の通行チェック（イベント同士の衝突等も含む）
			if (!_Game_Event_canPass.call(this, x, y, d)) {
				return false;
			}
			// 大型グラフィック用の追加チェック
			return canPassLarge(this, x, y, d, setting);
		}
		return _Game_Event_canPass.call(this, x, y, d);
	};

})();
