<!DOCTYPE html>
<html <?php language_attributes(); ?>>

<head>
	<meta charset="<?php bloginfo("charset"); ?>" />
	<meta http-equiv="X-UA-Compatible" content="IE=edge" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<link rel="icon" href="<?php img_path("/common/favicon.ico"); ?>" sizes="any" />
	<?php include_once "template-parts/adjust-admin-bar.php"; ?>
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
	<div class="body-container">
		<?php get_template_part("template-parts/header"); ?>
