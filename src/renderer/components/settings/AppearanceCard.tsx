import { SegmentedControl, Slider, useMantineColorScheme } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setLanguage, type Language } from '../../i18n';
import { applyZoom, loadZoom, saveZoom, ZOOM_MAX, ZOOM_MIN } from '../../lib/zoom';
import { SettingsRow, SettingsSection } from './SettingsSection';

/** Theme, language, and zoom controls. */
export function AppearanceCard() {
    const { t, i18n } = useTranslation();
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const [zoom, setZoom] = useState(() => loadZoom());

    const updateZoomContent = (v: number) => {
        const next = { ...zoom, content: v };
        setZoom(next);
        applyZoom(next);
        saveZoom(next);
    };
    const updateZoomSidebar = (v: number) => {
        const next = { ...zoom, sidebar: v };
        setZoom(next);
        applyZoom(next);
        saveZoom(next);
    };

    return (
        <SettingsSection label={t('settings.appearance')}>
            <SettingsRow label={t('settings.theme')}>
                <SegmentedControl
                    value={colorScheme}
                    onChange={(v) => setColorScheme(v as 'light' | 'dark' | 'auto')}
                    data={[
                        { value: 'light', label: t('settings.themeLight') },
                        { value: 'dark', label: t('settings.themeDark') },
                        { value: 'auto', label: t('settings.themeSystem') },
                    ]}
                    size="xs"
                />
            </SettingsRow>
            <SettingsRow label={t('settings.language')}>
                <SegmentedControl
                    value={i18n.language.startsWith('de') ? 'de' : 'en'}
                    onChange={(v) => setLanguage(v as Language)}
                    data={[
                        { value: 'de', label: t('settings.languageGerman') },
                        { value: 'en', label: t('settings.languageEnglish') },
                    ]}
                    size="xs"
                />
            </SettingsRow>
            <SettingsRow
                label={t('settings.zoomContent')}
                description={t('settings.zoomContentHint')}
            >
                <div style={{ width: 200 }}>
                    <Slider
                        min={ZOOM_MIN}
                        max={ZOOM_MAX}
                        step={0.05}
                        value={zoom.content}
                        onChange={updateZoomContent}
                        label={(v) => `${Math.round(v * 100)} %`}
                        marks={[{ value: 1, label: '100 %' }]}
                        size="sm"
                    />
                </div>
            </SettingsRow>
            <SettingsRow
                label={t('settings.zoomSidebar')}
                description={t('settings.zoomSidebarHint')}
            >
                <div style={{ width: 200 }}>
                    <Slider
                        min={ZOOM_MIN}
                        max={ZOOM_MAX}
                        step={0.05}
                        value={zoom.sidebar}
                        onChange={updateZoomSidebar}
                        label={(v) => `${Math.round(v * 100)} %`}
                        marks={[{ value: 1, label: '100 %' }]}
                        size="sm"
                    />
                </div>
            </SettingsRow>
        </SettingsSection>
    );
}
