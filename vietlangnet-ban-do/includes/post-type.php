<?php
/**
 * Loại nội dung "Lớp học" – tạo mục "Bản đồ lớp học" riêng trong menu quản trị.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function vln_map_register_post_type() {
	register_post_type(
		'vln_lop_hoc',
		array(
			'labels'          => array(
				'name'               => 'Lớp học trên bản đồ',
				'singular_name'      => 'Lớp học',
				'menu_name'          => 'Bản đồ lớp học',
				'all_items'          => 'Tất cả lớp học',
				'add_new'            => 'Thêm lớp học',
				'add_new_item'       => 'Thêm lớp học mới',
				'edit_item'          => 'Sửa lớp học',
				'new_item'           => 'Lớp học mới',
				'search_items'       => 'Tìm lớp học',
				'not_found'          => 'Chưa có lớp học nào.',
				'not_found_in_trash' => 'Thùng rác trống.',
			),
			'public'          => false,
			'show_ui'         => true,
			'show_in_menu'    => true,
			'menu_position'   => 21,
			'menu_icon'       => 'dashicons-location-alt',
			'supports'        => array( 'title' ),
			'capability_type' => 'post',
			'map_meta_cap'    => true,
			'show_in_rest'    => false,
		)
	);
}
add_action( 'init', 'vln_map_register_post_type' );

/* ---------- Cột trong danh sách lớp học ---------- */

add_filter(
	'manage_vln_lop_hoc_posts_columns',
	function ( $cols ) {
		return array(
			'cb'           => $cols['cb'],
			'title'        => 'Tên lớp học',
			'vln_place'    => 'Quốc gia / Thành phố',
			'vln_region'   => 'Khu vực',
			'vln_contact'  => 'Liên hệ',
			'vln_location' => 'Vị trí',
			'vln_visible'  => 'Hiển thị',
		);
	}
);

add_action(
	'manage_vln_lop_hoc_posts_custom_column',
	function ( $col, $post_id ) {
		switch ( $col ) {
			case 'vln_place':
				echo esc_html( trim( vln_map_get( $post_id, 'country' ) . ' / ' . vln_map_get( $post_id, 'city' ), ' /' ) );
				break;
			case 'vln_region':
				echo esc_html( vln_map_get( $post_id, 'region' ) );
				break;
			case 'vln_contact':
				echo esc_html( vln_map_get( $post_id, 'phone' ) );
				$email = vln_map_get( $post_id, 'email' );
				if ( $email ) {
					echo '<br><span class="description">' . esc_html( $email ) . '</span>';
				}
				break;
			case 'vln_location':
				$lat = vln_map_get( $post_id, 'lat' );
				$lng = vln_map_get( $post_id, 'lng' );
				if ( is_numeric( $lat ) && is_numeric( $lng ) ) {
					echo '<span class="vln-badge vln-badge--ok">✓ Đã có</span>';
				} else {
					echo '<span class="vln-badge vln-badge--missing">Chưa có tọa độ</span>';
				}
				break;
			case 'vln_visible':
				echo '1' === vln_map_get( $post_id, 'hidden' ) ? '<span class="vln-badge">Đang ẩn</span>' : '<span class="vln-badge vln-badge--ok">Hiện</span>';
				break;
		}
	},
	10,
	2
);

/* Lọc danh sách theo khu vực */
add_action(
	'restrict_manage_posts',
	function ( $post_type ) {
		if ( 'vln_lop_hoc' !== $post_type ) {
			return;
		}
		$current = isset( $_GET['vln_region'] ) ? sanitize_text_field( wp_unslash( $_GET['vln_region'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		echo '<select name="vln_region"><option value="">Tất cả khu vực</option>';
		foreach ( vln_map_regions() as $r ) {
			printf( '<option value="%1$s" %2$s>%1$s</option>', esc_attr( $r ), selected( $current, $r, false ) );
		}
		echo '</select>';
	}
);

add_action(
	'pre_get_posts',
	function ( $q ) {
		if ( ! is_admin() || ! $q->is_main_query() || 'vln_lop_hoc' !== $q->get( 'post_type' ) ) {
			return;
		}
		// phpcs:ignore WordPress.Security.NonceVerification
		$region = isset( $_GET['vln_region'] ) ? sanitize_text_field( wp_unslash( $_GET['vln_region'] ) ) : '';
		$meta   = array();
		if ( $region ) {
			$meta[] = array(
				'key'   => '_vln_region',
				'value' => $region,
			);
		}
		// Tìm kiếm trong danh sách: tìm cả quốc gia, thành phố, SĐT, email.
		$s = $q->get( 's' );
		if ( $s ) {
			$q->set( 's', '' );
			$q->set( 'vln_search', $s );
		}
		if ( $meta ) {
			$q->set( 'meta_query', $meta );
		}
	}
);

add_filter(
	'posts_where',
	function ( $where, $q ) {
		$s = $q->get( 'vln_search' );
		if ( ! $s ) {
			return $where;
		}
		global $wpdb;
		$like   = '%' . $wpdb->esc_like( $s ) . '%';
		$where .= $wpdb->prepare(
			" AND ( {$wpdb->posts}.post_title LIKE %s OR EXISTS ( SELECT 1 FROM {$wpdb->postmeta} vm WHERE vm.post_id = {$wpdb->posts}.ID AND vm.meta_key IN ('_vln_country','_vln_city','_vln_phone','_vln_email','_vln_address') AND vm.meta_value LIKE %s ) )",
			$like,
			$like
		);
		return $where;
	},
	10,
	2
);
