/**
 * ModalManager Component
 *
 * Centralized modal rendering and callback logic for the pipelines page.
 * Owns all modal-to-modal navigation callbacks, eliminating prop drilling
 * through PipelinesApp.
 */

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * External dependencies
 */
import { useQueryClient } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { useUIStore } from '../../stores/uiStore';
import { useHandlers, useHandlerDetails } from '../../queries/handlers';
import { useUpdateFlowHandler } from '../../queries/flows';
import { MODAL_TYPES } from '../../utils/constants';
import ModalSwitch from './ModalSwitch';
import { HandlerProvider } from '../../context/HandlerProvider';

export default function ModalManager() {
	const { activeModal, modalData, openModal, closeModal } = useUIStore();
	const { data: handlers = {} } = useHandlers();
	const updateHandlerMutation = useUpdateFlowHandler();

	// Fetch handler details when settings modal is open and not already seeded.
	const handlerSlug =
		activeModal === MODAL_TYPES.HANDLER_SETTINGS &&
		! modalData?.handlerDetails
			? modalData?.handlerSlug
			: null;
	const { data: handlerDetails } = useHandlerDetails( handlerSlug );

	/**
	 * Close the active modal.
	 */
	const handleSuccess = useCallback( () => {
		closeModal();
	}, [ closeModal ] );

	/**
	 * Handler selected in HandlerSelectionModal — persist to flow step,
	 * then transition to HandlerSettingsModal.
	 */
	const handleHandlerSelected = useCallback(
		async ( selectedHandlerSlug ) => {
			const result = await updateHandlerMutation.mutateAsync( {
				flowStepId: modalData.flowStepId,
				handlerSlug: selectedHandlerSlug,
				settings: {},
				pipelineId: modalData.pipelineId,
				stepType: modalData.stepType,
			} );

			if ( ! result || ! result.success ) {
				const message =
					result?.message ||
					'Failed to assign handler to this flow step.';
				throw new Error( message );
			}

			openModal( MODAL_TYPES.HANDLER_SETTINGS, {
				...modalData,
				handlerSlug: selectedHandlerSlug,
				currentSettings:
					result?.data?.step_config?.handler_config || {},
			} );
		},
		[ openModal, modalData, updateHandlerMutation ]
	);

	/**
	 * Navigate from HandlerSettingsModal → HandlerSelectionModal.
	 */
	const handleChangeHandler = useCallback( () => {
		openModal( MODAL_TYPES.HANDLER_SELECTION, modalData );
	}, [ openModal, modalData ] );

	/**
	 * Navigate from HandlerSettingsModal → OAuthModal.
	 */
	const handleOAuthConnect = useCallback(
		( oauthHandlerSlug, handlerInfo ) => {
			openModal( MODAL_TYPES.OAUTH, {
				...modalData,
				handlerSlug: oauthHandlerSlug,
				handlerInfo,
			} );
		},
		[ openModal, modalData ]
	);

	/**
	 * Navigate from OAuthModal → HandlerSettingsModal.
	 */
	const handleBackToSettings = useCallback( () => {
		openModal( MODAL_TYPES.HANDLER_SETTINGS, modalData );
	}, [ openModal, modalData ] );

	if ( ! activeModal ) {
		return null;
	}

	const baseProps = {
		onClose: closeModal,
		...modalData,
		onSuccess: handleSuccess,
		handlers,
		handlerDetails: modalData?.handlerDetails ?? handlerDetails,
		onChangeHandler: handleChangeHandler,
		onOAuthConnect: handleOAuthConnect,
		onBackToSettings: handleBackToSettings,
		onSelectHandler: handleHandlerSelected,
	};

	return (
		<HandlerProvider>
			<ModalSwitch
				activeModal={ activeModal }
				baseProps={ baseProps }
				modalData={ modalData }
			/>
		</HandlerProvider>
	);
}
