// --------------------------------------------------------------------------
// 
// VariableUpdateNotifier.js ver1.0
//
// Copyright (c) kotonoha*（https://aokikotori.com/）
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//
// 2023/05/17 ver1.0 公開
// 
// --------------------------------------------------------------------------
/*:
 * @target MZ
 * @plugindesc 変数が更新された際に画面上にメッセージを出力するプラグイン
 * @author kotonoha*
 *
 * @param XPosition
 * @text X 座標
 * @desc メッセージの表示位置の X 座標
 * @type number
 * @default 16
 *
 * @param YPosition
 * @text Y 座標
 * @desc メッセージの表示位置の Y 座標
 * @type number
 * @default 16
 *
 * @param Variables
 * @text 対象変数
 * @desc 監視する変数のIDリスト (カンマ区切り)
 * @type string
 * @default 1,2,3
 *
 * @help
 * 変数が更新された際に画面上にメッセージを出力します。
 * 
 */

(() => {

    const pluginName = "VariableUpdateNotifier";
    const parameters = PluginManager.parameters(pluginName);
    const xPosition = Number(parameters["XPosition"]);
    const yPosition = Number(parameters["YPosition"]);
    const targetVariables = parameters["Variables"]
      .split(",")
      .map((variableId) => Number(variableId));
  
    function VUN_createHtmlMessage(text) {
      const messageDiv = document.createElement("div");
      messageDiv.style.position = "absolute";
      messageDiv.style.left = `${xPosition}px`;
      messageDiv.style.top = `${yPosition}px`;
      messageDiv.style.fontSize = "16px";
      messageDiv.style.color = "#ffffff";
      messageDiv.style.textShadow = "1px 1px #000000";
      messageDiv.style.zIndex = 1000;
      messageDiv.innerHTML = text;
      document.body.appendChild(messageDiv);
  
      setTimeout(() => {
        messageDiv.remove();
      }, 3000);
    }
  
    const _Game_Variables_setValue = Game_Variables.prototype.setValue;
    Game_Variables.prototype.setValue = function (variableId, value) {
      const oldValue = this.value(variableId);
      _Game_Variables_setValue.call(this, variableId, value);
  
      if (oldValue !== value && targetVariables.includes(variableId)) {
        const text = `変数:${variableId}が更新されました`;
        VUN_createHtmlMessage(text);
        console.log(text);
      }
    };

})();
  
  
  
  