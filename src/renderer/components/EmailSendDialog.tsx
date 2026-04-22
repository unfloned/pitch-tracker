import { Drawer, ScrollArea } from '@mantine/core';
import type { ApplicationRecord } from '../../preload/index';
import { EmailEditor } from './email-dialog/EmailEditor';
import { EmailFooter } from './email-dialog/EmailFooter';
import { EmailHeader } from './email-dialog/EmailHeader';
import { EmailPreview } from './email-dialog/EmailPreview';
import { useEmailDialog } from './email-dialog/useEmailDialog';

interface Props {
    opened: boolean;
    onClose: () => void;
    application: ApplicationRecord | null;
    /** When true: after successful send, set application status to 'applied'. */
    autoMarkApplied?: boolean;
    /** When true: auto-trigger the LLM draft once on open. */
    autoDraft?: boolean;
    /** Called after send succeeds — parent can refresh, clear selection, etc. */
    onSent?: () => void;
}

/**
 * Side drawer for composing + previewing a cover email. All state lives in
 * useEmailDialog; this container just composes header, edit/preview body,
 * and footer.
 */
export function EmailSendDialog({
    opened,
    onClose,
    application,
    autoMarkApplied = false,
    autoDraft = false,
    onSent,
}: Props) {
    const ctrl = useEmailDialog({
        opened,
        application,
        autoMarkApplied,
        autoDraft,
        onClose,
        onSent,
    });

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            withCloseButton={false}
            position="right"
            size="lg"
            padding={0}
            scrollAreaComponent={ScrollArea.Autosize}
            overlayProps={{ backgroundOpacity: 0.3, blur: 2 }}
            styles={{
                content: { display: 'flex', flexDirection: 'column' },
                body: {
                    padding: 0,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                },
            }}
        >
            <EmailHeader
                application={application}
                mode={ctrl.mode}
                onModeChange={ctrl.setMode}
                profileSet={ctrl.profileSet}
                smtpOk={ctrl.smtpOk}
                onClose={onClose}
            />

            <div style={{ flex: 1, overflow: 'auto', padding: '18px 22px' }}>
                {ctrl.mode === 'edit' ? (
                    <EmailEditor
                        to={ctrl.to}
                        onTo={ctrl.setTo}
                        subject={ctrl.subject}
                        onSubject={ctrl.setSubject}
                        body={ctrl.body}
                        onBody={ctrl.setBody}
                        attachCv={ctrl.attachCv}
                        onAttachCv={ctrl.setAttachCv}
                    />
                ) : (
                    <EmailPreview
                        fromAddress={ctrl.fromAddress}
                        fromName={ctrl.fromName}
                        to={ctrl.to}
                        subject={ctrl.subject}
                        body={ctrl.body}
                        attachCv={ctrl.attachCv}
                    />
                )}
            </div>

            <EmailFooter
                ollamaRunning={ctrl.ollamaRunning}
                drafting={ctrl.drafting}
                sending={ctrl.sending}
                canSend={ctrl.canSend}
                onDraft={ctrl.draft}
                onCancel={onClose}
                onSend={ctrl.send}
            />
        </Drawer>
    );
}
