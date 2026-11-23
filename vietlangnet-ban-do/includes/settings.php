<?php
/**
 * Trang Cài đặt: API key, đường dẫn trang bản đồ, logo.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function vln_map_defaults() {
	return array(
		'api_key'   => '',
		'slug'      => 'ban-do-lop-hoc',
		'logo'      => '',
		'title'     => 'Bản đồ lớp học tiếng Việt toàn cầu',
		'subtitle'  => 'Mạng lưới tiếng Việt toàn cầu',
	);
}

function vln_map_setting( $key ) {
	$opts = wp_parse_args( (array) get_option( 'vln_map_settings', array() ), vln_map_defaults() );
	return isset( $opts[ $key ] ) ? $opts[ $key ] : '';
}

/** Logo: ưu tiên ảnh trong cài đặt, sau đó logo của theme VIETLANGNET, cuối cùng là icon site. */
function vln_map_logo_url() {
	$logo = vln_map_setting( 'logo' );
	if ( $logo ) {
		return $logo;
	}
	$theme_logo = get_stylesheet_directory() . '/assets/img/logo.png';
	if ( file_exists( $theme_logo ) ) {
		return get_stylesheet_directory_uri() . '/assets/img/logo.png';
	}
	return get_site_icon_url( 96 );
}

add_action(
	'admin_menu',
	function () {
		add_submenu_page( 'edit.php?post_type=vln_lop_hoc', 'Cài đặt bản đồ', 'Cài đặt', 'manage_options', 'vln-settings', 'vln_map_settings_page' );
	}
);

add_action(
	'admin_init',
	function () {
		register_setting(
			'vln_map',
			'vln_map_settings',
			array(
				'type'              => 'array',
				'sanitize_callback' => function ( $in ) {
					$in  = (array) $in;
					$out = vln_map_defaults();
					$out['api_key']  = isset( $in['api_key'] ) ? sanitize_text_field( $in['api_key'] ) : '';
					$slug            = isset( $in['slug'] ) ? sanitize_title( $in['slug'] ) : '';
					$out['slug']     = $slug ? $slug : 'ban-do-lop-hoc';
					$out['logo']     = isset( $in['logo'] ) ? esc_url_raw( $in['logo'] ) : '';
					$out['title']    = isset( $in['title'] ) && '' !== trim( $in['title'] ) ? sanitize_text_field( $in['title'] ) : $out['title'];
					$out['subtitle'] = isset( $in['subtitle'] ) ? sanitize_text_field( $in['subtitle'] ) : '';
					update_option( 'vln_map_flush', 1 );
					return $out;
				},
			)
		);
	}
);

function vln_map_settings_page() {
	$o = wp_parse_args( (array) get_option( 'vln_map_settings', array() ), vln_map_defaults() );
	?>
	<div class="wrap vln-settings">
		<h1>Cài đặt bản đồ lớp học</h1>
		<form method="post" action="options.php">
			<?php settings_fields( 'vln_map' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="vln_api_key">Google Maps API key</label></th>
					<td>
						<input type="text" id="vln_api_key" name="vln_map_settings[api_key]" value="<?php echo esc_attr( $o['api_key'] ); ?>" class="regular-text code" autocomplete="off">
						<p class="description">Tạo trong Google Cloud Console, bật <strong>Maps JavaScript API</strong> và <strong>Geocoding API</strong>. Nên giới hạn key theo tên miền của site (HTTP referrers).</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="vln_slug">Đường dẫn trang bản đồ</label></th>
					<td>
						<code><?php echo esc_html( trailingslashit( home_url() ) ); ?></code><input type="text" id="vln_slug" name="vln_map_settings[slug]" value="<?php echo esc_attr( $o['slug'] ); ?>" class="regular-text">
						<p class="description">Trang bản đồ toàn màn hình: <a href="<?php echo esc_url( vln_map_page_url() ); ?>" target="_blank" rel="noopener"><?php echo esc_html( vln_map_page_url() ); ?></a>. Thêm link này vào menu ở <em>Giao diện → Menu → Liên kết tự tạo</em>.</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="vln_title">Tiêu đề trang bản đồ</label></th>
					<td><input type="text" id="vln_title" name="vln_map_settings[title]" value="<?php echo esc_attr( $o['title'] ); ?>" class="regular-text"></td>
				</tr>
				<tr>
					<th scope="row"><label for="vln_subtitle">Dòng chữ dưới logo</label></th>
					<td><input type="text" id="vln_subtitle" name="vln_map_settings[subtitle]" value="<?php echo esc_attr( $o['subtitle'] ); ?>" class="regular-text"></td>
				</tr>
				<tr>
					<th scope="row"><label for="vln_logo">Logo (URL ảnh)</label></th>
					<td>
						<input type="url" id="vln_logo" name="vln_map_settings[logo]" value="<?php echo esc_attr( $o['logo'] ); ?>" class="regular-text" placeholder="Để trống để dùng logo của theme">
						<p class="description">Hiện đang dùng: <?php $l = vln_map_logo_url(); echo $l ? '<img src="' . esc_url( $l ) . '" alt="" style="width:28px;height:28px;vertical-align:middle;border-radius:50%">' : 'chưa có logo'; ?></p>
					</td>
				</tr>
			</table>
			<?php submit_button( 'Lưu cài đặt' ); ?>
		</form>
		<h2>Cách dùng</h2>
		<ol>
			<li>Thêm lớp học ở <strong>Bản đồ lớp học → Thêm lớp học</strong>. Lớp có tọa độ và bật "Hiển thị" sẽ tự hiện trên bản đồ.</li>
			<li>Trang bản đồ toàn màn hình: <code><?php echo esc_html( vln_map_page_url() ); ?></code></li>
			<li>Muốn nhúng bản đồ vào một trang hoặc bài viết khác: dùng shortcode <code>[vln_ban_do]</code> (có thể đặt chiều cao: <code>[vln_ban_do height="600"]</code>).</li>
		</ol>
	</div>
	<?php
}
