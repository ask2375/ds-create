---
name: adapt-styles
description: wp-template の SCSS 基盤（foundation/global）を参照プロジェクトの流儀に合わせるときに必ず使う。reset・変数・breakpoints の差し替えまで実施する。wp-env-setup 完了後の初期調整、または「既存プロジェクトに合わせて」「自分のテンプレに寄せて」と依頼され参照プロジェクトの src/ パスが提示されたときに起動する。
---

# adapt-styles（Claude Code 用エントリ）

このスキルの**正本はプロジェクトルートの `skills/adapt-styles/SKILL.md`**（Codex / Cursor と共用）。重複管理を避けるため、読み取り対象・差し替え対象・作業フロー・判断ポイントはすべて正本を読んで、そこに書かれた手順へ従うこと。

## 使い方

1. 必ず `skills/adapt-styles/SKILL.md`（プロジェクトルート基準）を Read で読み込むこと。読み込むまで差し替え作業を開始してはならない
2. 正本の作業フロー（参照元の解析 → 差分の提示 → 層名の確認 → 適用 → 検証）を順番どおり実行すること。ユーザー合意前の差し替え開始は禁止
3. 「やらないこと」（参照元の変更、layouts/components/projects/utilities の書き換え等）を厳守すること

## 自己完了確認（作業終了前に必ずチェック）

- [ ] 正本 `skills/adapt-styles/SKILL.md` を読み込んでから作業を開始した
- [ ] 正本側の自己完了確認チェックリストも実施した
