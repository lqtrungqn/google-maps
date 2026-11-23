<?php
/**
 * Trang bản đồ toàn màn hình. Trang này không dùng header/footer của theme để bản đồ chiếm trọn màn hình,
 * phần đầu trang được làm lại theo giao diện VIETLANGNET.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$vln_title    = vln_map_setting( 'title' );
$vln_subtitle = vln_map_setting( 'subtitle' );
$vln_logo     = vln_map_logo_url();
$vln_ver      = VLN_MAP_VERSION;
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?php echo esc_html( $vln_title . ' – ' . get_bloginfo( 'name' ) ); ?></title>
<?php if ( get_site_icon_url() ) : ?>
<link rel="icon" href="<?php echo esc_url( get_site_icon_url( 32 ) ); ?>">
<?php endif; ?>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="<?php echo esc_url( VLN_MAP_URL . 'assets/vendor/leaflet.css?ver=1.9.4' ); ?>">
<link rel="stylesheet" href="<?php echo esc_url( VLN_MAP_URL . 'assets/vendor/markercluster.css?ver=1.5.3' ); ?>">
<link rel="stylesheet" href="<?php echo esc_url( VLN_MAP_URL . 'assets/map.css?ver=' . $vln_ver ); ?>">
</head>
<body class="vln-body">
<div class="vln-app vln-app--full">
	<div class="vln-utility">
		<div class="vln-row">
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>">
				<svg viewBox="0 0 448 512" aria-hidden="true"><path d="M9.4 233.4a32 32 0 0 0 0 45.3l160 160a32 32 0 0 0 45.3-45.3L109.3 288H416a32 32 0 1 0 0-64H109.3l105.3-105.4a32 32 0 0 0-45.3-45.3l-160 160z"/></svg>
				Về trang chủ <?php echo esc_html( get_bloginfo( 'name' ) ); ?>
			</a>
		</div>
	</div>

	<header class="vln-header">
		<div class="vln-row">
			<a class="vln-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>">
				<?php if ( $vln_logo ) : ?>
					<img src="<?php echo esc_url( $vln_logo ); ?>" alt="">
				<?php endif; ?>
				<span>
					<span class="vln-logo-name">VIETLANGNET <i></i></span>
					<?php if ( $vln_subtitle ) : ?>
						<span class="vln-logo-sub"><?php echo esc_html( $vln_subtitle ); ?></span>
					<?php endif; ?>
				</span>
			</a>
			<span class="vln-divider" aria-hidden="true"></span>
			<div class="vln-title">
				<h1><?php echo esc_html( $vln_title ); ?></h1>
				<p>Bấm vào ghim trên bản đồ hoặc chọn lớp trong danh sách để xem thông tin.</p>
			</div>
			<div class="vln-filters"><?php echo vln_map_render_filters(); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
		</div>
	</header>

	<?php echo vln_map_render_main( false ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
</div>
<script>window.VLN_MAP = <?php echo wp_json_encode( vln_map_js_config() ); ?>;</script>
<script src="<?php echo esc_url( VLN_MAP_URL . 'assets/vendor/leaflet.js?ver=1.9.4' ); ?>"></script>
<script src="<?php echo esc_url( VLN_MAP_URL . 'assets/vendor/leaflet.markercluster.js?ver=1.5.3' ); ?>"></script>
<script src="<?php echo esc_url( VLN_MAP_URL . 'assets/map.js?ver=' . $vln_ver ); ?>"></script>
</body>
</html>
