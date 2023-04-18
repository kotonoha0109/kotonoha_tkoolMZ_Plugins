// --------------------------------------------------------------------------
// 
// ChatGPT_APIMZ_Classic.js
//
// Copyright (c) kotonoha*
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//
// 2023/04/11 ver1.0 プラグイン公開
// 2023/04/12 ver1.1 仕様追加、修正
// 			－プラグインパラメータを追加しました。
// 			　1 AIへの共通の指示
// 			　2 改行する文字数設定
// 			　3 ウェイトウィンドウのオン・オフ
// 			－プラグインパラメータのAPIキーに変数IDを入力出来る様にしました。
// 			－APIキーからのエラーメッセージをメッセージウィンドウに表示する様にしました。
// 			－APIに送信するtemperatureの数値をやや上げました。
// 2023/04/14 ver1.2 仕様追加、修正
// 			－LineBreakLengthを0に設定した時、改行処理を行わない様にしました。
//			－ウェイトウィンドウがオフの時は、移動制限を無くしました。
// 2023/04/17 ver1.3 仕様追加、修正
//			－サーバーサイドで通信出来るオプションを追加しました。
//			－イベントごとに会話履歴を保存できる様になりました。
//			－messageHistoryを削除。変数の初期化に不備があったので修正しました。
// 			－会話後のイベントの動きを修正しました。
//			－AIからの回答に関連する値をプラグインコマンドで設定出来る様にしました。
//			－イベントごとの質問・回答を変数に保存出来る様にしました。
// 2023/04/18 ver1.4 調整。ChatGPT_APIMZ_Classic.jsとして公開
// 
// --------------------------------------------------------------------------
/*:
 * @target MZ
 * @plugindesc ChatGPT APIと通信し、AIに台詞を作成してもらうプラグイン
 * @author kotonoha*
 * @url https://github.com/kotonoha0109/kotonoha_tkoolMZ_Plugins/blob/main/plugins/ChatGPT_APIMZ_Classic.js
 *
 * @param ChatGPT_Model
 * @type string
 * @default gpt-3.5-turbo
 * @desc ChatGPTのAIモデル
 *
 * @param ChatGPT_URL
 * @type string
 * @default https://api.openai.com/v1/chat/completions
 * @desc ChatGPTのURL
 * サーバーサイドを利用する場合はそのファイルのURL
 *
 * @param ChatGPT_APIkey
 * @type string
 * @default sk-
 * @desc ChatGPTのAPIキー（数値だけの場合は変数ID、文字列の場合はAPIキー）
 * ※変数内にAPIキーを格納することが出来ます。
 *
 * @param UserMessageVarId
 * @type number
 * @default 1
 * @desc プレイヤーの質問を格納する変数ID
 *
 * @param AnswerMessageVarId
 * @type variable
 * @default 2
 * @desc AIからの回答を格納する変数ID
 *
 * @param MemoryMessageVarId
 * @type variable
 * @default 3
 * @desc 回答履歴を格納する変数ID
 *
 * @param VisibleSwitchID
 * @type switch
 * @default 
 * @desc 回答を非表示にするスイッチID
 * 回答を表示せず、変数に格納したいだけの時に。
 *
 * @param SystemMessage
 * @type multiline_string
 * @default Please answer in Japanese.
 * @desc AIへの共通の指示（「日本語で書いて」とか「120文字以内でまとめて」とか）
 *
 * @param ShowWaitingWindow
 * @type boolean
 * @default true
 * @desc ウェイトウィンドウの表示
 *
 * @param LineBreakLength
 * @type number
 * @default 30
 * @desc 何文字目で改行させるか
 * ※自動改行プラグインを使用している場合は0にして下さい。
 *
 * @command chat
 * @text Send Chat Message
 * @desc APIに問い合わせるコマンド
 *
 * @arg system
 * @type multiline_string
 * @default 
 * @desc このイベントへの指示
 * ※プラグインパラメータのSystemMessageに「追記」されます。
 *
 * @arg message
 * @type multiline_string
 * @default 
 * @desc このイベントへの質問　※CuatomQuestionMessageVarIdが0か、
 * 変数が空の時この質問が反映されます。
 *
 * @arg temperature
 * @type Number
 * @default 1
 * @desc サンプリング温度（0～1）
 * 値が低いほど関連性が高くなり、高いほど多様な単語を生成
 *
 * @arg top_p
 * @type Number
 * @default 0.9
 * @desc 文章の多様性（0～1）
 * 値が低いほど一貫性が向上し、高いほど文章が多様に
 *
 * @arg max_tokens
 * @type Number
 * @default 512
 * @desc AIが回答するトークンの最大数（gpt-3.5-turboは4096まで）
 * 日本語1文字＝2～3トークン程度
 *
 * @arg memory_talk
 * @type Number
 * @default 10
 * @desc 会話履歴の保存量
 * 会話内容をAIが記憶する数（1回の質問＋回答を 1 とする）
 *
 * @arg CuatomQuestionMessageVarId
 * @type variable
 * @default
 * @desc このイベントへの質問を格納する変数ID
 * 空の場合はプラグインパラメータの設定が使用されます。
 *
 * @arg CustomAnswerMessageVarId
 * @type variable
 * @default
 * @desc このイベントの回答を格納する変数ID
 * 空の場合はプラグインパラメータの設定が使用されます。
 *
 * @arg CustomMemoryMessageVarId
 * @type variable
 * @default
 * @desc このイベントの履歴保存を格納する変数ID
 *
 * @help ChatGPT APIと通信して、AIに台詞を作成してもらうプラグインです。
 * 独自のAPIキーをセットする必要があります。
 *
 * ※ AIからの回答まで、通信のタイムラグがあります。
 * リアルタイムに出力させたい場合は ChatGPT_APIMZ.js の方をご利用下さい。
 *
 * 【注意】
 * APIキーは必ずゲームプレイヤーが所有する物を使用する様にしてください！
 * 作品に登録したまま公開すると、作者のAPIキーが漏洩します！
 * APIキーの漏洩や利用料金に関するトラブルは自己責任です！
 * 
 * 【基本的な使い方】
 * (1) OpenAIで取得したAPIキーを、ChatGPT_APIkey にセットしてください。
 *
 * (2) 空き変数IDが最低3つ必要です。
 * ・プレイヤーの質問を一時的に変数に入れます。
 * 　空いている変数IDを UserMessageVarId にセットしてください。
 * ・AIからの回答を一時的に変数に入れます。
 * 　空いている変数IDを AnswerMessageVarId にセットしてください。
 * ・回答履歴を一時的に変数に入れます。
 * 　空いている変数IDを MemoryMessageVarId にセットしてください。
 *
 * (3) AIに台詞を作ってもらいたいイベントに、プラグインコマンドで
 * 「ChatGPT_APIMZ」を選び、キャラクターの設定を登録してください。
 * 
 * # system
 * イベントへの指示です。プラグインパラメータの SystemMessage に追記されますので、
 * このイベントには、それに補足したい指示を与えます。
 * たとえばパラメータ側に「日本語で回答して」と設定されている場合、
 * このイベントでは「ただし、カタカナで回答して」といった補足指示が可能です。
 *
 * # message
 * イベントへの質問です。AIに回答してもらいたい質問を入力します。
 * ただし、変数CuatomQuestionMessageVarId に質問を入力して使う場合は、
 * この項目は空にしてください。
 * 
 * # temperature, top_p
 * それぞれ、AIからの回答における多様性を決める数値です。
 * 0～1の数値を設定してください。
 * 
 * # max_tokens
 * 最大トークン数（日本語1文字＝2～3トークン程度）を設定します。
 * 文字数の上限を決められますが、レスポンスの文字数より最大トークン数が
 * 低い場合は、文章の途中で切れます。
 *
 * # memory_talk
 * 履歴保存の数です。数値分のやり取りを保存します。
 * 設定する数値が 5 ならば、直前5回分のやり取りを保存します。
 * 多ければ多いほど話題に沿った会話が可能ですが、
 * APIに履歴ごとトークンが送信されるため、利用料金が高くなる事があります。
 * 保存が必要無いなら 0 を設定します。
 *
 * # CuatomQuestionMessageVarId
 * イベントへの質問が入力されている変数IDです。
 * 名前入力ウィンドウやチャットウィンドウでの質問入力などで、
 * 変数内に質問が保存されている場合、その変数IDを指定してください。
 * ※この変数とmessageが同時に設定されている時は、messageが優先されます。
 * ※プラグインパラメータの UserMessageVarId とは別です。
 *
 * # CustomAnswerMessageVarId
 * このイベントの回答が格納されている変数IDです。
 * プラグインパラメータの AnswerMessageVarId に保存されますが、
 * イベントごとに回答を個別に記録したい場合、この変数IDを指定してください。
 *
 * # CustomMemoryMessageVarId
 * このイベントの履歴が保存されている変数IDです。
 * APIに通信するための配列としてが記録されていますので、
 * 直接的なコールは出来ません。
 * 履歴を手動で削除したい場合はこの変数IDの変数を空にしてください。
 * 
 * 【サーバーサイドとの連携】
 * サーバー上にPHPやPython等のファイルを設置し、
 * APIキーなど、ChatGPTへのリクエストヘッダをシークレットにする事が出来ます。
 *
 * ▼PHPサンプルはこちら
 * https://github.com/kotonoha0109/kotonoha_tkoolMZ_Plugins/blob/main/plugins/php/request_classic.php
 * 
 * PHPファイルにAPIキーを設定し、サーバにアップ後、
 * プラグインパラメータのChatGPT_URLをPHPファイルのURLにしてください。
 * プラグインパラメータのChatGPT_APIkeyは不要です。必ず削除願います。
 *
 */

