import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../../preload/index';
import { DEFAULT_TEMPLATE, type Mode, renderTemplate } from './types';

interface Options {
    opened: boolean;
    application: ApplicationRecord | null;
    autoMarkApplied: boolean;
    autoDraft: boolean;
    onClose: () => void;
    onSent?: () => void;
}

/**
 * State and side-effects for the email drawer: loads profile + smtp check +
 * llm status, fills the initial template, auto-drafts via the LLM when asked,
 * and wires up send with optional status='applied' write-back.
 */
export function useEmailDialog({
    opened,
    application,
    autoMarkApplied,
    autoDraft,
    onClose,
    onSent,
}: Options) {
    const { t } = useTranslation();
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachCv, setAttachCv] = useState(true);
    const [sending, setSending] = useState(false);
    const [drafting, setDrafting] = useState(false);
    const [smtpOk, setSmtpOk] = useState<boolean | null>(null);
    const [profileSet, setProfileSet] = useState<boolean | null>(null);
    const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null);
    const [mode, setMode] = useState<Mode>('edit');
    const [fromAddress, setFromAddress] = useState('');
    const [fromName, setFromName] = useState('');
    const [autoDraftDone, setAutoDraftDone] = useState(false);

    useEffect(() => {
        if (!opened || !application) return;
        setMode('edit');
        setAutoDraftDone(false);
        window.api.profile.get().then((p) => {
            const configured = Boolean(p.smtpHost && p.smtpUser);
            setProfileSet(configured);
            setFromAddress(p.smtpUser || p.email || '');
            setFromName(p.smtpFromName || p.fullName || '');

            const vars: Record<string, string> = {
                company: application.companyName || '',
                jobTitle: application.jobTitle || '',
                contactName: application.contactName || '',
                greeting: application.contactName ? ` ${application.contactName}` : '',
                name: p.fullName || '',
                signature: p.signature ? `<p>${p.signature.replace(/\n/g, '<br/>')}</p>` : '',
            };

            setTo(application.contactEmail || '');
            setSubject(
                `Bewerbung: ${application.jobTitle || ''}${
                    application.companyName ? ' - ' + application.companyName : ''
                }`.trim(),
            );
            setBody(renderTemplate(DEFAULT_TEMPLATE, vars));
            setAttachCv(Boolean(p.cvPath));
        });
        window.api.email
            .verify()
            .then((r) => setSmtpOk(r.ok))
            .catch(() => setSmtpOk(false));
        window.api.llm
            .status()
            .then((s) => setOllamaRunning(s.running))
            .catch(() => setOllamaRunning(false));
    }, [opened, application]);

    const draft = async () => {
        if (!application) return;
        setDrafting(true);
        try {
            const result = await window.api.llm.draftEmail(application.id);
            if (result.subject) setSubject(result.subject);
            if (result.body) setBody(result.body);
            notifications.show({
                color: 'green',
                message: t('email.draftOk', 'Entwurf erstellt'),
            });
            setMode('preview');
        } catch (err) {
            notifications.show({
                color: 'red',
                title: t('email.draftFailed', 'Entwurf fehlgeschlagen'),
                message: (err as Error).message,
                autoClose: 10000,
            });
        } finally {
            setDrafting(false);
        }
    };

    // Kick off an LLM draft automatically once Ollama is confirmed running.
    useEffect(() => {
        if (!opened || !autoDraft || autoDraftDone) return;
        if (ollamaRunning !== true) return;
        setAutoDraftDone(true);
        draft();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, autoDraft, autoDraftDone, ollamaRunning]);

    const send = async () => {
        if (!application) return;
        setSending(true);
        const result = await window.api.email.send({
            to,
            subject,
            body,
            attachCv,
            applicationId: application.id,
        });
        if (!result.ok) {
            setSending(false);
            notifications.show({
                color: 'red',
                title: t('email.sendFailed'),
                message: result.error ?? 'Unknown error',
                autoClose: 10000,
            });
            return;
        }

        if (autoMarkApplied && application.status !== 'applied') {
            try {
                await window.api.applications.update(application.id, {
                    status: 'applied',
                    appliedAt: new Date(),
                });
            } catch {
                // non-fatal, email already went out
            }
        }

        setSending(false);
        notifications.show({ color: 'green', message: t('email.sentOk') });
        onSent?.();
        onClose();
    };

    const canSend = Boolean(to && subject && profileSet && smtpOk !== false);

    return {
        to,
        setTo,
        subject,
        setSubject,
        body,
        setBody,
        attachCv,
        setAttachCv,
        sending,
        drafting,
        smtpOk,
        profileSet,
        ollamaRunning,
        mode,
        setMode,
        fromAddress,
        fromName,
        draft,
        send,
        canSend,
    };
}
