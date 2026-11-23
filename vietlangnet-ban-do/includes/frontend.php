<?php
/**
 * Hiển thị bản đồ: trang toàn màn hình (/ban-do-lop-hoc/) và shortcode [vln_ban_do].
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* ---------- Trang toàn màn hình ---------- */

function vln_map_add_rewrite() {
	$slug = vln_map_setting( 'slug' );
	add_rewrite_rule( '^' . preg_quote( $slug, '/' ) . '/?$', 'index.php?vln_map=1', 'top' );
}
add_action( 'init', 'vln_map_add_rewrite' );

add_action(
	'init',
	function () {
		if ( get_option( 'vln_map_flush' ) ) {
			delete_option( 'vln_map_flush' );
			flush_rewrite_rules();
		}
	},
	99
);

add_filter(
	'query_vars',
	function ( $vars ) {
		$vars[] = 'vln_map';
		return $vars;
	}
);

function vln_map_page_url() {
	if ( get_option( 'permalink_structure' ) ) {
		return home_url( '/' . vln_map_setting( 'slug' ) . '/' );
	}
	return add_query_arg( 'vln_map', '1', home_url( '/' ) );
}

add_action(
	'template_redirect',
	function () {
		if ( ! get_query_var( 'vln_map' ) ) {
			return;
		}
		status_header( 200 );
		nocache_headers();
		include VLN_MAP_DIR . 'templates/map-page.php';
		exit;
	}
);

/* Không để WordPress tự chuyển hướng trang bản đồ sang trang khác có tên gần giống. */
add_filter(
	'redirect_canonical',
	function ( $url ) {
		return get_query_var( 'vln_map' ) ? false : $url;
	}
);

/** Cấu hình truyền cho map.js */
function vln_map_js_config() {
	return array(
		'tiles'   => vln_map_tile_config(),
		'regions' => vln_map_regions(),
		'classes' => vln_map_all_classes(),
	);
}

/**
 * Khung bản đồ: danh sách lớp + bản đồ. Dùng chung cho trang toàn màn hình và shortcode.
 *
 * @param bool $with_filters Có hiện ô tìm kiếm và chọn quốc gia trong khung danh sách không.
 */
function vln_map_render_main( $with_filters ) {
	ob_start();
	?>
	<div class="vln-main">
		<aside class="vln-panel" data-vln="panel" data-open="true">
			<div class="vln-panel-head">
				<?php if ( $with_filters ) : ?>
					<div class="vln-filters vln-filters--stack"><?php echo vln_map_render_filters(); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
				<?php endif; ?>
				<div class="vln-count" data-vln="count"></div>
				<div class="vln-chips" data-vln="regions" role="group" aria-label="Lọc theo khu vực"></div>
			</div>
			<ul class="vln-list" data-vln="list"></ul>
		</aside>
		<div class="vln-map" data-vln="map" role="region" aria-label="Bản đồ lớp học"></div>
		<button class="vln-toggle" data-vln="toggle" type="button"><i></i><span>Danh sách lớp</span></button>
	</div>
	<?php
	return ob_get_clean();
}

function vln_map_render_filters() {
	return '<label class="vln-search"><svg viewBox="0 0 512 512" aria-hidden="true"><path d="M416 208c0 45.9-14.9 88.3-40 122.7l126.6 126.7a32 32 0 0 1-45.3 45.3L330.7 376A208 208 0 1 1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>'
		. '<input data-vln="q" type="search" placeholder="Tìm tên lớp, thành phố…" aria-label="Tìm lớp học"></label>'
		. '<select data-vln="country" aria-label="Lọc theo quốc gia"><option value="">Tất cả quốc gia</option></select>';
}

/** Đăng ký Leaflet và MarkerCluster (đóng gói sẵn trong plugin, không tải từ CDN). */
function vln_map_register_vendor() {
	wp_register_style( 'vln-leaflet', VLN_MAP_URL . 'assets/vendor/leaflet.css', array(), '1.9.4' );
	wp_register_style( 'vln-markercluster', VLN_MAP_URL . 'assets/vendor/markercluster.css', array( 'vln-leaflet' ), '1.5.3' );
	wp_register_script( 'vln-leaflet', VLN_MAP_URL . 'assets/vendor/leaflet.js', array(), '1.9.4', true );
	wp_register_script( 'vln-markercluster', VLN_MAP_URL . 'assets/vendor/leaflet.markercluster.js', array( 'vln-leaflet' ), '1.5.3', true );
}

/* ---------- Shortcode [vln_ban_do] ---------- */

add_shortcode(
	'vln_ban_do',
	function ( $atts ) {
		static $done = false;
		if ( $done ) {
			return '<!-- vln_ban_do: chỉ hỗ trợ một bản đồ trên mỗi trang -->';
		}
		$done   = true;
		$atts   = shortcode_atts( array( 'height' => 620 ), $atts, 'vln_ban_do' );
		$height = max( 360, min( 1200, absint( $atts['height'] ) ) );

		vln_map_register_vendor();
		wp_enqueue_style( 'vln-map', VLN_MAP_URL . 'assets/map.css', array( 'vln-leaflet', 'vln-markercluster' ), VLN_MAP_VERSION );
		wp_enqueue_script( 'vln-map', VLN_MAP_URL . 'assets/map.js', array( 'vln-leaflet', 'vln-markercluster' ), VLN_MAP_VERSION, true );
		wp_add_inline_script( 'vln-map', 'window.VLN_MAP = ' . wp_json_encode( vln_map_js_config() ) . ';', 'before' );

		return '<div class="vln-app vln-app--embed" style="height:' . $height . 'px">' . vln_map_render_main( true ) . '</div>';
	}
);
