#!/usr/bin/env python3
import argparse
import json

from fipiran_store import date_range, fetch_days


def main():
    parser = argparse.ArgumentParser(description='Store Fipiran daily snapshots locally')
    parser.add_argument('--days', type=int, default=7)
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    results, errors = fetch_days(date_range(max(1, args.days)), refresh=args.refresh, workers=args.workers)
    print(json.dumps({
        'ok': not errors,
        'storedDays': len(results),
        'failedDays': len(errors),
        'errors': errors,
    }, ensure_ascii=False))


if __name__ == '__main__':
    main()
