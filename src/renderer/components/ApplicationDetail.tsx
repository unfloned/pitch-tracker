import { useState } from 'react';
import type { ApplicationRecord } from '../../preload/index';
import { DetailFooter } from './application-detail/DetailFooter';
import { DetailHeader } from './application-detail/DetailHeader';
import { EmailHistory } from './application-detail/EmailHistory';
import { FactsGrid } from './application-detail/FactsGrid';
import { NotesBlock } from './application-detail/NotesBlock';
import { ProfileAndBenefits } from './application-detail/ProfileAndBenefits';
import { Timeline } from './application-detail/Timeline';
import { WhyBlock } from './application-detail/WhyBlock';
import { useApplicationRelations } from './application-detail/useApplicationRelations';
import { EmailSendDialog } from './EmailSendDialog';

interface Props {
    app: ApplicationRecord;
    onEdit: (app: ApplicationRecord) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

/**
 * Split-pane application detail. Composes header, body sections, and footer
 * from the `application-detail/` sub-components. Owns the email dialog state
 * because the footer triggers it and the history has to refresh after send.
 */
export function ApplicationDetail({ app, onEdit, onDelete, onClose }: Props) {
    const { events, emails, reloadEmails } = useApplicationRelations(app.id);
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [autoApplyMode, setAutoApplyMode] = useState(false);

    const openEmail = (autoApply: boolean) => {
        setAutoApplyMode(autoApply);
        setEmailDialogOpen(true);
    };

    return (
        <div
            style={{
                width: 520,
                minWidth: 520,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--paper)',
                borderLeft: '1px solid var(--rule-strong)',
                minHeight: 0,
            }}
        >
            <DetailHeader app={app} onEdit={onEdit} onClose={onClose} />

            <div style={{ flex: 1, overflow: 'auto', padding: '18px 22px' }}>
                <FactsGrid app={app} />
                <WhyBlock app={app} />
                <ProfileAndBenefits app={app} />
                <Timeline events={events} createdAt={app.createdAt} />
                <EmailHistory emails={emails} />
                <NotesBlock notes={app.notes} />
            </div>

            <DetailFooter app={app} onEdit={onEdit} onDelete={onDelete} onEmail={openEmail} />

            <EmailSendDialog
                opened={emailDialogOpen}
                onClose={() => setEmailDialogOpen(false)}
                application={app}
                autoMarkApplied={autoApplyMode}
                autoDraft
                onSent={reloadEmails}
            />
        </div>
    );
}
