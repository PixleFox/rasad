#!/usr/bin/env python3
import json
import os
import ssl
import tempfile
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta, datetime, timezone

BASE = 'https://www.fipiran.com/services/fund/fundcompare?date='
CACHE_PATH = os.getenv('TRIGGER_BASELINE_PATH', '/var/lib/rasad/trigger_baseline.json')
TYPES = (4, 5, 6, 7, 21)
SSL_CONTEXT = ssl._create_unverified_context()


def fetch_day(day):
    request = urllib.request.Request(BASE + day.isoformat(), headers={
        'User-Agent': 'Mozilla/5.0 (Rasad data service)',
        'Accept': 'application/json',
    })
    try:
        with urllib.request.urlopen(request, timeout=25, context=SSL_CONTEXT) as response:
            payload = json.load(response)
        items = payload.get('items') or []
        return day.isoformat(), items
    except Exception:
        return day.isoformat(), []


def merge_nearest(snapshots, latest_day):
    merged = {}
    for day, items in sorted(snapshots, reverse=True):
        if day > latest_day.isoformat():
            continue
        for item in items:
            reg_no = str(item.get('regNo') or '')
            if reg_no and reg_no not in merged:
                merged[reg_no] = item
    return merged


def main():
    today = date.today()
    prior_day = today - timedelta(days=30)
    days = [today - timedelta(days=offset) for offset in range(121)]
    with ThreadPoolExecutor(max_workers=12) as pool:
        snapshots = list(pool.map(fetch_day, days))

    current = merge_nearest(snapshots, today)
    previous = merge_nearest(snapshots, prior_day)
    funds_by_type = {str(type_id): [] for type_id in TYPES}
    averages = {str(type_id): 0.0 for type_id in TYPES}

    for reg_no, item in current.items():
        type_id = int(item.get('fundType') or 0)
        ins_code = str(item.get('insCode') or '')
        if type_id not in TYPES or item.get('typeOfInvest') != 'Negotiable' or not ins_code or 'نیکوکاری' in str(item.get('name') or ''):
            continue
        funds_by_type[str(type_id)].append({
            'regNo': reg_no,
            'insCode': ins_code,
            'name': item.get('name') or '',
        })
        old = previous.get(reg_no)
        nav = float(item.get('cancelNav') or item.get('statisticalNav') or item.get('issueNav') or 0)
        units = float(item.get('investedUnits') or 0)
        old_units = float(old.get('investedUnits') or 0) if old else units
        if nav > 0:
            averages[str(type_id)] += (units - old_units) * nav / 1e10 / 20

    # Preserve previously known instruments even if the source misses them for
    # the entire scan window; instruments are never removed automatically.
    try:
        with open(CACHE_PATH, encoding='utf-8') as cache_file:
            previous_cache = json.load(cache_file)
        for type_id, old_funds in previous_cache.get('fundsByType', {}).items():
            known = {fund['insCode'] for fund in funds_by_type.get(type_id, [])}
            funds_by_type.setdefault(type_id, []).extend(fund for fund in old_funds if fund.get('insCode') not in known)
    except (FileNotFoundError, json.JSONDecodeError):
        pass

    payload = {
        'asOf': max((day for day, items in snapshots if items), default=today.isoformat()),
        'baselineStart': prior_day.isoformat(),
        'fetchedAt': datetime.now(timezone.utc).isoformat(),
        'fundsByType': funds_by_type,
        'averageByType': averages,
    }
    os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
    fd, temp_path = tempfile.mkstemp(dir=os.path.dirname(CACHE_PATH), prefix='trigger-', suffix='.json')
    with os.fdopen(fd, 'w', encoding='utf-8') as output:
        json.dump(payload, output, ensure_ascii=False)
    os.replace(temp_path, CACHE_PATH)
    print(json.dumps({'ok': True, 'funds': sum(map(len, funds_by_type.values())), 'asOf': payload['asOf']}))


if __name__ == '__main__':
    main()
