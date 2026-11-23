<?php
/**
 * Màn hình thêm / sửa lớp học: khung thông tin + bản đồ chọn vị trí.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'add_meta_boxes_vln_lop_hoc',
	function () {
		add_meta_box( 'vln_info', 'Thông tin lớp học', 'vln_map_box_info', 'vln_lop_hoc', 'normal', 'high' );
		add_meta_box( 'vln_location', 'Vị trí trên bản đồ', 'vln_map_box_location', 'vln_lop_hoc', 'normal', 'high' );
		add_meta_box( 'vln_display', 'Hiển thị', 'vln_map_box_display', 'vln_lop_hoc', 'side', 'default' );
	}
);

/* Placeholder cho ô tiêu đề */
add_filter(
	'enter_title_here',
	function ( $text, $post ) {
		return 'vln_lop_hoc' === $post->post_type ? 'Tên lớp học (ví dụ: Trường Việt ngữ Lạc Long Quân)' : $text;
	},
	10,
	2
);

function vln_map_input( $post_id, $key, $label, $args = array() ) {
	$value = vln_map_get( $post_id, $key );
	$type  = isset( $args['type'] ) ? $args['type'] : 'text';
	$list  = isset( $args['list'] ) ? $args['list'] : '';
	printf(
		'<p class="vln-field"><label for="vln_%1$s">%2$s</label><input type="%3$s" id="vln_%1$s" name="vln[%1$s]" value="%4$s" class="widefat" %5$s %6$s></p>',
		esc_attr( $key ),
		esc_html( $label ),
		esc_attr( $type ),
		esc_attr( $value ),
		$list ? 'list="' . esc_attr( $list ) . '"' : '',
		isset( $args['placeholder'] ) ? 'placeholder="' . esc_attr( $args['placeholder'] ) . '"' : ''
	);
}

function vln_map_box_info( $post ) {
	wp_nonce_field( 'vln_save', 'vln_nonce' );
	$id = $post->ID;
	echo '<div class="vln-grid">';
	vln_map_input( $id, 'country', 'Quốc gia', array( 'placeholder' => 'Nhật Bản' ) );
	vln_map_input( $id, 'city', 'Thành phố', array( 'placeholder' => 'Fukuoka' ) );

	$region = vln_map_get( $id, 'region' );
	echo '<p class="vln-field"><label for="vln_region">Khu vực</label><select id="vln_region" name="vln[region]" class="widefat"><option value="">— Chọn khu vực —</option>';
	foreach ( vln_map_regions() as $r ) {
		printf( '<option value="%1$s" %2$s>%1$s</option>', esc_attr( $r ), selected( $region, $r, false ) );
	}
	echo '</select></p>';

	vln_map_input( $id, 'model', 'Mô hình lớp học', array( 'list' => 'vln_models' ) );
	echo '<datalist id="vln_models">';
	foreach ( vln_map_models() as $m ) {
		echo '<option value="' . esc_attr( $m ) . '">';
	}
	echo '</datalist>';

	vln_map_input( $id, 'phone', 'Số điện thoại', array( 'placeholder' => '+81 90 1234 5678' ) );
	vln_map_input( $id, 'email', 'Email', array( 'type' => 'email' ) );
	vln_map_input( $id, 'website', 'Website / Facebook', array( 'type' => 'url', 'placeholder' => 'https://' ) );
	vln_map_input( $id, 'schedule', 'Lịch học', array( 'placeholder' => 'Thứ Bảy, 9:00–11:00' ) );
	vln_map_input( $id, 'language', 'Ngôn ngữ giảng dạy', array( 'placeholder' => 'Tiếng Việt, tiếng Anh' ) );
	echo '</div>';

	$ages = vln_map_get( $id, 'ages' );
	$ages = is_array( $ages ) ? $ages : array();
	echo '<fieldset class="vln-field vln-ages"><legend>Độ tuổi học sinh</legend>';
	foreach ( vln_map_age_groups() as $a ) {
		printf(
			'<label><input type="checkbox" name="vln[ages][]" value="%1$s" %2$s> %1$s</label>',
			esc_attr( $a ),
			checked( in_array( $a, $ages, true ), true, false )
		);
	}
	echo '</fieldset>';

	$linked = (int) vln_map_get( $id, 'linked_post' );
	$posts  = get_posts(
		array(
			'post_type'      => 'post',
			'post_status'    => 'publish',
			'posts_per_page' => 300,
			'orderby'        => 'date',
			'order'          => 'DESC',
		)
	);
	echo '<p class="vln-field"><label for="vln_linked_post">Bài viết giới thiệu lớp (không bắt buộc)</label><select id="vln_linked_post" name="vln[linked_post]" class="widefat"><option value="0">— Không liên kết —</option>';
	foreach ( $posts as $p ) {
		printf( '<option value="%1$d" %2$s>%3$s</option>', (int) $p->ID, selected( $linked, $p->ID, false ), esc_html( get_the_title( $p ) ) );
	}
	echo '</select><span class="description">Khi chọn, khung thông tin trên bản đồ có nút "Xem chi tiết" dẫn tới bài viết này.</span></p>';
}

