#!/usr/bin/env python3
import json
import os
import sqlite3
import urllib.request
from datetime import datetime, timezone

DB_PATH = os.getenv('RASAD_DB_PATH', '/var/lib/rasad/leads.db')
KEY_PATH = os.getenv('BRSAPI_KEY_PATH', '/opt/rasad/brsapi_key')


def load_key():
    key = os.getenv('BRSAPI_KEY', '').strip()
    if key:
        return key
    with open(KEY_PATH, encoding='utf-8') as key_file:
        return key_file.read().strip()


def main():
    url = f'https://api.brsapi.ir/Market/Gold_Currency.php?key={load_key()}'
    request = urllib.request.Request(url, headers={'User-Agent': 'Rasad/1.0'})
    with urllib.request.urlopen(request, timeout=20) as response:
        payload = json.load(response)
    usd = next(item for item in payload.get('currency', []) if item.get('symbol') == 'USD')
    price = float(usd['price'])
    if price <= 0 or usd.get('unit') != 'تومان':
        raise ValueError('invalid USD rate')

    now = datetime.now(timezone.utc).isoformat()
    with sqlite3.connect(DB_PATH) as db:
        db.execute('''
          CREATE TABLE IF NOT EXISTS exchange_rates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            price_toman REAL NOT NULL,
            source_date TEXT,
            source_time TEXT,
            source_timestamp INTEGER,
            fetched_at TEXT NOT NULL
          )
        ''')
        db.execute('CREATE INDEX IF NOT EXISTS exchange_rates_symbol_fetched_idx ON exchange_rates(symbol, fetched_at DESC)')
        db.execute('''
          INSERT INTO exchange_rates(symbol, price_toman, source_date, source_time, source_timestamp, fetched_at)
          VALUES (?, ?, ?, ?, ?, ?)
        ''', ('USD', price, usd.get('date'), usd.get('time'), usd.get('time_unix'), now))
    print(json.dumps({'symbol': 'USD', 'priceToman': price, 'fetchedAt': now}))


if __name__ == '__main__':
    main()
