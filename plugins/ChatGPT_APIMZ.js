// --------------------------------------------------------------------------
// 
// ChatGPT_APIMZ.js
//
// Copyright (c) kotonoha*
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//
// 2023/04/11 ver1.0 プラグイン公開
// 2023/04/12 ver1.1 仕様追加、修正
// －プラグインパラメータを追加しました。
// 　1 AIへの共通の指示
// 　2 改行する文字数設定
// 　3 ウェイトウィンドウのオン・オフ
// －プラグインパラメータのAPIキーに変数IDを入力出来る様にしました。
// －APIキーからのエラーメッセージをメッセージウィンドウに表示する様にしました。
// －APIに送信するtemperatureの数値をやや上げました。
// 
// --------------------------------------------------------------------------
/*:
 * @target MZ
 * @plugindesc ChatGPT APIと通信し、AIに台詞を作成してもらうプラグイン
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
 * @param ShowWaitingWindow
 * @type boolean
 * @default true
 * @desc ウェイトウィンドウの表示
 *
 * @param LineBreakLength
 * @type number
 * @default 30
 * @desc 何文字目で改行させるか
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

    const pluginParameters = PluginManager.parameters('ChatGPT_APIMZ');
    const userMessageVarId = Number(pluginParameters['UserMessageVarId']) || 1;
    const systemMessage = String(pluginParameters['SystemMessage']) || "Please answer in Japanese.";
    const showWaitingWindow = pluginParameters['ShowWaitingWindow'].toLowerCase() === 'true';
    const lineBreakLength = Number(pluginParameters['LineBreakLength']) || 30;

    let messageHistory = [];

    PluginManager.registerCommand("ChatGPT_APIMZ", "chat", async (args) => {

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

            const originalCanMove = Game_Player.prototype.canMove;
            const originalIsMenuEnabled = Game_System.prototype.isMenuEnabled;

	    // 待機中、移動禁止・メニュー開閉禁止
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
			

	    // ウェイトウィンドウの作成
            let waitingWindow;
            if (showWaitingWindow) {
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
            } else {
                $gameMap._interpreter.setWaitMode("chatGPT");
                event.setDirectionFix(true);
            }
            
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
                    if (showWaitingWindow) {
                        clearInterval(intervalId);
                        SceneManager._scene.removeChild(waitingWindow);
                    }
                    Game_Player.prototype.canMove = originalCanMove;
                    Game_System.prototype.isMenuEnabled = originalIsMenuEnabled;
                    $gameMap._interpreter.setWaitMode("");
                    event.setDirectionFix(false);
                    return;
                }

                const jsonData = await response.json();

                if (jsonData.choices && jsonData.choices[0].message.content) {
                    if (showWaitingWindow) {
                        clearInterval(intervalId);
                        SceneManager._scene.removeChild(waitingWindow);
                    }
                    let Message = jsonData.choices[0].message.content;

		    // カギ括弧除去※除去不要ならコメントアウト
                    Message = Message.replace(/\「|」/g, "");
                    
		    // 改行処理
                    Message = insertNewLines(Message, lineBreakLength);

                    if (Message) { $gameMessage.add(Message); }

                    Game_Player.prototype.canMove = originalCanMove;
                    Game_System.prototype.isMenuEnabled = originalIsMenuEnabled;

                    $gameMap._interpreter.setWaitMode("");
                    event.setDirectionFix(false);
                }

            } catch (error) {
            	
                console.error('Error:', error);
                //$gameMessage.add(error);
                if (showWaitingWindow) {
                    clearInterval(intervalId);
                    SceneManager._scene.removeChild(waitingWindow);
                }
                Game_Player.prototype.canMove = originalCanMove;
                Game_System.prototype.isMenuEnabled = originalIsMenuEnabled;
                $gameMap._interpreter.setWaitMode("");
                event.setDirectionFix(false);
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
})();
