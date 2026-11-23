<?php
/**
 * Plugin Name: VIETLANGNET – Bản đồ lớp học
 * Description: Quản lý và hiển thị bản đồ lớp học tiếng Việt toàn cầu trên Google Maps. Thêm mục "Bản đồ lớp học" trong trang quản trị, trang bản đồ toàn màn hình và shortcode [vln_ban_do].
 * Version: 1.0.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: vietlangnet-ban-do
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'VLN_MAP_VERSION', '1.0.0' );
define( 'VLN_MAP_FILE', __FILE__ );
define( 'VLN_MAP_DIR', plugin_dir_path( __FILE__ ) );
define( 'VLN_MAP_URL', plugin_dir_url( __FILE__ ) );

require_once VLN_MAP_DIR . 'includes/fields.php';
require_once VLN_MAP_DIR . 'includes/post-type.php';
require_once VLN_MAP_DIR . 'includes/admin.php';
require_once VLN_MAP_DIR . 'includes/settings.php';
require_once VLN_MAP_DIR . 'includes/frontend.php';

register_activation_hook(
	__FILE__,
	function () {
		vln_map_register_post_type();
		vln_map_add_rewrite();
		flush_rewrite_rules();
	}
);

register_deactivation_hook(
	__FILE__,
	function () {
		flush_rewrite_rules();
	}
);
