---
name: wp-env-setup
description: wp-template の @wordpress/env ローカル環境を扱うときに必ず使う。環境の起動/停止、WordPress初期設定、投稿一括作成、DBエクスポート/インポート、.wp-env.json へのプラグイン同期を案内・実行する。トリガー: セットアップ / 環境構築 / wp-env / 投稿作成 / プラグイン追加 / エクスポート / インポート
metadata:
  dependencies: Docker Desktop（起動必須）/ Node.js（package.json の engines 準拠）/ yarn 4
---

# wp-env-setup（Claude Code 用エントリ）

このスキルの**正本はプロジェクトルートの `skills/wp-env-setup/SKILL.md`**（Codex / Cursor と共用）。重複管理を避けるため、前提条件・手順・コマンドリファレンス・トラブルシュートはすべて正本を読んで、そこに書かれた手順へ従うこと。

## 使い方

1. 必ず `skills/wp-env-setup/SKILL.md`（プロジェクトルート基準）を Read で読み込むこと。読み込むまでセットアップ作業を開始してはならない
2. 正本の「クイックスタート」「完了条件」を順番どおり実行すること。スキップ禁止
3. DB を上書きする操作（`wp-contents:import`）の前には、正本の注意書きどおり既存データが消えることをユーザーに伝えること

## 自己完了確認（作業終了前に必ずチェック）

- [ ] 正本 `skills/wp-env-setup/SKILL.md` を読み込んでから作業を開始した
- [ ] 正本側の自己完了確認チェックリストも実施した
