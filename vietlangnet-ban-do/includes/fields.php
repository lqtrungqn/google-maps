<?php
/**
 * Danh sách trường thông tin của một lớp học và các hàm đọc dữ liệu.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Khu vực dùng cho nút lọc trên bản đồ. */
function vln_map_regions() {
	return array( 'Châu Á', 'Châu Âu', 'Châu Mỹ & Úc', 'Châu Phi' );
}

/** Độ tuổi học sinh (giống cách site đang ghi trong bài viết). */
function vln_map_age_groups() {
	return array( 'Mẫu giáo (3–5 tuổi)', 'Tiểu học (6–11 tuổi)', 'Trung học cơ sở (12–15 tuổi)', 'Trên 15 tuổi' );
}

/** Gợi ý mô hình lớp học (vẫn gõ tự do được). */
function vln_map_models() {
	return array( 'Trường cuối tuần', 'Lớp cộng đồng', 'Trung tâm ngôn ngữ tư nhân', 'Chi hội người Việt', 'Đại học & Viện', 'Lớp trực tuyến' );
}

/**
 * Các trường text lưu trong post meta. key => nhãn.
 */
function vln_map_text_fields() {
	return array(
		'country'  => 'Quốc gia',
		'city'     => 'Thành phố',
		'address'  => 'Địa chỉ',
		'phone'    => 'Số điện thoại',
		'email'    => 'Email',
		'website'  => 'Website / Facebook',
		'schedule' => 'Lịch học',
		'model'    => 'Mô hình lớp học',
		'language' => 'Ngôn ngữ giảng dạy',
	);
}

/** Đọc một trường meta của lớp học. */
function vln_map_get( $post_id, $key ) {
	return get_post_meta( $post_id, '_vln_' . $key, true );
}

/**
 * Dữ liệu một lớp học ở dạng mảng (dùng cho bản đồ).
 *
 * @param WP_Post|int $post Bài lớp học.
 * @return array|null Null nếu chưa có tọa độ.
 */
function vln_map_class_data( $post ) {
	$post = get_post( $post );
	$lat  = vln_map_get( $post->ID, 'lat' );
	$lng  = vln_map_get( $post->ID, 'lng' );
	if ( '' === $lat || '' === $lng || ! is_numeric( $lat ) || ! is_numeric( $lng ) ) {
		return null;
	}
	$ages   = vln_map_get( $post->ID, 'ages' );
	$linked = (int) vln_map_get( $post->ID, 'linked_post' );
	$data   = array(
		'id'     => $post->ID,
		'name'   => get_the_title( $post ),
		'lat'    => (float) $lat,
		'lng'    => (float) $lng,
		'region' => (string) vln_map_get( $post->ID, 'region' ),
		'ages'   => is_array( $ages ) ? implode( ', ', $ages ) : '',
		'url'    => $linked && 'publish' === get_post_status( $linked ) ? get_permalink( $linked ) : '',
	);
	foreach ( array_keys( vln_map_text_fields() ) as $key ) {
		$data[ $key ] = (string) vln_map_get( $post->ID, $key );
	}
	return $data;
}

/** Tất cả lớp học đang bật hiển thị và đã có tọa độ. */
function vln_map_all_classes() {
	$posts = get_posts(
		array(
			'post_type'      => 'vln_lop_hoc',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'orderby'        => 'title',
			'order'          => 'ASC',
			'meta_query'     => array(
				'relation' => 'OR',
				array(
					'key'     => '_vln_hidden',
					'compare' => 'NOT EXISTS',
				),
				array(
					'key'   => '_vln_hidden',
					'value' => '1',
					'compare' => '!=',
				),
			),
		)
	);
	$out = array();
	foreach ( $posts as $post ) {
		$row = vln_map_class_data( $post );
		if ( $row ) {
			$out[] = $row;
		}
	}
	return $out;
}
