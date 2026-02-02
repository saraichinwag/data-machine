<?php
/**
 * Abilities API Helper Functions.
 *
 * Provides helper functions for working with WordPress Abilities API.
 *
 * @package DataMachine\Engine\Helpers
 * @since 0.19.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Execute a registered ability by name.
 *
 * Wrapper around WP_Abilities_Registry that provides a simple function
 * interface for executing abilities.
 *
 * @param string $ability_name The ability name (e.g., 'datamachine/send-ping').
 * @param array  $input        The input parameters for the ability.
 * @return array The ability execution result, or error array if failed.
 */
function wp_execute_ability( string $ability_name, array $input = array() ): array {
	// Check if Abilities API is available
	if ( ! class_exists( 'WP_Abilities_Registry' ) ) {
		return array(
			'success' => false,
			'error'   => 'WordPress Abilities API not available (requires WordPress 6.9+)',
		);
	}

	// Get the registry
	$registry = WP_Abilities_Registry::get_instance();

	// Get the ability
	$ability = $registry->get_ability( $ability_name );

	if ( ! $ability ) {
		return array(
			'success' => false,
			'error'   => sprintf( 'Ability "%s" not registered', $ability_name ),
		);
	}

	// Check permissions
	if ( ! $ability->check_permissions() ) {
		return array(
			'success' => false,
			'error'   => sprintf( 'Permission denied for ability "%s"', $ability_name ),
		);
	}

	// Validate input
	$validation = $ability->validate_input( $input );
	if ( is_wp_error( $validation ) ) {
		return array(
			'success' => false,
			'error'   => $validation->get_error_message(),
		);
	}

	// Execute the ability
	try {
		$result = $ability->execute( $input );

		// Handle WP_Error returns
		if ( is_wp_error( $result ) ) {
			return array(
				'success' => false,
				'error'   => $result->get_error_message(),
			);
		}

		// Wrap in success response if not already structured
		if ( ! is_array( $result ) || ! isset( $result['success'] ) ) {
			return array(
				'success' => true,
				'data'    => $result,
			);
		}

		return $result;
	} catch ( \Exception $e ) {
		return array(
			'success' => false,
			'error'   => $e->getMessage(),
		);
	}
}
