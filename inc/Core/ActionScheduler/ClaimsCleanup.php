<?php
/**
 * Action Scheduler Claims Cleanup
 *
 * Periodically removes stale claims from the Action Scheduler claims table.
 * Claims become orphaned when jobs crash or timeout without releasing their claim.
 *
 * @package DataMachine\Core\ActionScheduler
 * @since 0.20.4
 */

namespace DataMachine\Core\ActionScheduler;

defined( 'ABSPATH' ) || exit;

/**
 * Register the cleanup action handler.
 */
add_action(
	'datamachine_cleanup_stale_claims',
	function () {
		global $wpdb;

		$table = $wpdb->prefix . 'actionscheduler_claims';

		// Delete claims older than 1 hour.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$deleted = $wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$table} WHERE date_created_gmt < %s", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				gmdate( 'Y-m-d H:i:s', time() - HOUR_IN_SECONDS )
			)
		);

		if ( false !== $deleted && $deleted > 0 ) {
			do_action(
				'datamachine_log',
				'info',
				'ActionScheduler: Cleaned up stale claims',
				array( 'claims_deleted' => $deleted )
			);
		}
	}
);

/**
 * Schedule the cleanup job after Action Scheduler is initialized.
 * Only runs in admin context to avoid database queries on frontend.
 */
add_action(
	'action_scheduler_init',
	function () {
		if ( ! is_admin() ) {
			return;
		}

		if ( ! as_next_scheduled_action( 'datamachine_cleanup_stale_claims', array(), 'datamachine-maintenance' ) ) {
			as_schedule_recurring_action(
				time() + DAY_IN_SECONDS,
				DAY_IN_SECONDS,
				'datamachine_cleanup_stale_claims',
				array(),
				'datamachine-maintenance'
			);
		}
	}
);
