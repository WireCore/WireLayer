'use client';

import { Button, Checkbox, confirm, DatePicker, Field, Input, Select, toast } from '@wirecore/wirelayer-react';
import { Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { usePageTexts } from '../shell';

const services = [
    { value: 'web', label: 'Software & Web' },
    { value: 'hosting', label: 'Managed Hosting' },
    { value: 'cloud', label: 'Cloud & DevOps' },
];

export function RequestForm() {
    const t = usePageTexts();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [service, setService] = useState<string | null>(null);
    const [date, setDate] = useState<string | null>(null);
    const [consent, setConsent] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const missing = (value: unknown) => submitted && !value;

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        if (!name || !email || !service || !consent) return;
        if (!(await confirm({ title: t.confirm }))) return;
        toast({ title: t.sent, description: `${name} · ${service}`, type: 'success' });
    };

    return (
        <form className="flex max-w-lg flex-col gap-4 p-6" noValidate onSubmit={submit}>
            <h1 className="text-2xl font-semibold">{t.request}</h1>
            <Field label={t.name} required error={missing(name) ? t.required : undefined}>
                <Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
            </Field>
            <Field label={t.email} required error={missing(email) ? t.required : undefined}>
                <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                />
            </Field>
            <Field label={t.service} required error={missing(service) ? t.required : undefined}>
                <Select items={services} value={service} onValueChange={setService} />
            </Field>
            <Field label={t.date}>
                <DatePicker value={date} onValueChange={setDate} />
            </Field>
            <Checkbox
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
                invalid={missing(consent)}
            >
                {t.consent}
            </Checkbox>
            <Button type="submit" trailingIcon={Send} className="self-start">
                {t.send}
            </Button>
        </form>
    );
}
