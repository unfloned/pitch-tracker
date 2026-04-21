import { describe, expect, it } from 'vitest';
import { stripHtml } from '../src/shared/html';

describe('stripHtml', () => {
    it('returns empty string for empty input', () => {
        expect(stripHtml('')).toBe('');
    });

    it('strips basic tags and keeps text', () => {
        expect(stripHtml('<p>Hallo <b>Welt</b></p>')).toBe('Hallo Welt');
    });

    it('converts <br> to newline', () => {
        expect(stripHtml('Zeile 1<br>Zeile 2<br/>Zeile 3')).toBe(
            'Zeile 1\nZeile 2\nZeile 3',
        );
    });

    it('converts list items to bullets', () => {
        expect(stripHtml('<ul><li>Eins</li><li>Zwei</li></ul>')).toBe('• Eins\n• Zwei');
    });

    it('decodes common html entities', () => {
        expect(stripHtml('&lt;tag&gt; &amp; &quot;stuff&quot;')).toBe('<tag> & "stuff"');
    });

    it('collapses excessive blank lines', () => {
        expect(stripHtml('<p>A</p><p></p><p></p><p>B</p>')).toBe('A\n\nB');
    });
});
