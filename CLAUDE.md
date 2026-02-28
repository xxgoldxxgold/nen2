# NEN2 - ブログサービス (nen2.com)

## !!CRITICAL!! 共有インフラストラクチャ警告

**nen2.comはgc2.jp（SNSサービス）と同じSupabase認証プロジェクトを共有しています。**

| プロジェクト | ID | 用途 |
|-------------|----|----|
| 認証（共有） | `egfnvlwrrujtndspjzgb` | gc2.jp + nen2.com 両方の認証 |
| データ（nen2専用） | `vylwpbbwkmuxrfzmgvkj` | nen2のデータ（gc2のSNSテーブルも同居） |

### 絶対にやってはいけないこと

1. **認証プロジェクト（egfnvlwrrujtndspjzgb）の設定を変更しない**
   - `site_url` を変更しない（現在: `https://gc2.jp`）
   - `uri_allow_list` からgc2.jpを削除しない
   - Google OAuthの設定（client_id, secret）を変更しない
   - 認証プロバイダーの有効/無効を変更しない
   - Supabase Management APIでこのプロジェクトのauth configをPATCHしない

2. **データプロジェクト（vylwpbbwkmuxrfzmgvkj）のgc2テーブルを変更しない**
   - gc2のテーブル: `users`, `follows`, `likes`, `reposts`, `conversations`, `messages`, `notifications`, `conversation_participants`, `message_reads`, `fcm_tokens`, `push_subscriptions`, `web_push_subscriptions`, `user_blocks`, `user_reports`, `blog_posts`, `blog_tags`, `blog_categories`, `blog_post_tags`, `blog_post_categories`
   - これらのテーブルをDROP, ALTER, TRUNCATE, または大量DELETEしない
   - nen2専用テーブル: `profiles`, `posts`, `tags`, `post_tags`, `images`, `ai_usage_logs`

3. **`GRANT`文を実行する場合、gc2のテーブルへの影響を確認する**

## アーキテクチャ

```
nen2.com (ブログ)          gc2.jp (SNS)
     |                        |
     +--- 認証 ---------------+  ← 共有: egfnvlwrrujtndspjzgb
     |
     +--- データ: vylwpbbwkmuxrfzmgvkj (nen2テーブル + gc2テーブル同居)
```

- **認証**: `src/lib/supabase/client.ts`, `server.ts` → gc2共有プロジェクト（読み取りのみ）
- **データ**: `src/lib/supabase/data-server.ts`, `data-client.ts` → nen2データプロジェクト
- **公開**: `src/lib/supabase/public.ts` → nen2データプロジェクト（anon key, ISR用）

## 環境変数

```
# 認証（gc2共有 - 変更禁止）
NEXT_PUBLIC_SUPABASE_URL      → gc2認証プロジェクト
NEXT_PUBLIC_SUPABASE_ANON_KEY → gc2認証プロジェクト

# データ（nen2専用）
NEXT_PUBLIC_NEN2_DB_URL       → nen2データプロジェクト
NEXT_PUBLIC_NEN2_DB_ANON_KEY  → nen2データプロジェクト
NEN2_DB_SERVICE_ROLE_KEY      → nen2データプロジェクト（サーバー側のみ）
```

## 技術スタック

- Next.js 16 + TypeScript + Tailwind CSS v4
- Supabase（認証 + データ）
- Anthropic Claude API（AI機能）
- Pexels API（画像検索）
- Vercel（ホスティング）
