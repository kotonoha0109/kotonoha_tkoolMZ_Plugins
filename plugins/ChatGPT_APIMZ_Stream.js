// --------------------------------------------------------------------------
// 
// ChatGPT_APIMZ_Stream.js
//
// Copyright (c) kotonoha*
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//
// 2023/04/13 ver1.0β プラグイン公開
// 
// --------------------------------------------------------------------------
/*:
 * @target MZ
 * @plugindesc ChatGPT APIと通信し、AIに台詞を作成してもらうプラグイン（Stream版）
 * 「ChatGPT_APIMZ.js」と違って、待ち時間無しで回答がリアルタイムで出力されます。
 * 
 * @author kotonoha*
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
 * @param SystemMessage
 * @type string
 * @default Please answer in Japanese.
 * @desc AIへの共通の指示（「日本語で書いて」とか「120文字以内でまとめて」とか）
 *
 * @command chat
 * @text Send Chat Message
 * @desc APIに問い合わせるコマンド
 *
 * @arg message
 * @type string
 * @desc APIに送信するメッセージの内容.
 *
 * @help ChatGPT APIと通信して、AIに台詞を作成してもらうプラグインです。
 * 独自のAPIキーをセットする必要があります。
 *
 * 【注意】
 * APIキーは必ずゲームプレイヤーが所有する物を使用する様にしてください！
 * 作品に登録したまま公開すると、作者のAPIキーが漏洩します！
 * APIキーの漏洩や利用料金に関するトラブルは自己責任です！
 * 
 * 【基本的な使い方】
 * (1) OpenAI APIキーを取得し、パラメータChatGPT_APIkeyにセットしてください。
 * (2) プレイヤーの質問を一時的に変数に入れます。空いている変数IDをパラメータUserMessageVarIdにセットしてください。
 * (3) AIに台詞を作ってもらいたいイベントに、プラグインコマンドで「ChatGPT_APIMZ」を選び、Messageにキャラクターの設定を登録してください。
 * 
 * 【Message 登録例】
 * 子供の台詞の例：元気な子供口調で回答。この町がアーリアの町である事を教えてくれる。
 * 老人の台詞の例：老人口調で回答。一人称はワシ。魔王ベルザードに恐怖を感じている。
 * ベルザードはローゼ大陸を支配するため四天王の一人カルシファーを送り込んだという情報を提供
 * 
 */

