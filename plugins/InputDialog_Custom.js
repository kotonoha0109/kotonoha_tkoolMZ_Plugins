// --------------------------------------------------------------------------
// 
// InputDialog_Custom.js ver1.04
//
// Copyright (c) kotonoha*（https://aokikotori.com/）
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//
// 2023/04/27 ver1.0 公開
// 2023/04/28 ver1.01 仕様追加
//             ープラグインパラメータに余分な設定があったので削除
//             ーカーソルキーでの移動を有効化
//             ーウェイトに関する記述をヘルプに追記
// 2023/04/29 ver1.02 仕様追加
//             ー最大文字数を指定できる様に変更
//             ー余分なコードを削除
// 2023/04/29 ver1.03 仕様追加
//             ーフォントファイルを指定できる様に変更
// 2023/05/01 ver1.03b 仕様修正
//             ーフォントのロードが重複していたのでコメントアウト
// 2023/05/05 ver1.04 仕様修正
//             ーウィンドウ出力中の待機処理を改善
// 
// --------------------------------------------------------------------------
/*:
 * @target MZ
 * @plugindesc ゲーム内に文字入力ウィンドウを配置するプラグイン
 * オリジナルの入力ウィンドウを作成出来ます。
 *
 * @param fontFileName
 * @text フォントファイル名
 * @desc 使用するフォントのファイル名を指定します。
 * 拡張子まで入れてください。
 * @type string
 * @default 
 * 
 * @param formWidth
 * @text フォームの幅
 * @desc フォームの幅を指定します。
 * @default 400px
 * 
 * @param formHeight
 * @text フォームの高さ
 * @desc フォームの高さを指定します。
 * @default auto
 *
 * @param formBackgroundColor
 * @text フォームの背景色
 * @desc フォームの背景色を指定します。
 * @default rgba(0, 0, 0, 0.5)
 *
 * @param formBorder
 * @text フォームのボーダー情報
 * @desc フォームのボーダー情報を指定します。
 * @default 3px solid #fff
 *
 * @param formBorderRadius
 * @text フォームのボーダー半径
 * @desc フォームのボーダー半径を指定します。
 * @default 5px
 *
 * @param formPadding
 * @text フォームのパディング
 * @desc フォームのパディングを指定します。
 * @default 30px
 *
 * @param labelTextColor
 * @text 表示テキストの文字色
 * @desc 表示テキストの文字色を指定します。
 * @default #FFFFFF
 * 
 * @param labelTextFontSize
 * @text 表示テキストの文字サイズ
 * @desc 表示テキストの文字サイズを指定します。
 * @default 18px
 *
 * @param labelTextMarginBottom
 * @text 表示テキストの下のマージン
 * @desc 表示テキストの下のマージンを指定します。
 * @default 10px
 *
 * @param inputWidth
 * @text テキストフォームの幅
 * @desc テキストフォームの幅を指定します。
 * @default 100%
 *
 * @param inputHeight
 * @text テキストフォームの高さ
 * @desc テキストフォームの高さを指定します。
 * @default 40px
 * 
 * @param inputFontSize
 * @text テキストフォームの文字サイズ
 * @desc テキストフォームの文字サイズを指定します。
 * @default 18px
 * 
 * @param inputColor
 * @text テキストフォームの文字色
 * @desc テキストフォームの文字色を指定します。
 * @default #FFFFFF
 *  
 * @param inputBackgroundColor
 * @text テキストフォームの背景色
 * @desc テキストフォームの背景色を指定します。
 * @default rgba(0, 0, 0, 0.5)
 * 
 * @param inputBorder
 * @text テキストフォームのボーダー情報
 * @desc テキストフォームのボーダーを指定します。
 * @default 1px solid #fff
 * 
 * @param inputBorderRadius
 * @text テキストフォームのボーダー半径
 * @desc テキストフォームのボーダー半径を指定します。
 * @default 5px
 *
 * @param inputPadding
 * @text テキストフォームのパディング
 * @desc テキストフォームのパディングを指定します。
 * @default 5px
 * 
 * @param inputFontSize
 * @text テキストフォームのフォントサイズ
 * @desc テキストフォームのフォントサイズを指定します。
 * @default 18px
 *
 * @param buttonContainerWidth
 * @text ボタンコンテナの幅
 * @desc ボタンコンテナの幅を指定します。
 * @default 100%
 * 
 * @param buttonContainerMargin
 * @text ボタンコンテナのマージン
 * @desc ボタンコンテナのマージンを指定します。
 * @default 15px 0 0 0
 * 
 * @param okButtonWidth
 * @text OKボタンの幅
 * @desc OKボタンの幅を指定します。
 * @default 120px
 * 
 * @param okButtonHeight
 * @text OKボタンの高さ
 * @desc OKボタンの高さを指定します。
 * @default 40px
 * 
 * @param okButtonFontSize
 * @text OKボタンの文字サイズ
 * @desc OKボタンの文字サイズを指定します。
 * @default 18px
 * 
 * @param okButtonColor
 * @text OKボタンの文字色
 * @desc OKボタンの文字色を指定します。
 * @default #FFFFFF
 * 
 * @param okButtonBackgroundColor
 * @text OKボタンの背景色
 * @desc OKボタンの背景色を指定します。
 * @default rgba(0, 0, 0, 0.5)
 * 
 * @param okButtonBorder
 * @text OKボタンのボーダー情報
 * @desc OKボタンのボーダーを指定します。
 * @default 1px solid #fff
 *
 * @param okButtonBorderRadius
 * @text OKボタンのボーダー半径
 * @desc OKボタンのボーダー半径を指定します。
 * @default 5px
 *
 * @param okButtonPadding
 * @text OKボタンのパディング
 * @desc OKボタンのパディングを指定します。
 * @default 5px 10px
 * 
 * @param cancelButtonWidth
 * @text キャンセルボタンの幅
 * @desc キャンセルボタンの幅を指定します。
 * @default 120px
 * 
 * @param cancelButtonHeight
 * @text キャンセルボタンの高さ
 * @desc キャンセルボタンの高さを指定します。
 * @default 40px
 *
 * @param cancelButtonFontSize
 * @text キャンセルボタン
 * @text キャンセルボタンの文字サイズ
 * @desc キャンセルボタンの文字サイズを指定します。
 * @default 18px
 * 
 * @param cancelButtonColor
 * @text キャンセルボタンの文字色
 * @desc キャンセルボタンの文字色を指定します。
 * @default #FFFFFF
 * 
 * @param cancelButtonBackgroundColor
 * @text キャンセルボタンの背景色
 * @desc キャンセルボタンの背景色を指定します。
 * @default rgba(0, 0, 0, 0.5)
 *
 * @param cancelButtonBorder
 * @text キャンセルボタンのボーダー情報
 * @desc キャンセルボタンのボーダー情報を指定します。
 * @default 1px solid #fff
 *
 * @param cancelButtonBorderRadius
 * @text キャンセルボタンのボーダー半径
 * @desc キャンセルボタンのボーダー半径を指定します。
 * @default 5px
 *
 * @param cancelButtonPadding
 * @text キャンセルボタンのパディング
 * @desc キャンセルボタンのパディングを指定します。
 * @default 5px 10px
 *
 * @param cancelButtonMarginLeft
 * @text キャンセルボタンの左マージン
 * @desc キャンセルボタンの左マージンを指定します。
 * @default 10px
 *
 * @command openDialog
 * @text テキスト入力を表示
 * @desc テキスト入力ウィンドウを表示します。
 *
 * @arg varId
 * @text 変数ID
 * @desc 入力されたテキストを格納する変数ID
 * @type variable
 * @default
 *
 * @arg defaultText
 * @text メッセージ
 * @desc テキスト入力を促すメッセージを指定します。
 * @default Please enter your text.
 *
 * @arg defaultValue
 * @text デフォルト値
 * @desc 入力欄に表示する初期値を指定します。
 * @default
 *
 * @arg okButtonLavel
 * @text OKボタンの文字
 * @desc OKボタンの文字を指定します。
 * @default OK
 * 
 * @arg cancelButtonLavel
 * @text キャンセルボタンの文字
 * @desc キャンセルボタンの文字を指定します。
 * @default キャンセル
 *
 * @arg maxLength
 * @text 最大文字数
 * @desc 入力可能な最大文字数を指定します。
 * @default 64
 * 
 * @help
 * プラグインコマンドで「InputDialog_Custom」を選び、
 * 変数ID・メッセージ・デフォルト値をそれぞれ設定してください。
 * ゲーム画面内にテキスト入力ウィンドウが表示され、
 * キーボード上で文字入力が可能になります。
 * 
 * 入力確定をキーボードで行う場合はEnterでは無く、Shiftキー+Enterキーです。
 * その旨どこかに表示しておくと便利です。
 * 入力した文字は指定した変数IDに入ります。
 * 空入力、キャンセルの場合は 0 が入ります。
 * 
 * 【　！注意！　】
 * プラグインコマンド直後に別のプラグインやスクリプトを実行する場合、
 * 同時に実行されることがあります。順番通り実行させたい場合は、
 * このプラグインコマンドと次のイベントの間に ウェイトを 数フレーム 挟んでください。
 * 
 */

