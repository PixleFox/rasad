#!/usr/bin/env python3
"""Persistent Fipiran snapshot cache shared by the API and scheduled jobs."""

import json
import os
import ssl
import sqlite3
import threading
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

DB_PATH = os.getenv('RASAD_DB_PATH', '/var/lib/rasad/leads.db')
BASE_URL = 'https://www.fipiran.com/services/fund/fundcompare?date='
SSL_CONTEXT = ssl._create_unverified_context()
USER_AGENT = 'Mozilla/5.0 (Rasad data service)'
_fetch_locks = {}
_fetch_locks_guard = threading.Lock()
TEHRAN = ZoneInfo('Asia/Tehran')


def connect():
    db = sqlite3.connect(DB_PATH, timeout=30)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA journal_mode=WAL')
    db.execute('PRAGMA busy_timeout=30000')
    db.execute('''
      CREATE TABLE IF NOT EXISTS fipiran_snapshots (
        snapshot_date TEXT PRIMARY KEY,
        items_json TEXT NOT NULL,
        item_count INTEGER NOT NULL,
        fetched_at TEXT NOT NULL
      )
    ''')
    db.execute('CREATE INDEX IF NOT EXISTS fipiran_snapshots_fetched_idx ON fipiran_snapshots(fetched_at DESC)')
    return db


def read_snapshot(day):
    with connect() as db:
        row = db.execute(
            'SELECT items_json, fetched_at FROM fipiran_snapshots WHERE snapshot_date=?',
            (day,),
        ).fetchone()
    if not row:
        return None
    return {'date': day, 'items': json.loads(row['items_json']), 'fetchedAt': row['fetched_at']}


def save_snapshot(day, items):
    fetched_at = datetime.now(timezone.utc).isoformat()
    payload = json.dumps(items, ensure_ascii=False, separators=(',', ':'))
    with connect() as db:
        db.execute('''
          INSERT INTO fipiran_snapshots(snapshot_date, items_json, item_count, fetched_at)
          VALUES(?,?,?,?)
          ON CONFLICT(snapshot_date) DO UPDATE SET
            items_json=excluded.items_json,
            item_count=excluded.item_count,
            fetched_at=excluded.fetched_at
        ''', (day, payload, len(items), fetched_at))
    return {'date': day, 'items': items, 'fetchedAt': fetched_at}


def fetch_snapshot(day, attempts=3):
    request = urllib.request.Request(BASE_URL + day, headers={
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
    })
    last_error = None
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=30, context=SSL_CONTEXT) as response:
                payload = json.load(response)
            items = payload.get('items') or []
            return save_snapshot(day, items)
        except Exception as error:
            last_error = error
            if attempt + 1 < attempts:
                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f'Fipiran unavailable for {day}: {last_error}')


def get_or_fetch(day, refresh=False):
    cached = None if refresh else read_snapshot(day)
    if cached is not None:
        return cached
    with _fetch_locks_guard:
        day_lock = _fetch_locks.setdefault(day, threading.Lock())
    with day_lock:
        # A concurrent request may have populated this date while we waited.
        cached = None if refresh else read_snapshot(day)
        return cached if cached is not None else fetch_snapshot(day)


def fetch_days(days, refresh=False, workers=4):
    results = {}
    errors = {}
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(get_or_fetch, day, refresh): day for day in days}
        for future in as_completed(futures):
            day = futures[future]
            try:
                results[day] = future.result()
            except Exception as error:
                errors[day] = str(error)
    return results, errors


def compare_snapshot(requested_day, history_days=90):
    requested = date.fromisoformat(requested_day)
    today = datetime.now(TEHRAN).date()
    if requested > today + timedelta(days=1):
        raise ValueError('future date')

    # Missing dates inside the maintained year are exceptional; older dates are
    # deliberately fetched on demand while the user sees the long-load message.
    candidates = [(requested - timedelta(days=offset)).isoformat() for offset in range(12)]
    missing = [day for day in candidates if read_snapshot(day) is None]
    if missing:
        fetch_days(missing, workers=4)

    base = None
    for candidate in candidates:
        snapshot = read_snapshot(candidate)
        if snapshot:
            if snapshot['items']:
                base = snapshot
                break
    if not base:
        raise RuntimeError('no populated snapshot found')

    history = [(date.fromisoformat(base['date']) - timedelta(days=offset)).isoformat()
               for offset in range(1, history_days + 1)]
    missing = [day for day in history if read_snapshot(day) is None]
    if missing:
        fetch_days(missing, workers=4)

    merged = {}
    sources = [base]
    for day in history:
        snapshot = read_snapshot(day)
        if snapshot:
            sources.append(snapshot)
    for snapshot in sources:
        for item in snapshot['items']:
            reg_no = str(item.get('regNo') or '')
            if reg_no and reg_no not in merged:
                enriched = dict(item)
                enriched['_rasadDataDate'] = snapshot['date']
                merged[reg_no] = enriched

    return {
        'requestedDate': requested_day,
        'date': base['date'],
        'items': list(merged.values()),
        'fetchedAt': base['fetchedAt'],
    }


def date_range(days, end=None):
    end = end or datetime.now(TEHRAN).date()
    return [(end - timedelta(days=offset)).isoformat() for offset in range(days)]