(() => {

    const pluginParameters = PluginManager.parameters('ChatGPT_APIMZ_Stream');
    const userMessageVarId = Number(pluginParameters['UserMessageVarId']) || 1;
    const systemMessage = String(pluginParameters['SystemMessage']) || "Please answer in Japanese.";

    let messageHistory = [];

    PluginManager.registerCommand("ChatGPT_APIMZ_Stream", "chat", async (args) => {

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
        const userMessage = String(args.message);
        $gameVariables.setValue(userMessageVarId, userMessage);
        messageHistory.push({ role: 'system', content: systemMessage });
        messageHistory.push({ role: 'user', content: userMessage });

        (async () => {

			// 待機中、移動禁止・メニュー開閉禁止
			const originalCanMove = Game_Player.prototype.canMove;
			const originalIsMenuEnabled = Game_System.prototype.isMenuEnabled;
            Game_Player.prototype.canMove = function () { return false; };
            Game_System.prototype.isMenuEnabled = function () { return false; };

            const event = $gameMap.event($gameMap._interpreter.eventId());
            event.setDirectionFix(true);

			// 待機中、イベントの動きを制限
            const originalUpdateStop = Game_CharacterBase.prototype.updateStop;
            Game_CharacterBase.prototype.updateStop = function () {
                if ($gameMap._interpreter._waitMode === "chatGPT" || ($gameMessage && $gameMessage.isBusy())) {
                    if (this === $gameMap.event($gameMap._interpreter.eventId())) {
                        this.setDirectionFix(true);
                    }
                    return;
                }
                this.setDirectionFix(false);
                originalUpdateStop.call(this);
            };

			// ChatGPT APIとの通信
            const url = 'https://api.openai.com/v1/chat/completions';

            try {
				const response = await fetch(url, {
				    method: 'POST',
				    headers: {
				        'Content-Type': 'application/json',
				        'Authorization': 'Bearer ' + getChatGPT_APIkey(),
				    },
				    body: JSON.stringify({
				        model: 'gpt-3.5-turbo', // モデルの選択
				        stream: true,
				        temperature: 0.9, // 温度
				        max_tokens: 120, // トークン
				        messages: messageHistory,
				    }),
				});

                if (!response.ok) {
                    const errorText = await response.text();
				    const errorJson = JSON.parse(errorText);
				    const errorMessage = insertNewLines(errorJson.error.message,60);
				    // APIからのメッセージを出力
				    console.error('Error:', errorMessage);
				    $gameMessage.add(errorMessage);
				    
				    // イベント再開
                    Game_Player.prototype.canMove = originalCanMove;
                    Game_System.prototype.isMenuEnabled = originalIsMenuEnabled;
                    event.setDirectionFix(false);
                    return;
                }

				// イベント実行時にストリーミングウィンドウを表示する
				const streamingTextElement = document.getElementById('streamingText');
				streamingTextElement.style.display = 'block';
				streamingTextElement.innerHTML = '';

				const reader = response.body.getReader();
				const textDecoder = new TextDecoder();
				let buffer = '';

			while (true) {
			    const { value, done } = await reader.read();

			    if (done) {
			      break;
			    }

			    buffer += textDecoder.decode(value, { stream: true });

			    while (true) {
			      const newlineIndex = buffer.indexOf('\n');
			      if (newlineIndex === -1) {
			        break;
			      }

			      const line = buffer.slice(0, newlineIndex);
			      buffer = buffer.slice(newlineIndex + 1);

			      if (line.startsWith('data:')) {

			        if (line.includes('[DONE]')) {
						//streamingTextElement.innerHTML += '<br><br>';
						// イベント再開
						Game_Player.prototype.canMove = originalCanMove;
						Game_System.prototype.isMenuEnabled = originalIsMenuEnabled;
						event.setDirectionFix(false);
						return;
			        }

			        const jsonData = JSON.parse(line.slice(5));

					// ストリーミングテキストの表示
			        if (jsonData.choices && jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
						let assistantMessage = jsonData.choices[0].delta.content;
						// カギ括弧除去※除去不要ならコメントアウト
						assistantMessage = assistantMessage.replace(/\「|」/g, "");
						// 改行を<br>に変換
						assistantMessage = assistantMessage.replace(/\n/g, "<br>");
						streamingTextElement.innerHTML += assistantMessage;
			        }
			        
			      }
			    }
			  }

            } catch (error) {
            	
                console.error('Error:', error);
                
                // イベント再開
                Game_Player.prototype.canMove = originalCanMove;
                Game_System.prototype.isMenuEnabled = originalIsMenuEnabled;
                event.setDirectionFix(false);
                $gameMap._interpreter.setWaitMode(null);

            }

        })();

    });

	// メッセージウィンドウ表示中はbusy状態にする
	const _Scene_Map_create = Scene_Map.prototype.create;
	Scene_Map.prototype.create = function () {
	    _Scene_Map_create.call(this);
	};

	const _Scene_Map_update = Scene_Map.prototype.update;
	Scene_Map.prototype.update = function () {
	    _Scene_Map_update.call(this);
	    if (Input.isTriggered("ok") && streamingTextElement && streamingTextElement.style.display !== "none") {
	        streamingTextElement.style.display = 'none';
	    }
	};

	const _Game_Map_isEventRunning = Game_Map.prototype.isEventRunning;
	Game_Map.prototype.isEventRunning = function() {
	    const isElementVisible = streamingTextElement && streamingTextElement.style.display !== "none";
	    return _Game_Map_isEventRunning.call(this) || isElementVisible;
	};

	// ストリーミングウィンドウ整形
	function createStreamingTextElement() {
		const windowHeight = window.innerHeight;
		const streamingTextHeight = 200;
		streamingTextElement = document.createElement('div');
		streamingTextElement.id = 'streamingText';
		streamingTextElement.style.display = 'none';
		streamingTextElement.style.position = 'fixed';
		streamingTextElement.style.zIndex = 100;
		streamingTextElement.style.left = '0';
		streamingTextElement.style.width = '800px';
		streamingTextElement.style.top = `${windowHeight - streamingTextHeight - 16}px`;
		streamingTextElement.style.boxSizing = 'border-box';
		streamingTextElement.style.height = '200px';
		streamingTextElement.style.color = 'white';
		streamingTextElement.style.fontSize = '22px';
		streamingTextElement.style.padding = '16px';
		streamingTextElement.style.overflowY = 'hidden';
		streamingTextElement.style.background = 'linear-gradient(to bottom, #0f1c45, #083b70)';
		streamingTextElement.style.margin = '0 8px';
		streamingTextElement.style.borderWidth = '2px';
		streamingTextElement.style.borderStyle = 'solid';
		streamingTextElement.style.borderColor = 'white';
		streamingTextElement.style.borderRadius = '5px';
		document.body.appendChild(streamingTextElement);
	}
	createStreamingTextElement();

})();