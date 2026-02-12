/**
 * JobsTable Component
 *
 * Displays the jobs list in a table format with loading and empty states.
 */

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const getStatusClass = ( status ) => {
	if ( ! status ) {
		return 'datamachine-status--neutral';
	}
	const baseStatus = status.split( ' - ' )[ 0 ];
	if ( baseStatus === 'failed' ) {
		return 'datamachine-status--error';
	}
	if ( baseStatus === 'completed' ) {
		return 'datamachine-status--success';
	}
	return 'datamachine-status--neutral';
};

const formatStatus = ( status ) => {
	if ( ! status ) {
		return __( 'Unknown', 'data-machine' );
	}
	return (
		status.charAt( 0 ).toUpperCase() +
		status.slice( 1 ).replace( /_/g, ' ' )
	);
};

const SOURCE_COLORS = {
	pipeline: '#2271b1',
	chat: '#00a32a',
	system: '#8c5cb3',
	api: '#dba617',
	direct: '#787c82',
};

const SourceBadge = ( { source } ) => {
	const color = SOURCE_COLORS[ source ] || SOURCE_COLORS.direct;
	return (
		<span
			style={ {
				display: 'inline-block',
				padding: '2px 6px',
				borderRadius: '3px',
				fontSize: '11px',
				color: '#fff',
				backgroundColor: color,
				marginRight: '8px',
			} }
		>
			{ source || 'unknown' }
		</span>
	);
};

const JobsTable = ( { jobs, isLoading, isError, error } ) => {
	if ( isLoading ) {
		return (
			<div className="datamachine-jobs-loading">
				<Spinner />
				<span>{ __( 'Loading jobs…', 'data-machine' ) }</span>
			</div>
		);
	}

	if ( isError ) {
		return (
			<div className="datamachine-jobs-error">
				{ error?.message ||
					__( 'Failed to load jobs.', 'data-machine' ) }
			</div>
		);
	}

	if ( ! jobs || jobs.length === 0 ) {
		return (
			<div className="datamachine-jobs-empty-state">
				<p className="datamachine-jobs-empty-message">
					{ __(
						'No jobs found. Jobs will appear here when Data Machine processes data.',
						'data-machine'
					) }
				</p>
			</div>
		);
	}

	return (
		<div className="datamachine-jobs-table-container">
			<table className="wp-list-table widefat fixed striped">
				<thead>
					<tr>
						<th className="datamachine-col-job-id">
							{ __( 'Job ID', 'data-machine' ) }
						</th>
						<th>{ __( 'Source', 'data-machine' ) }</th>
						<th className="datamachine-col-status">
							{ __( 'Status', 'data-machine' ) }
						</th>
						<th className="datamachine-col-created">
							{ __( 'Created At', 'data-machine' ) }
						</th>
						<th className="datamachine-col-completed">
							{ __( 'Completed At', 'data-machine' ) }
						</th>
					</tr>
				</thead>
				<tbody>
					{ jobs.map( ( job ) => (
						<tr key={ job.job_id }>
							<td>
								<strong>{ job.job_id }</strong>
							</td>
							<td>
								<SourceBadge
									source={ job.source }
								/>
								{ job.display_label ||
									__( 'Unknown', 'data-machine' ) }
							</td>
							<td>
								<span
									className={ getStatusClass( job.status ) }
								>
									{ formatStatus( job.status ) }
								</span>
							</td>
							<td>{ job.created_at_display || '' }</td>
							<td>{ job.completed_at_display || '' }</td>
						</tr>
					) ) }
				</tbody>
			</table>
		</div>
	);
};

export default JobsTable;
