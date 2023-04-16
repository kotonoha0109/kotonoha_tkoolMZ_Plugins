<?php

	// --------------------------------------------------------------------------
	// 
	// ChatGPT APIに通信するPHPスクリプト（Stream版）
	//
	// Copyright (c) kotonoha*
	// This software is released under the MIT License.
	// http://opensource.org/licenses/mit-license.php
	//
	// --------------------------------------------------------------------------

	// APIキーを設定
	$api_key = 'sk-*****************************';

	// ------------------------------------------------------------------------------

	header('Content-Type: application/json');

	// POSTデータを取得
	$post_data = json_decode(file_get_contents('php://input'), true);

	// OpenAI APIにリクエストを送信
	$ch = curl_init('https://api.openai.com/v1/chat/completions');
	curl_setopt_array($ch, [
		CURLOPT_POST => true,
		CURLOPT_RETURNTRANSFER => false,
		CURLOPT_HTTPHEADER => [
			'Content-Type: application/json',
			'Authorization: Bearer ' . $api_key,
		],
		CURLOPT_POSTFIELDS => json_encode($post_data),
		CURLOPT_WRITEFUNCTION => function ($ch, $chunk) {
			echo $chunk;
			ob_flush();
			flush();
			return strlen($chunk);
		},
	]);

	// レスポンスを取得
	$response = curl_exec($ch);
    
	// エラーがある場合
    $curl_error = curl_errno($ch);
    $http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

	if ($curl_error) {
	    // cURLエラー
	    echo json_encode(array("error" => array("code" => $curl_error)));
	} else {
		// ChatGPT APIエラー
	    $errorText = $response;
	    $errorJson = json_decode($errorText, true);
	    http_response_code($http_status);
	    // メッセージを出力するとAPIキーがRMMZで出力される恐れがあるので
	    // コードの方を出力すること
	    $errorMessage = $errorJson["error"]["code"];
	    $responseJson = json_encode(array("error" => array("code" => $errorMessage)));
	    echo $responseJson;
	}

	curl_close($ch);

?>