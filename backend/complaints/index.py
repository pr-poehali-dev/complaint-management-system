import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управления жалобами (создание, получение, обновление)
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    
    try:
        if method == 'GET':
            return get_complaints(conn)
        elif method == 'POST':
            return create_complaint(conn, event)
        elif method == 'PUT':
            return update_complaint(conn, event)
        else:
            return {'statusCode': 405, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Method not allowed'})}
    finally:
        conn.close()

def get_complaints(conn) -> Dict[str, Any]:
    '''Получить все жалобы'''
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT id, title, description, type, status, photo, response, 
                   TO_CHAR(created_at, 'YYYY-MM-DD') as date
            FROM complaints 
            ORDER BY created_at DESC
        ''')
        complaints = cur.fetchall()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps([dict(c) for c in complaints])
    }

def create_complaint(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    '''Создать новую жалобу'''
    body = json.loads(event.get('body', '{}'))
    
    title = body.get('title', '').strip()
    description = body.get('description', '').strip()
    complaint_type = body.get('type', '').strip()
    photo = body.get('photo', '')
    
    if not title or not description or not complaint_type:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing required fields'})
        }
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO complaints (title, description, type, photo, status)
            VALUES (%s, %s, %s, %s, 'pending')
            RETURNING id, title, description, type, status, photo, 
                      TO_CHAR(created_at, 'YYYY-MM-DD') as date
        ''', (title, description, complaint_type, photo))
        complaint = cur.fetchone()
        conn.commit()
    
    return {
        'statusCode': 201,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps(dict(complaint))
    }

def update_complaint(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    '''Обновить статус или ответ на жалобу'''
    body = json.loads(event.get('body', '{}'))
    
    complaint_id = body.get('id')
    status = body.get('status')
    response = body.get('response')
    
    if not complaint_id:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing complaint id'})
        }
    
    updates = []
    params = []
    
    if status:
        updates.append('status = %s')
        params.append(status)
    
    if response is not None:
        updates.append('response = %s')
        params.append(response)
    
    updates.append('updated_at = CURRENT_TIMESTAMP')
    params.append(complaint_id)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            UPDATE complaints 
            SET {', '.join(updates)}
            WHERE id = %s
            RETURNING id, title, description, type, status, photo, response,
                      TO_CHAR(created_at, 'YYYY-MM-DD') as date
        ''', params)
        complaint = cur.fetchone()
        conn.commit()
    
    if not complaint:
        return {
            'statusCode': 404,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Complaint not found'})
        }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps(dict(complaint))
    }
