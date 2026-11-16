import { useEffect, useId, useState } from 'react';
import { fontFamilySchema } from '@open-cavas/document/font-family';
import { fonts } from '@open-cavas/document/model';

/** Suggestions stay small; typing a family never enumerates private local fonts. */
export function FontFamilyField({ value, onCommit }: { value: string; onCommit: (family: string) => void }) {
  const suggestionsId = useId();
  const errorId = useId();
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState('');
  useEffect(() => { setDraft(value); setError(''); }, [value]);
  function commit() {
    const result = fontFamilySchema.safeParse(draft);
    if (!result.success) {
      setError('Enter a family name of 1 to 100 characters, not a URL.');
      return;
    }
    setDraft(result.data);
    setError('');
    if (result.data !== value) onCommit(result.data);
  }
  return <>
    <label className="stacked-field">Font family<input className="text-input" aria-label="Font family" list={suggestionsId} value={draft} maxLength={100} aria-invalid={!!error} aria-describedby={error ? errorId : undefined}
      onChange={(event) => { setDraft(event.target.value); setError(''); }} onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') { setDraft(value); setError(''); }
      }} /></label>
    <datalist id={suggestionsId}>{fonts.map((font) => <option key={font} value={font} />)}</datalist>
    {error && <p id={errorId} className="font-status" role="alert">{error}</p>}
  </>;
}
