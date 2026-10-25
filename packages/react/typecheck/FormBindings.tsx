// Type test, checked by tsc in `pnpm typecheck` (not part of the package): the bind helpers of /form fit the
// components they are meant for
import { useForm } from '@tanstack/react-form';
import { Input } from '../src/components/Input/Input.js';
import { MaskInput } from '../src/components/MaskInput/MaskInput.js';
import { PasswordInput } from '../src/components/PasswordInput/PasswordInput.js';
import { SearchField } from '../src/components/SearchField/SearchField.js';
import { Textarea } from '../src/components/Textarea/Textarea.js';
import { bindInput, bindValue } from '../src/form/bind.js';

export function FormBindings() {
    const form = useForm({ defaultValues: { name: '', note: '', password: '', search: '', postcode: '' } });
    return (
        <>
            <form.Field name="name">{(field) => <Input {...bindInput(field)} aria-label="Name" />}</form.Field>
            <form.Field name="note">{(field) => <Textarea {...bindInput(field)} aria-label="Note" />}</form.Field>
            <form.Field name="password">
                {(field) => <PasswordInput {...bindInput(field)} aria-label="Password" />}
            </form.Field>
            <form.Field name="search">{(field) => <SearchField {...bindValue(field)} label="Search" />}</form.Field>
            <form.Field name="postcode">
                {(field) => <MaskInput {...bindValue(field)} mask="99999" aria-label="Postcode" />}
            </form.Field>
        </>
    );
}
