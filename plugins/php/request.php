<?php

	// --------------------------------------------------------------------------
	// 
	// ChatGPT_APIMZ オプションファイル
	// ※ ChatGPT APIに通信するPHPスクリプト
	// 
	// Copyright (c) kotonoha*
	// This software is released under the MIT License.
	// http://opensource.org/licenses/mit-license.php
	//
	// --------------------------------------------------------------------------

	// ここにAPIキーを設定する
	$api_key = 'sk-****************************';

	// ------------------------------------------------------------------------------

	header('Content-Type: application/json');

	// POSTデータを取得
	$post_data = json_decode(file_get_contents('php://input'), true);

	// OpenAI APIにリクエストを送信
	$ch = curl_init('https://api.openai.com/v1/chat/completions');
	curl_setopt_array($ch, [
	    CURLOPT_POST => true,
	    CURLOPT_RETURNTRANSFER => true,
	    CURLOPT_SSL_VERIFYPEER => false,
	    CURLOPT_SSL_VERIFYHOST => false,
	    CURLOPT_HTTPHEADER => [
	        'Content-Type: application/json',
	        'Authorization: Bearer ' . $api_key,
	    ],
	    CURLOPT_POSTFIELDS => json_encode($post_data),
	]);

	// APIからのレスポンスを取得
	$response = curl_exec($ch);
	$curl_error = curl_error($ch);

	if ($curl_error) {
	    // cURLエラー
	    echo json_encode(array("error" => array("code" => $curl_error)));
	} else {
	    $http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	    if ($http_status >= 400) {
	        // ChatGPT APIエラー
	        $errorText = $response;
	        $errorJson = json_decode($errorText, true);
	        http_response_code($http_status);
	        // メッセージを出力するとAPIキーがRMMZで出力される恐れがあるので
	        // コードの方を出力すること
	        $errorMessage = $errorJson["error"]["code"];
	        $responseJson = json_encode(array("error" => array("code" => $errorMessage)));
	        echo $responseJson;
	    } else {
	        // 正常なレスポンスの出力
	        http_response_code($http_status);
	        echo $response;
	    }
	}

	curl_close($ch);

?>
