/**
 * Memory Files Selector Component (Shared)
 *
 * Reusable component for selecting agent memory files.
 * Used by both pipeline-scoped and flow-scoped memory file UIs.
 */

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { CheckboxControl, Button, Notice, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useAgentFiles } from '../../queries/pipelines';

/**
 * Files to exclude from the memory files picker (always injected separately).
 */
const EXCLUDED_FILES = [ 'SOUL.md', 'USER.md', 'MEMORY.md' ];

/**
 * Memory Files Selector Component
 *
 * @param {Object}   props               - Component props
 * @param {string}   props.scopeLabel    - Label for the scope (e.g. 'pipeline', 'flow')
 * @param {Array}    props.selectedFiles - Currently selected filenames
 * @param {boolean}  props.isLoading     - Whether selected files are loading
 * @param {Object}   props.updateMutation - TanStack mutation for saving
 * @return {React.ReactElement} Memory files selector
 */
export default function MemoryFilesSelector( {
	scopeLabel,
	selectedFiles = [],
	isLoading: loadingSelected = false,
	updateMutation,
} ) {
	const { data: agentFiles = [], isLoading: loadingAgent } =
		useAgentFiles();

	const [ localSelected, setLocalSelected ] = useState( [] );
	const [ success, setSuccess ] = useState( null );

	// Sync local state when server data loads.
	useEffect( () => {
		setLocalSelected( selectedFiles );
	}, [ selectedFiles ] );

	const loading = loadingAgent || loadingSelected;

	// Filter out core files and non-text files.
	const availableFiles = agentFiles
		.map( ( f ) => ( typeof f === 'string' ? f : f.name || f.filename ) )
		.filter( ( name ) => name && ! EXCLUDED_FILES.includes( name ) );

	const handleToggle = ( filename, checked ) => {
		setLocalSelected( ( prev ) =>
			checked
				? [ ...prev, filename ]
				: prev.filter( ( f ) => f !== filename )
		);
	};

	const handleSave = async () => {
		setSuccess( null );
		try {
			await updateMutation.mutateAsync( localSelected );
			setSuccess(
				__( 'Memory files updated successfully!', 'data-machine' )
			);
		} catch ( err ) {
			// eslint-disable-next-line no-console
			console.error( 'Memory files save error:', err );
		}
	};

	const isDirty =
		JSON.stringify( [ ...localSelected ].sort() ) !==
		JSON.stringify( [ ...selectedFiles ].sort() );

	return (
		<div className="datamachine-memory-files-selector">
			<h3
				style={ {
					margin: '0 0 8px 0',
					fontSize: '16px',
					fontWeight: '600',
				} }
			>
				{ __( 'Agent Memory Files', 'data-machine' ) }
			</h3>
			<p
				style={ {
					margin: '0 0 16px 0',
					color: '#757575',
					fontSize: '13px',
				} }
			>
				{ __(
					`Select agent memory files to include as AI context for this ${ scopeLabel }.`,
					'data-machine'
				) }
			</p>

			{ success && (
				<Notice
					status="success"
					isDismissible
					onRemove={ () => setSuccess( null ) }
				>
					<p>{ success }</p>
				</Notice>
			) }

			{ updateMutation.isError && (
				<Notice status="error" isDismissible={ false }>
					<p>
						{ __(
							'Failed to save memory files.',
							'data-machine'
						) }
					</p>
				</Notice>
			) }

			{ loading ? (
				<div
					style={ {
						textAlign: 'center',
						padding: '20px',
						color: '#757575',
					} }
				>
					<Spinner />
				</div>
			) : availableFiles.length === 0 ? (
				<p
					style={ {
						color: '#757575',
						fontStyle: 'italic',
						padding: '12px 0',
					} }
				>
					{ __(
						'No agent memory files available. Upload files to the agent directory first.',
						'data-machine'
					) }
				</p>
			) : (
				<>
					<div
						style={ {
							display: 'flex',
							flexDirection: 'column',
							gap: '8px',
							marginBottom: '16px',
						} }
					>
						{ availableFiles.map( ( filename ) => (
							<CheckboxControl
								key={ filename }
								label={ filename }
								checked={ localSelected.includes( filename ) }
								onChange={ ( checked ) =>
									handleToggle( filename, checked )
								}
							/>
						) ) }
					</div>

					<Button
						variant="primary"
						onClick={ handleSave }
						disabled={ ! isDirty || updateMutation.isPending }
						isBusy={ updateMutation.isPending }
					>
						{ updateMutation.isPending
							? __( 'Saving…', 'data-machine' )
							: __( 'Save Memory Files', 'data-machine' ) }
					</Button>
				</>
			) }
		</div>
	);
}
