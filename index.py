import json
import urllib.request

def handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 204, 'headers': headers, 'body': ''}
    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': headers, 'body': '{}'}
    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        return {'statusCode': 400, 'headers': headers, 'body': '{}'}
    api_key = body.get('apiKey', '')
    folder_id = body.get('folderId', '')
    model = body.get('model', 'yandexgpt')
    messages = body.get('messages', [])
    if not api_key or not folder_id or not messages:
        return {'statusCode': 400, 'headers': headers, 'body': '{"error":"missing fields"}'}
    payload = json.dumps({
        'modelUri': 'gpt://' + folder_id + '/' + model,
        'messages': messages,
        'completionOptions': {'temperature': 0.7, 'maxTokens': 2000}
    }).encode('utf-8')
    req = urllib.request.Request(
        'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
        data=payload,
        headers={
            'Authorization': 'Bearer ' + api_key,
            'Content-Type': 'application/json'
        },
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = resp.read().decode('utf-8')
            return {'statusCode': resp.status, 'headers': headers, 'body': result}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        return {'statusCode': e.code, 'headers': headers, 'body': err_body}
    except Exception as e:
        return {'statusCode': 502, 'headers': headers, 'body': '{"error":"' + str(e) + '"}'}