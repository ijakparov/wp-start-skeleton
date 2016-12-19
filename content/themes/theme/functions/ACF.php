<?
if( function_exists('acf_add_options_page') ) {
	
	acf_add_options_page();
	acf_set_options_page_menu( __('Настройки') );
  	acf_add_options_sub_page('Настройки Лэндинга');
  	acf_add_options_sub_page('Подарки');

	
}