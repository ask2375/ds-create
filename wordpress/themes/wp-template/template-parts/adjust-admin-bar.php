  <?php
/* 管理バーの高さぶんレイアウトをずらす。ログイン状態ではなく管理バーの表示可否で判定すること。
     ユーザーの show_admin_bar_front が false の場合はログイン中でもバーが出ないため、
     is_user_logged_in() で判定すると「バーが無いのに 32px ずれる」状態になる。 */
?>
  <?php if (is_admin_bar_showing()): ?>
    <style type="text/css">
      body {
        min-height: calc(100vh - 32px) !important;
        min-height: calc(100dvh - 32px) !important;
      }

      .l-header,
      .l-drawer {
        top: 32px !important;
      }

      @media screen and (max-width: 1024px) {
        body {
          min-height: calc(100vh - 32px) !important;
          min-height: calc(100dvh - 32px) !important;
        }

        .l-header,
        .l-drawer {
          top: 32px !important;
        }
      }

      @media screen and (max-width: 782px) {
        body {
          min-height: calc(100vh - 46px) !important;
          min-height: calc(100dvh - 46px) !important;
        }

        .l-header,
        .l-drawer {
          top: 46px !important;
        }
      }

      @media screen and (max-width: 600px) {
        #wpadminbar {
          position: fixed !important;
        }
      }
    </style>
  <?php endif; ?>