function vln_map_box_location( $post ) {
	$id  = $post->ID;
	echo '<p class="vln-field"><label for="vln_address">Địa chỉ</label></p>';
	echo '<div class="vln-geo"><input type="text" id="vln_address" name="vln[address]" class="widefat" value="' . esc_attr( vln_map_get( $id, 'address' ) ) . '" placeholder="Số nhà, đường, thành phố, quốc gia">';
	echo '<button type="button" class="button button-primary" id="vln_geocode">Tìm vị trí</button></div>';
	echo '<p class="description" id="vln_geo_msg">Nhập địa chỉ rồi bấm "Tìm vị trí". Có thể bấm lên bản đồ hoặc kéo ghim để chỉnh vị trí chính xác.</p>';
	echo '<div id="vln_picker" class="vln-picker" aria-label="Bản đồ chọn vị trí"></div>';
	echo '<div class="vln-grid vln-grid--2">';
	vln_map_input( $id, 'lat', 'Vĩ độ (latitude)', array( 'placeholder' => '33.5902' ) );
	vln_map_input( $id, 'lng', 'Kinh độ (longitude)', array( 'placeholder' => '130.4017' ) );
	echo '</div>';
}

function vln_map_box_display( $post ) {
	$hidden = '1' === vln_map_get( $post->ID, 'hidden' );
	printf(
		'<label><input type="checkbox" name="vln[visible]" value="1" %s> Hiển thị lớp này trên bản đồ</label><p class="description">Bỏ chọn để tạm ẩn lớp mà không cần xóa.</p>',
		checked( ! $hidden, true, false )
	);
	$url = vln_map_page_url();
	echo '<p><a href="' . esc_url( $url ) . '" target="_blank" rel="noopener">Xem trang bản đồ →</a></p>';
}

add_action(
	'save_post_vln_lop_hoc',
	function ( $post_id ) {
		if ( ! isset( $_POST['vln_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['vln_nonce'] ) ), 'vln_save' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- từng trường được làm sạch bên dưới.
		$in = isset( $_POST['vln'] ) && is_array( $_POST['vln'] ) ? wp_unslash( $_POST['vln'] ) : array();

		foreach ( array_keys( vln_map_text_fields() ) as $key ) {
			$val = isset( $in[ $key ] ) ? $in[ $key ] : '';
			if ( 'email' === $key ) {
				$val = sanitize_email( $val );
			} elseif ( 'website' === $key ) {
				$val = esc_url_raw( $val );
			} else {
				$val = sanitize_text_field( $val );
			}
			update_post_meta( $post_id, '_vln_' . $key, $val );
		}

		$region = isset( $in['region'] ) ? sanitize_text_field( $in['region'] ) : '';
		update_post_meta( $post_id, '_vln_region', in_array( $region, vln_map_regions(), true ) ? $region : '' );

		$ages = isset( $in['ages'] ) && is_array( $in['ages'] ) ? array_values( array_intersect( array_map( 'sanitize_text_field', $in['ages'] ), vln_map_age_groups() ) ) : array();
		update_post_meta( $post_id, '_vln_ages', $ages );

		foreach ( array( 'lat' => 90, 'lng' => 180 ) as $key => $max ) {
			$raw = isset( $in[ $key ] ) ? str_replace( ',', '.', trim( (string) $in[ $key ] ) ) : '';
			$val = is_numeric( $raw ) && abs( (float) $raw ) <= $max ? (string) round( (float) $raw, 7 ) : '';
			update_post_meta( $post_id, '_vln_' . $key, $val );
		}

		update_post_meta( $post_id, '_vln_linked_post', isset( $in['linked_post'] ) ? absint( $in['linked_post'] ) : 0 );
		update_post_meta( $post_id, '_vln_hidden', empty( $in['visible'] ) ? '1' : '0' );
	}
);

/* Thông báo khi lưu mà thiếu tọa độ */
add_action(
	'admin_notices',
	function () {
		$screen = get_current_screen();
		if ( ! $screen || 'vln_lop_hoc' !== $screen->post_type || 'post' !== $screen->base ) {
			return;
		}
		global $post;
		if ( $post && 'publish' === $post->post_status && ! is_numeric( vln_map_get( $post->ID, 'lat' ) ) ) {
			echo '<div class="notice notice-warning"><p>Lớp học này chưa có tọa độ nên <strong>chưa hiện trên bản đồ</strong>. Hãy nhập địa chỉ và bấm "Tìm vị trí", hoặc chọn vị trí trên bản đồ.</p></div>';
		}
	}
);

add_action(
	'admin_enqueue_scripts',
	function ( $hook ) {
		$screen = get_current_screen();
		if ( ! $screen || 'vln_lop_hoc' !== $screen->post_type ) {
			return;
		}
		wp_enqueue_style( 'vln-admin', VLN_MAP_URL . 'assets/admin.css', array(), VLN_MAP_VERSION );
		if ( in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
			vln_map_register_vendor();
			wp_enqueue_style( 'vln-leaflet' );
			wp_enqueue_script( 'vln-admin', VLN_MAP_URL . 'assets/admin.js', array( 'vln-leaflet' ), VLN_MAP_VERSION, true );
			wp_add_inline_script( 'vln-admin', 'window.VLN_ADMIN = ' . wp_json_encode( array( 'tiles' => vln_map_tile_config() ) ) . ';', 'before' );
		}
	}
);
