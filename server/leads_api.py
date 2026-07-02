#!/usr/bin/env python3
import base64
import json
import os
import re
import sqlite3
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DB_PATH = os.getenv('RASAD_DB_PATH', '/var/lib/rasad/leads.db')
ADMIN_USER = os.getenv('RASAD_ADMIN_USER', 'admin')
ADMIN_PASSWORD = os.getenv('RASAD_ADMIN_PASSWORD', '')


def connect():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA journal_mode=WAL')
    db.executescript('''
      CREATE TABLE IF NOT EXISTS export_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL UNIQUE,
        phone_verified INTEGER NOT NULL DEFAULT 0,
        otp_enabled INTEGER NOT NULL DEFAULT 0,
        consent_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS export_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES export_users(id) ON DELETE CASCADE,
        page TEXT NOT NULL,
        file_name TEXT NOT NULL,
        exported_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS export_events_user_idx ON export_events(user_id);
    ''')
    return db


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def authorized(self):
        expected = base64.b64encode(f'{ADMIN_USER}:{ADMIN_PASSWORD}'.encode()).decode()
        return bool(ADMIN_PASSWORD) and self.headers.get('Authorization') == f'Basic {expected}'

    def do_POST(self):
        if self.path != '/api/export-leads':
            return self.send_json(404, {'error': 'not found'})
        try:
            length = min(int(self.headers.get('Content-Length', '0')), 4096)
            data = json.loads(self.rfile.read(length))
            phone = str(data.get('phone', '')).strip()
            if not re.fullmatch(r'09\d{9}', phone):
                return self.send_json(400, {'error': 'invalid phone'})
            page = str(data.get('page', ''))[:200]
            file_name = str(data.get('fileName', ''))[:120]
            now = datetime.now(timezone.utc).isoformat()
            with connect() as db:
                db.execute('INSERT INTO export_users(phone, consent_at, created_at, last_seen_at) VALUES(?,?,?,?) ON CONFLICT(phone) DO UPDATE SET last_seen_at=excluded.last_seen_at', (phone, now, now, now))
                user_id = db.execute('SELECT id FROM export_users WHERE phone=?', (phone,)).fetchone()['id']
                db.execute('INSERT INTO export_events(user_id,page,file_name,exported_at) VALUES(?,?,?,?)', (user_id, page, file_name, now))
            self.send_json(201, {'ok': True})
        except Exception:
            self.send_json(500, {'error': 'server error'})

    def do_GET(self):
        if self.path != '/api/export-leads/admin':
            return self.send_json(404, {'error': 'not found'})
        if not self.authorized():
            self.send_response(401)
            self.send_header('WWW-Authenticate', 'Basic realm="Rasad Admin"')
            self.end_headers()
            return
        with connect() as db:
            rows = db.execute('''
              SELECT u.phone, u.phone_verified, u.consent_at, u.created_at,
                     u.last_seen_at, COUNT(e.id) export_count, MAX(e.exported_at) last_export_at
              FROM export_users u LEFT JOIN export_events e ON e.user_id=u.id
              GROUP BY u.id ORDER BY u.created_at DESC
            ''').fetchall()
        self.send_json(200, {'rows': [dict(row) for row in rows]})

    def log_message(self, format, *args):
        return


if __name__ == '__main__':
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    connect().close()
    ThreadingHTTPServer(('127.0.0.1', 8787), Handler).serve_forever()
