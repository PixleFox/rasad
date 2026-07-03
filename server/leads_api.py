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
      CREATE TABLE IF NOT EXISTS risk_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        consent_at TEXT NOT NULL,
        answers_json TEXT NOT NULL,
        score INTEGER NOT NULL,
        profile_code TEXT NOT NULL,
        profile_title TEXT NOT NULL,
        dimensions_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS risk_assessments_phone_idx ON risk_assessments(phone);
      CREATE INDEX IF NOT EXISTS risk_assessments_created_idx ON risk_assessments(created_at DESC);
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
        if self.path == '/api/risk-assessments':
            return self.save_risk_assessment()
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

    def save_risk_assessment(self):
        try:
            length = min(int(self.headers.get('Content-Length', '0')), 65536)
            data = json.loads(self.rfile.read(length))
            name = str(data.get('name', '')).strip()[:120]
            phone = str(data.get('phone', '')).strip()
            age = int(data.get('age', 0))
            gender = str(data.get('gender', '')).strip()[:40]
            answers = data.get('answers', [])
            score = int(data.get('score', 0))
            profile_code = str(data.get('profileCode', '')).strip()[:8]
            profile_title = str(data.get('profileTitle', '')).strip()[:120]
            dimensions = data.get('dimensions', {})
            valid_answers = isinstance(answers, list) and len(answers) == 12 and all(isinstance(value, int) and 1 <= value <= 4 for value in answers)
            valid_dimensions = isinstance(dimensions, dict) and all(key in dimensions for key in ('volatility', 'independence', 'discipline'))
            if len(name) < 2 or not re.fullmatch(r'09\d{9}', phone) or not 18 <= age <= 100 or not gender or not data.get('consent') or not valid_answers or sum(answers) != score or not 12 <= score <= 48 or not re.fullmatch(r'T(?:10|[1-9])', profile_code) or not valid_dimensions:
                return self.send_json(400, {'error': 'invalid assessment'})
            now = datetime.now(timezone.utc).isoformat()
            with connect() as db:
                db.execute('''
                  INSERT INTO risk_assessments
                    (name, phone, age, gender, consent_at, answers_json, score, profile_code, profile_title, dimensions_json, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (name, phone, age, gender, now, json.dumps(answers), score, profile_code, profile_title, json.dumps(dimensions), now))
            self.send_json(201, {'ok': True})
        except Exception:
            self.send_json(500, {'error': 'server error'})

    def do_GET(self):
        if self.path == '/api/risk-assessments/admin':
            return self.get_risk_assessments()
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

    def get_risk_assessments(self):
        if not self.authorized():
            self.send_response(401)
            self.send_header('WWW-Authenticate', 'Basic realm="Rasad Admin"')
            self.end_headers()
            return
        with connect() as db:
            rows = db.execute('''
              SELECT id, name, phone, age, gender, score, profile_code,
                     profile_title, dimensions_json, created_at
              FROM risk_assessments ORDER BY created_at DESC LIMIT 5000
            ''').fetchall()
        self.send_json(200, {'rows': [dict(row) for row in rows]})

    def log_message(self, format, *args):
        return


if __name__ == '__main__':
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    connect().close()
    ThreadingHTTPServer(('127.0.0.1', 8787), Handler).serve_forever()