(() => {

	const pluginParameters = PluginManager.parameters('ChatGPT_APIMZ_Classic');
	const userMessageVarId = Number(pluginParameters['UserMessageVarId']) || 1;
	const answerMessageVarId = Number(pluginParameters['AnswerMessageVarId']) || 2;
	const memoryMessageVarId = Number(pluginParameters['MemoryMessageVarId']) || 3;
	const visibleSwitchID = Number(pluginParameters['VisibleSwitchID']) || null;

	const systemMessage = String(pluginParameters['SystemMessage']) || "Please answer in Japanese.";
	const showWaitingWindow = pluginParameters['ShowWaitingWindow'].toLowerCase() === 'true';
	const lineBreakLength = (pluginParameters['LineBreakLength'] !== undefined && pluginParameters['LineBreakLength'] !== null) ? Number(pluginParameters['LineBreakLength']) : 30;

	let previousMessage = null;

	PluginManager.registerCommand("ChatGPT_APIMZ_Classic", "chat", async (args) => {

		const customMemoryMessageVarId = Number(args.CustomMemoryMessageVarId) || memoryMessageVarId;
		let customMemoryMessage = $gameVariables.value(customMemoryMessageVarId);

		function getChatGPT_APIkey() {
			const APIKey = String(pluginParameters['ChatGPT_APIkey']) || 'sk-';
			const apiKeyVarId = parseInt(APIKey, 10);

			if (Number.isInteger(apiKeyVarId) && $gameVariables && $gameVariables.value(apiKeyVarId)) {
				return $gameVariables.value(apiKeyVarId);
			} else {
				return APIKey;
			}
		}

		// 変数に質問文を格納
		const temperature = Number(args.temperature) || 1;
		const top_p = Number(args.top_p) || 0.9;
		const max_tokens = Number(args.max_tokens) || 512;
		const customQuestionMessageVarId = Number(args.CuatomQuestionMessageVarId) || null;
		const customAnswerMessageVarId = Number(args.CustomAnswerMessageVarId) || null;

		let targetVarId = customQuestionMessageVarId !== null ? customQuestionMessageVarId : 0;
		let variableValue = $gameVariables.value(targetVarId);
		let userMessage;

		// 変数IDが未定義の場合は、質問にmessageを反映する
		if (targetVarId !== 0 && !variableValue) {
			if (!args.message || args.message === '') { return; }
			userMessage = args.message;
		} else if (targetVarId === 0 && (!args.message || args.message === '')) {
			return;
		} else {
			userMessage = variableValue ? variableValue : args.message;
		}

		$gameVariables.setValue(targetVarId, userMessage);

		if (userMessageVarId !== null) {
			$gameVariables.setValue(userMessageVarId, userMessage);
		}

		// memory_talk使わない
		if (Number(args.CustomMemoryMessageVarId) === 0) {
			$gameVariables.setValue(memoryMessageVarId, []);
			previousMessage = "";
			customMemoryMessage = [];
			customMemoryMessage.push({ role: 'system', content: systemMessage + (args.system || "") });
			customMemoryMessage.push({ role: 'user', content: userMessage });
			$gameVariables.setValue(memoryMessageVarId, customMemoryMessage);
		} else {

			// memory_talk使う
			if (!Array.isArray(customMemoryMessage)) {
				customMemoryMessage = [];
				previousMessage = "";
				customMemoryMessage.push({ role: 'system', content: systemMessage + (args.system || "") });
				customMemoryMessage.push({ role: 'user', content: userMessage });
				$gameVariables.setValue(customMemoryMessageVarId, customMemoryMessage);
			}

			// 再質問生成
			const memoryTalk = Number(args.memory_talk) * 2 || 1;

			if (memoryTalk >= 2) {
				if (previousMessage) {
					customMemoryMessage.push({ role: 'assistant', content: previousMessage });
					customMemoryMessage.push({ role: 'user', content: userMessage });
					while (customMemoryMessage.length > memoryTalk) {
						customMemoryMessage.shift();
					}
				}
			}

		}

		$gameVariables.setValue(customMemoryMessageVarId, customMemoryMessage);
		console.log(customMemoryMessage);

		(async () => {

			const ChatGPT_Model = String(pluginParameters['ChatGPT_Model']) || 'gpt-3.5-turbo';
			const ChatGPT_URL = String(pluginParameters['ChatGPT_URL']) || 'https://api.openai.com/v1/chat/completions';

			// ウェイトウィンドウの作成
			const originalCanMove = Game_Player.prototype.canMove;
			const originalIsMenuEnabled = Game_System.prototype.isMenuEnabled;
			const event = $gameMap.event($gameMap._interpreter.eventId());

			let waitingWindow;
			if (showWaitingWindow) {

				// 待機中、移動禁止・メニュー開閉禁止
				Game_Player.prototype.canMove = function () { return false; };
				Game_System.prototype.isMenuEnabled = function () { return false; };

				event.setDirectionFix(true);

				// 待機中、イベントの動きを制限
				currentEvent = event;
				event.setDirectionFix(true);
				event._originalMoveType = event._moveType;
				event._moveType = 0;

				const messageWindow = SceneManager._scene._messageWindow;
				const offsetX = 4;
				const offsetY = 4;
				waitingWindow = new Window_Base(new Rectangle(messageWindow.x + offsetX, Graphics.height - messageWindow.height - offsetY, messageWindow.width, messageWindow.height));

				// ウェイトメッセージ
				waitingWindow.drawText('・・・', 0, 0);
				SceneManager._scene.addChild(waitingWindow);
				const waitMessages = ['・・・', '・・・・・・', '・・・・・・・・・'];
				let waitIndex = 0;

				$gameMap._interpreter.setWaitMode("chatGPT");
				event.setDirectionFix(true);

				intervalId = setInterval(() => {
					waitingWindow.contents.clear();
					waitingWindow.drawText(waitMessages[waitIndex], 0, 0);
					waitIndex = (waitIndex + 1) % waitMessages.length;
				}, 300);

			}

			// ChatGPT APIとの通信
			const url = ChatGPT_URL;

			try {
				const response = await fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' + getChatGPT_APIkey(),
					},
					body: JSON.stringify({
						model: ChatGPT_Model,
						temperature: temperature,
						top_p: top_p,
						max_tokens: max_tokens,
						messages: customMemoryMessage,
					}),
				});

				if (!response.ok) {
					const errorText = await response.text();
					const errorJson = JSON.parse(errorText);
					const errorMessage = insertNewLines(errorJson.error.code, 60);
					// APIからのメッセージを出力
					console.error('Error:', errorMessage);
					$gameMessage.add(errorMessage);
					if (showWaitingWindow) {
						clearInterval(intervalId);
						SceneManager._scene.removeChild(waitingWindow);
						Game_Player.prototype.canMove = originalCanMove;
						Game_System.prototype.isMenuEnabled = originalIsMenuEnabled;
						$gameMap._interpreter.setWaitMode("");
						if (typeof currentEvent !== 'undefined' && currentEvent) {
							currentEvent.setDirectionFix(false);
							currentEvent._moveType = currentEvent._originalMoveType;
							currentEvent = null;
						}
					}
					return;
				}

				const jsonData = await response.json();

				if (jsonData.choices && jsonData.choices[0].message.content) {
					if (showWaitingWindow) {
						clearInterval(intervalId);
						SceneManager._scene.removeChild(waitingWindow);
					}
					let newMessage = jsonData.choices[0].message.content;

					// カギ括弧除去※除去不要ならコメントアウト
					newMessage = newMessage.replace(/\「|」/g, "");
					// 改行処理
					if (lineBreakLength > 0) { newMessage = insertNewLines(newMessage, lineBreakLength); }

					if (newMessage) {
						if ($gameSwitches.value(visibleSwitchID) !== true) {
							$gameMessage.add(newMessage);
						}
					}
					previousMessage = newMessage;

					//console.log(messageHistory);
					let targetAnswerVarId = customAnswerMessageVarId !== null ? customAnswerMessageVarId : answerMessageVarId;
					$gameVariables.setValue(targetAnswerVarId, newMessage);

					// ウェイトウィンドウがある時は行動制限解除
					if (showWaitingWindow) {
						Game_Player.prototype.canMove = originalCanMove;
						Game_System.prototype.isMenuEnabled = originalIsMenuEnabled;
						$gameMap._interpreter.setWaitMode("");
					}
				}

			} catch (error) {

				console.error('Error:', error);
				$gameMessage.add(error);
				if (showWaitingWindow) {
					clearInterval(intervalId);
					SceneManager._scene.removeChild(waitingWindow);
					Game_Player.prototype.canMove = originalCanMove;
					Game_System.prototype.isMenuEnabled = originalIsMenuEnabled;
					$gameMap._interpreter.setWaitMode("");
					if (typeof currentEvent !== 'undefined' && currentEvent) {
						currentEvent.setDirectionFix(false);
						currentEvent._moveType = currentEvent._originalMoveType;
						currentEvent = null;
					}
				}
				return;

			}

		})();

		function insertNewLines(text, maxLength) {
			const lines = [];
			let index = 0;
			while (index < text.length) {
				lines.push(text.slice(index, index + maxLength));
				index += maxLength;
			}
			return lines.join('\n');
		}

	});

	// メッセージウィンドウが閉じられたらイベントの動きを再開する
	const _Scene_Map_update = Scene_Map.prototype.update;
	Scene_Map.prototype.update = function () {
		_Scene_Map_update.call(this);
		const messageWindow = this._messageWindow;
		if (messageWindow && messageWindow.isClosing()) {
			if (typeof currentEvent !== 'undefined' && currentEvent) {
				currentEvent.setDirectionFix(false);
				currentEvent._moveType = currentEvent._originalMoveType;
				currentEvent = null;
			}
		}
	};

})();