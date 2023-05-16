// --------------------------------------------------------------------------
// 
// WebImageOutput.js ver1.0
//
// Copyright (c) kotonoha*（https://aokikotori.com/）
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//
// 2023/05/12 ver1.0 公開
// 
// --------------------------------------------------------------------------
/*:
 * @target MZ
 * @plugindesc 指定したURLの画像を表示するプラグインです。
 * @author kotonoha*
 *
 * @command open
 * @text URLを指定して画像を表示
 * @desc URLを指定して画像を表示します。
 *
 * @arg url
 * @text 画像のURL
 * @desc 画像のURLを指定します。
 * @type string
 * @default
 *
 * @arg pictureId
 * @text ピクチャID
 * @desc 出力する画像のピクチャIDを指定します。
 * @type number
 * @min 1
 * @default 1
 *
 * @arg width
 * @text 画像の幅
 * @desc 画像の幅を指定します。
 * @type number
 * @min 1
 * @default
 *
 * @arg height
 * @text 画像の高さ
 * @desc 画像の高さを指定します。
 * @type number
 * @min 1
 * @default
 *
 * @arg origin
 * @text 原点
 * @desc 画像の原点を指定します。
 * @type select
 * @option 左上
 * @value 0
 * @option 中央
 * @value 1
 * @default 0
 *
 * @arg x
 * @text X座標
 * @desc 画像のX座標を指定します。
 * @type number
 * @default 0
 *
 * @arg y
 * @text Y座標
 * @desc 画像のY座標を指定します。
 * @type number
 * @default 0
 *
 * @arg scaleX
 * @text 幅の拡大率
 * @desc 画像の横方向の拡大率を指定します。
 * @type number
 * @decimals 2
 * @default 1
 *
 * @arg scaleY
 * @text 高さの拡大率
 * @desc 画像の縦方向の拡大率を指定します。
 * @type number
 * @decimals 2
 * @default 1
 *
 * @arg opacity
 * @text 不透明度
 * @desc 画像の不透明度を指定します。
 * @type number
 * @max 255
 * @min 0
 * @default 255
 *
 * @arg blendMode
 * @text 合成方法
 * @desc 画像の合成方法を指定します。
 * @type select
 * @option 通常
 * @value 0
 * @option 加算
 * @value 1
 * @option 乗算
 * @value 2
 * @option スクリーン
 * @value 3
 * @default 0
 *
 * @command close
 * @text 表示されている画像を閉じます。
 * @desc 表示されている画像を閉じます。
 *
 * @arg pictureId
 * @text ピクチャID
 * @desc 閉じる画像のピクチャIDを指定します。
 * @type number
 * @min 1
 * @default 1
 *
 * @help
 * 使い方：
 * プラグインコマンド「WebImageOutput」を実行し、表示したい画像のURLを入力します。
 * 座標やサイズなど、表示方法を細かく指定することができます。
 * 
 * 【！注意！】
 * ※ URLから画像を取得するため、取得先の利用規約などは必ず確認してください。
 * 　直接リンクが禁止されている場合は、その画像を絶対に使用しないでください。
 * ※ 画像の出力には時間がかかる事があるため、プラグインコマンドの実行後に
 * 　ウェイトを入れることを推奨します。
 * 
 */

(() => {

  const pluginName = "WebImageOutput";

  PluginManager.registerCommand(pluginName, "open", (args) => {

    $gameMap._interpreter.setWaitMode('WebImageOutput');

    const imageUrl = WIO_processControlCharacters(args.url);
    const pictureId = Number(args.pictureId);
    const x = Number(args.x);
    const y = Number(args.y);
    const scaleX = Number(args.scaleX);
    const scaleY = Number(args.scaleY);
    const opacity = Number(args.opacity);
    const blendMode = Number(args.blendMode);
    const origin = Number(args.origin);
    const width = args.width ? Number(args.width) : null;
    const height = args.height ? Number(args.height) : null;

    if (!imageUrl) {
      console.error("エラー：画像がありません。");
      return;
    }

    UnsplashImageManager.loadBitmapFromUrl(imageUrl).then((bitmap) => {
      const sprite = new Sprite();
      sprite.bitmap = bitmap;
      sprite.x = x;
      sprite.y = y;
      sprite.scale.x = scaleX;
      sprite.scale.y = scaleY;
      sprite.opacity = opacity;
      sprite.blendMode = blendMode;
      sprite.z = pictureId;

      if (width) sprite.bitmap.width = width;
      if (height) sprite.bitmap.height = height;

      if (origin === 1) {
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
      }

      SceneManager._scene._spriteset._pictureContainer.addChild(sprite);
      $gameMap._interpreter.setWaitMode('');
    });
  });


  PluginManager.registerCommand(pluginName, "close", (args) => {
    const pictureId = args.pictureId;
    if (!pictureId) {
      console.error("エラー:ピクチャIDがありません。");
      return;
    }

    const pictureContainer = SceneManager._scene._spriteset._pictureContainer;
    const targetSprite = pictureContainer.children.find((child) => child.z === pictureId);

    if (targetSprite) {
      pictureContainer.removeChild(targetSprite);
    } else {
      console.warn("エラー:ピクチャID:" + pictureId + "が見つかりません。");
    }
  });

  const UnsplashImageManager = {
    loadBitmapFromUrl: function (url) {
      return new Promise((resolve, reject) => {
        const bitmap = Bitmap.load(url);
        bitmap.addLoadListener(() => {
          if (bitmap.isError()) {
            reject(new Error("エラー:URLが読み込めません。"));
          } else {
            resolve(bitmap);
          }
        });
      });
    }
  };

  const _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
  Game_Interpreter.prototype.updateWaitMode = function () {
    if (this._waitMode === 'WebImageOutput') {
      return true;
    }
    return _Game_Interpreter_updateWaitMode.call(this);
  };


	function WIO_processControlCharacters(str) {
		return str.replace(/\\([VNPI])\[(\d+)\]|\\G/g, function (matchedString, type, id) {
			if (matchedString === '\\G') {
				return TextManager.currencyUnit;
			}
			const numId = Number(id);
			switch (type) {
				case 'V':
					return String($gameVariables.value(numId));
				case 'N':
					return String($gameActors.actor(numId).name());
				case 'P':
					return String($gameParty.members()[numId - 1].name());
				default:
					return '';
			}
		});
	}

})();