(() => {

  const pluginName = 'InputDialog_Custom';
  const parameters = PluginManager.parameters("InputDialog_Custom");
  const fontFileName = parameters['fontFileName'] || '';

  const stopPropagation = (event) => {
    event.stopPropagation();
  };

  const style = document.createElement('style');

  if (fontFileName && fontFileName.trim() !== '') {

    const _Scene_Boot_loadGameFonts = Scene_Boot.prototype.loadGameFonts;
    Scene_Boot.prototype.loadGameFonts = function () {
      _Scene_Boot_loadGameFonts.call(this);
      FontManager.load('customFont', fontFileName);
    };

    const font = new FontFace('customFont', 'url("./fonts/' + fontFileName + '")');
    document.fonts.add(font);
    //font.load().then(() => { // 表示にタイムラグが発生する場合はここのコメントアウト除去
    style.textContent = `form, input, button {font-family: 'customFont';}`;
    document.head.appendChild(style);
    //}); // 表示にタイムラグが発生する場合はここのコメントアウト除去　

  }

  const _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
  Game_Interpreter.prototype.updateWaitMode = function() {
    if (this._waitMode === "waitInputForm") {
      const form = document.getElementById("inputForm");
      if (!form) {
        this.setWaitMode("");
        return false;
      }
      return true;
    }
    return _Game_Interpreter_updateWaitMode.call(this);
  };
  
  PluginManager.registerCommand(pluginName, 'openDialog', function (args) {

    $gameMap._interpreter.setWaitMode('waitInputForm');

    const varId = Number(args.varId);
    const defaultText = args.defaultText;
    const defaultValue = args.defaultValue;
    const okButtonLavel = args.okButtonLavel;
    const cancelButtonLavel = args.cancelButtonLavel;
    const maxLength = args.maxLength;

    // キャンバスの配置
    const form = createHtmlForm(varId, defaultValue, defaultText, okButtonLavel, cancelButtonLavel, maxLength);

    // スマホ用おまじない
    form.addEventListener('touchstart', stopPropagation);

    const canvas = document.getElementById("gameCanvas");
    const rect = canvas.getBoundingClientRect();
    form.style.left = "50%";
    form.style.top = "50%";
    form.style.transform = "translate(-50%, -50%)";

    document.body.appendChild(form);

    // テキスト入力欄にフォーカス
    form.elements["textInput"].focus();

    // ウィンドウリサイズ時にウィンドウを中央に配置
    const onResize = () => {
      form.style.left = "50%";
      form.style.top = "50%";
      form.style.transform = "translate(-50%, -50%)";
    };

    window.addEventListener("resize", onResize);

    // ウィンドウを閉じた時の処理
    form.addEventListener("close", () => {
      document.body.removeChild(form);
      document.head.removeChild(style);
    });

  });

  // キャンバスの作成
  function createHtmlForm(varId, defaultValue, defaultText, okButtonLavel, cancelButtonLavel, maxLength) {

    const form = document.createElement("form");
    const labelText = document.createElement("div");
    const input = document.createElement("input");
    const style = document.createElement("style");
    const buttonContainer = document.createElement("div");
    const okButton = document.createElement("button");
    const cancelButton = document.createElement("button");

    form.id = "inputForm";
    form.autocomplete = "off";
    input.id = "textInput";
    input.type = "text";
    input.inputmode = "text";
    input.maxLength = maxLength;
    okButton.type = "button";
    cancelButton.type = "button";

    // フォームのスタイル作成 
    form.style.position = "absolute";
    form.style.width = parameters["formWidth"];
    form.style.height = parameters["formHeight"];
    form.style.backgroundColor = parameters["formBackgroundColor"];
    form.style.border = parameters["formBorder"];
    form.style.borderRadius = parameters["formBorderRadius"];
    form.style.padding = parameters["formPadding"];
    form.style.display = "flex";
    form.style.flexDirection = "column";
    form.style.justifyContent = "space-between";
    form.style.alignItems = "center";
    form.style.zIndex = "1000";
    form.style.boxSizing = "border-box";

    // テキスト要素のスタイル作成
    labelText.innerText = defaultText;
    labelText.style.color = parameters["labelTextColor"];
    labelText.style.fontSize = parameters["labelTextFontSize"];
    labelText.style.marginBottom = parameters["labelTextMarginBottom"];

    // テキストフォームのスタイル作成
    input.value = defaultValue;
    input.style.width = parameters["inputWidth"];
    input.style.color = parameters["inputColor"];
    input.style.backgroundColor = parameters["inputBackgroundColor"];
    input.style.height = parameters["inputHeight"];
    input.style.border = parameters["inputBorder"];
    input.style.fontSize = parameters["inputFontSize"];
    input.style.padding = parameters["inputPadding"];
    input.style.borderRadius = parameters["inputBorderRadius"];
    input.style.boxSizing = "border-box";

    // ボタンコーナーのスタイル作成
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "space-around";
    buttonContainer.style.width = parameters["buttonContainerWidth"];
    buttonContainer.style.margin = parameters["buttonContainerMargin"];

    // OKボタンのスタイル作成
    okButton.innerText = okButtonLavel;
    okButton.style.backgroundColor = parameters["okButtonBackgroundColor"];
    okButton.style.color = parameters["okButtonColor"];
    okButton.style.width = parameters["okButtonWidth"];
    okButton.style.height = parameters["okButtonHeight"]
    okButton.style.border = parameters["okButtonBorder"];
    okButton.style.fontSize = parameters["okButtonFontSize"];
    okButton.style.borderRadius = parameters["okButtonBorderRadius"];
    okButton.style.padding = parameters["okButtonPadding"];
    okButton.style.cursor = parameters["cursorStyle"];
    okButton.style.cursor = "pointer";

    // キャンセルボタンのスタイル作成
    cancelButton.innerText = cancelButtonLavel;
    cancelButton.style.backgroundColor = parameters["cancelButtonBackgroundColor"];
    cancelButton.style.color = parameters["cancelButtonColor"];
    cancelButton.style.width = parameters["cancelButtonWidth"];
    cancelButton.style.height = parameters["cancelButtonHeight"]
    cancelButton.style.border = parameters["cancelButtonBorder"];
    cancelButton.style.fontSize = parameters["cancelButtonFontSize"];
    cancelButton.style.borderRadius = parameters["cancelButtonBorderRadius"];
    cancelButton.style.padding = parameters["cancelButtonPadding"];
    cancelButton.style.marginLeft = parameters["cancelButtonMarginLeft"];
    cancelButton.style.cursor = "pointer";

    // 入力欄のフォーカス
    style.innerHTML = `input:focus {outline: 0px solid #fff !important;}`;
    document.head.appendChild(style);

    // 送信処理のキャンセル
    form.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
    });

    // 変換中かどうかをチェック
    let isComposing = false;
    input.addEventListener("compositionstart", () => {
      isComposing = true;
    });
    input.addEventListener("compositionend", () => {
      isComposing = false;
    });

    // キー入力時の処理
    input.addEventListener("keydown", (event) => {

      // Backspaceキーを機能させる
      if (event.key === "Backspace" && !isComposing) {
        event.preventDefault();
        const startPos = input.selectionStart;
        const endPos = input.selectionEnd;
        if (startPos !== null && endPos !== null && startPos !== endPos) {
          const value = input.value;
          input.value = value.slice(0, startPos) + value.slice(endPos);
          input.selectionStart = input.selectionEnd = startPos;
        } else if (startPos !== null && startPos > 0) {
          const value = input.value;
          input.value = value.slice(0, startPos - 1) + value.slice(startPos);
          input.selectionStart = input.selectionEnd = startPos - 1;
        }
      } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        // カーソルキーを機能させる
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const startPos = input.selectionStart;
        const endPos = input.selectionEnd;
        if (startPos !== null && endPos !== null) {
          const newPosition = Math.max(Math.min(startPos + direction, input.value.length), 0);
          input.selectionStart = input.selectionEnd = newPosition;
        }
      } else if (event.key === "Enter") {
        if (event.shiftKey) {
          // Enter+Shiftで決定動作
          event.preventDefault();
          form.dispatchEvent(new Event("submit"));
          okButton.onclick();
        } else {
          // Enterキー単体で押された場合、イベントをキャンセル
          event.preventDefault();
        }
      }
    });

    // BackSpaceキーの無効化
    const _Input_onKeyDown = Input._onKeyDown;
    Input._onKeyDown = function (event) {
      if (event.key === "Backspace") {
        return;
      }
      _Input_onKeyDown.call(this, event);
    };

    // OKボタンの処理
    okButton.onclick = async () => {
      const inputValue = document.getElementById("textInput").value;
      $gameVariables.setValue(varId, inputValue ? inputValue : '');
      removeHtmlForm();
    };

    // キャンセルボタンの処理
    cancelButton.onclick = () => {
      removeHtmlForm();
    };

    buttonContainer.appendChild(okButton);
    buttonContainer.appendChild(cancelButton);
    form.appendChild(labelText);
    form.appendChild(input);
    form.appendChild(buttonContainer);
    return form;

  }

  // 入力フォームの除去
  function removeHtmlForm() {
    const form = document.getElementById("inputForm");
    if (form) {
      form.removeEventListener('touchstart', stopPropagation);
      document.body.removeChild(form);
      $gameMap._interpreter.setWaitMode("");
    }
  }

})();
