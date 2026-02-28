# NEN2 - ブログサービス (nen2.com)

## 共有インフラストラクチャ

**全サービス（gc2.jp, nen2.com, denwa2.com, real-insta.com）は同一のSupabaseプロジェクトで認証を共有しています。**

| プロジェクト | ID | 用途 |
|-------------|----|----|
| 統一（認証+データ） | `vylwpbbwkmuxrfzmgvkj` | 全サービスの認証 + データ |

### 絶対にやってはいけないこと

1. **他サービスのテーブルを変更しない**
   - gc2のテーブル: `users`, `follows`, `likes`, `reposts`, `conversations`, `messages`, `notifications`, `conversation_participants`, `message_reads`, `fcm_tokens`, `push_subscriptions`, `web_push_subscriptions`, `user_blocks`, `user_reports`, `blog_posts`, `blog_tags`, `blog_categories`, `blog_post_tags`, `blog_post_categories`
   - real-instaのテーブル: `ri_` プレフィックス
   - これらのテーブルをDROP, ALTER, TRUNCATE, または大量DELETEしない
   - nen2専用テーブル: `profiles`, `posts`, `tags`, `post_tags`, `images`, `ai_usage_logs`

2. **`GRANT`文を実行する場合、他サービスのテーブルへの影響を確認する**

## アーキテクチャ

```
gc2.jp / nen2.com / denwa2.com / real-insta.com
     |
     +--- 認証 + データ: vylwpbbwkmuxrfzmgvkj（全サービス共有）
```

- **認証**: `src/lib/supabase/client.ts`, `server.ts` → 統一プロジェクト
- **データ**: `src/lib/supabase/data-server.ts`, `data-client.ts` → 同じプロジェクト
- **公開**: `src/lib/supabase/public.ts` → 同じプロジェクト（anon key, ISR用）

## 環境変数

```
# 認証（全サービス共有）
NEXT_PUBLIC_SUPABASE_URL      → vylwpbbwkmuxrfzmgvkj
NEXT_PUBLIC_SUPABASE_ANON_KEY → vylwpbbwkmuxrfzmgvkj

# データ（nen2用 - 同じプロジェクト）
NEXT_PUBLIC_NEN2_DB_URL       → vylwpbbwkmuxrfzmgvkj
NEXT_PUBLIC_NEN2_DB_ANON_KEY  → vylwpbbwkmuxrfzmgvkj
NEN2_DB_SERVICE_ROLE_KEY      → vylwpbbwkmuxrfzmgvkj（サーバー側のみ）
```

## 技術スタック

- Next.js 16 + TypeScript + Tailwind CSS v4
- Supabase（認証 + データ）
- Anthropic Claude API（AI機能）
- Pexels API（画像検索）
- Vercel（ホスティング）
