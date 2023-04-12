// --------------------------------------------------------------------------
// 
// InputDialog.js
//
// Copyright (c) kotonoha*
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//
// 2023/04/12 ver1.0 プラグイン公開
// 
// --------------------------------------------------------------------------
/*:
 * @target MZ
 * @plugindesc キーボードで文字を入力し、入力内容を変数に格納するプラグイン
 * @author kotonoha*
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
 * @help
 * プラグインコマンドで「InputDialog」を選び、変数ID・メッセージ・デフォルト値をそれぞれ設定してください。
 * キーボード上で文字入力が可能になります。入力した文字は指定した変数IDに入ります。
 * 空入力、キャンセルの場合は 0 が入ります。
 * 
 */

(() => {
  const pluginName = 'InputDialog';

  PluginManager.registerCommand(pluginName, 'openDialog', args => {
    const varId = Number(args.varId);
    const defaultText = args.defaultText;
    const defaultValue = args.defaultValue;
    const text = window.prompt(defaultText, defaultValue);
    $gameVariables.setValue(varId, text ? text : '');
  });

})();